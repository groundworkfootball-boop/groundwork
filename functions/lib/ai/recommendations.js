import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { adminDb } from '../shared/firebaseAdmin.js';
import { requireRole } from '../shared/authz.js';
import { getAIProvider } from './claude.js';
/**
 * AI narrative recommendations layered ON TOP of deterministic match results.
 *
 * Reads `matchResults` (produced solely by the deterministic engine), then
 * asks the model to write short human-readable headlines for the top N. The
 * AI can only REORDER and NARRATE within the deterministic top set — it can
 * never introduce, remove, or rescore players.
 */
const SYSTEM_PROMPT = `You are a recruitment assistant writing short recommendation headlines.
You will receive a list of pre-ranked candidates (already sorted by a deterministic score).
For each candidate write:
- headline: one sentence a recruiter would read first
- reasons: 2-3 short factual bullet points drawn ONLY from the provided data
Rules:
- Preserve the input order exactly; do not re-rank.
- Never invent statistics, clubs, or attributes not present in the input.
- Respond ONLY with JSON: {"recommendations":[{"playerId":string,"headline":string,"reasons":[string]}]}`;
const SYSTEM_PROMPT_VERSION = 'recommendations-v1';
/** Read-only server-side recommendations for a club's top matches. */
export const getAIRecommendations = onCall(async (request) => {
    const uid = await requireRole(request, 'club');
    const { limit } = (request.data ?? {});
    const topN = Math.min(Math.max(typeof limit === 'number' ? limit : 10, 1), 25);
    // Deterministic top-N from pre-computed match results (club-scoped read).
    const resultsSnap = await adminDb
        .collection('matchResults')
        .where('clubId', '==', uid)
        .orderBy('matchScore', 'desc')
        .limit(topN)
        .get();
    if (resultsSnap.empty) {
        return { recommendations: [], advisoryOnly: true, source: 'none' };
    }
    const playerIds = resultsSnap.docs.map((d) => d.data().playerId);
    // `in` queries support max 10 values — fetch profiles in chunks.
    const playersById = new Map();
    for (let i = 0; i < playerIds.length; i += 10) {
        const chunk = playerIds.slice(i, i + 10);
        const playersSnap = await adminDb
            .collection('players')
            .where('__name__', 'in', chunk)
            .get();
        for (const d of playersSnap.docs) {
            playersById.set(d.id, d.data());
        }
    }
    const candidates = resultsSnap.docs.map((d) => {
        const data = d.data();
        const p = playersById.get(data.playerId) ?? {};
        return {
            playerId: data.playerId,
            matchScore: Number(data.matchScore ?? 0),
            profile: {
                displayName: p.displayName ?? 'Player',
                positions: p.positions ?? [],
                region: p.region ?? '',
                playingLevel: p.playingLevel ?? 0,
                matchScore: data.matchScore,
                scoreBreakdown: data.scoreBreakdown ?? {},
            },
        };
    });
    const provider = getAIProvider();
    const { data } = await provider.completeJSON({
        purpose: 'recommendations',
        systemPrompt: SYSTEM_PROMPT,
        systemPromptVersion: SYSTEM_PROMPT_VERSION,
        userPrompt: JSON.stringify({ candidates }),
        maxTokens: 2000,
        temperature: 0.3,
    });
    // Merge model narration back onto the deterministic ranking. Unknown or
    // missing entries fall back to deterministic order with a generic headline.
    const byId = new Map((data.recommendations ?? [])
        .filter((r) => typeof r.playerId === 'string')
        .map((r) => [r.playerId, r]));
    const recommendations = candidates.map((c) => {
        const model = byId.get(c.playerId);
        const reasons = Array.isArray(model?.reasons)
            ? (model?.reasons).filter((x) => typeof x === 'string').slice(0, 3)
            : [`Match score ${Math.round(c.matchScore * 100)}%`];
        return {
            playerId: c.playerId,
            displayName: String(c.profile.displayName ?? 'Player'),
            headline: typeof model?.headline === 'string' && model.headline.length > 0
                ? model.headline.slice(0, 300)
                : `Ranked candidate (${Math.round(c.matchScore * 100)}% match)`,
            reasons,
        };
    });
    if (recommendations.length === 0) {
        throw new HttpsError('internal', 'AI returned no recommendations for known candidates.');
    }
    return {
        recommendations,
        advisoryOnly: true,
        source: 'matchResults',
    };
});
