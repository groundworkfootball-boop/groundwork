import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { adminDb } from '../shared/firebaseAdmin.js';
import { requireRole } from '../shared/authz.js';
import { getAIProvider } from './claude.js';
const SYSTEM_PROMPT = `You are a football squad analysis assistant.
Given a club's current squad (positions and roles) and target positions, identify coverage gaps.
Respond ONLY with JSON matching:
{"gaps":[{"position":string,"severity":"low|medium|high","note":string}],"summary":string}
Be concise. Never invent player names. This output is advisory only and must not affect
player matching, scoring, or selection decisions.`;
const SYSTEM_PROMPT_VERSION = 'squad-gap-v1';
function positionOf(member) {
    const direct = typeof member.position === 'string' ? member.position : '';
    const positions = Array.isArray(member.positions) ? member.positions : [];
    const first = typeof positions[0] === 'string' ? positions[0] : '';
    return direct || first || 'unknown';
}
/**
 * AI squad gap analysis for a club's own squad. Reads only the caller's squad
 * data and returns advisory output — it never writes to match/score data.
 */
export const analyzeSquadGaps = onCall(async (request) => {
    const uid = await requireRole(request, 'club');
    const { clubId } = (request.data ?? {});
    const targetClubId = clubId ?? uid;
    if (targetClubId !== uid) {
        // Clubs may only analyze their own squad.
        throw new HttpsError('permission-denied', 'You may only analyze your own squad.');
    }
    const [clubSnap, squadSnap] = await Promise.all([
        adminDb.collection('clubs').doc(targetClubId).get(),
        adminDb.collection('squadMembers').where('clubId', '==', targetClubId).get(),
    ]);
    const club = clubSnap.data() ?? {};
    const members = squadSnap.docs.map((d) => d.data());
    const squad = members.map((m) => ({
        position: positionOf(m),
        status: typeof m.status === 'string' ? m.status : 'active',
        isYouth: m.isYouth === true,
    }));
    const userPrompt = JSON.stringify({
        clubName: club.name ?? 'Club',
        targetPositions: club.targetPositions ?? [],
        squad,
    });
    const provider = getAIProvider();
    const { data } = await provider.completeJSON({
        purpose: 'squad_gap_analysis',
        systemPrompt: SYSTEM_PROMPT,
        systemPromptVersion: SYSTEM_PROMPT_VERSION,
        userPrompt,
        maxTokens: 1200,
        temperature: 0.2,
    });
    return {
        ...data,
        advisoryOnly: true,
        squadSize: members.length,
    };
});
