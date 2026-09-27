import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../shared/firebaseAdmin.js';
import { requireUid } from '../shared/authz.js';
import { getAIProvider } from './claude.js';
/**
 * AI video tagging — advisory only.
 *
 * INVARIANT: tags written here NEVER influence matching scores. The matching
 * engine does not read `aiTags`.
 */
const SYSTEM_PROMPT = `You are a football clip analysis assistant.
You receive sampled frame descriptions, the declared position, and clip duration.
Generate ONLY observable descriptions of what is visible. Allowed examples:
dominant foot visible, wide camera framing, attacking third, defensive action,
ball control movement, passing sequence, shooting attempt, pressing, heading.
Never infer identity, age, personality, or any protected characteristic.
Never give scouting verdicts or ratings.
Respond ONLY with JSON: {"tags":string[<=8],"caption":string<=140}`;
const SYSTEM_PROMPT_VERSION = 'video-tag-v1';
/**
 * Worker/player-facing callable: runs advisory AI tagging for a processed
 * clip. Requires the caller to own the video (or be the video worker token
 * holder — in practice the processing worker calls this with the player's
 * context via Admin SDK instead).
 */
export const tagVideoContent = onCall(async (request) => {
    const uid = requireUid(request);
    const { videoId, frameNotes, declaredPosition, durationSec } = (request.data ?? {});
    if (typeof videoId !== 'string' || !videoId) {
        throw new HttpsError('invalid-argument', 'videoId is required.');
    }
    const videoSnap = await adminDb.collection('playerVideos').doc(videoId).get();
    if (!videoSnap.exists)
        throw new HttpsError('not-found', 'Video not found.');
    const video = videoSnap.data();
    if (video.playerId !== uid) {
        throw new HttpsError('permission-denied', 'You do not own this video.');
    }
    if (video.processingStatus !== 'ready') {
        throw new HttpsError('failed-precondition', 'Video is not processed yet.');
    }
    const provider = getAIProvider();
    const { data, usage } = await provider.completeJSON({
        purpose: 'video_tagging',
        systemPrompt: SYSTEM_PROMPT,
        systemPromptVersion: SYSTEM_PROMPT_VERSION,
        userPrompt: JSON.stringify({
            declaredPosition: typeof declaredPosition === 'string'
                ? declaredPosition
                : video.declaredPosition ?? '',
            durationSec: typeof durationSec === 'number'
                ? durationSec
                : video.durationSec ?? 0,
            frameNotes: Array.isArray(frameNotes)
                ? frameNotes.slice(0, 12).map((n) => String(n).slice(0, 300))
                : [],
        }),
        jsonSchema: {
            type: 'object',
            properties: {
                tags: { type: 'array', items: { type: 'string' }, maxItems: 8 },
                caption: { type: 'string' },
            },
            required: ['tags', 'caption'],
        },
        maxTokens: 400,
        temperature: 0.2,
    });
    const tags = (data.tags ?? []).slice(0, 8).map((t) => String(t).slice(0, 60));
    const caption = String(data.caption ?? '').slice(0, 140);
    await videoSnap.ref.update({
        aiTags: tags,
        aiCaption: caption,
        aiTaggedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });
    return { tags, caption, advisoryOnly: true, usage };
});
