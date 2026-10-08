import { onCall } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../shared/firebaseAdmin.js';
import { requireUid } from '../shared/authz.js';
import { parseInput, PLAYER_PROFILE_SCHEMA } from '../shared/validation.js';
import { enqueueMatchJob } from '../matching/queue.js';
/**
 * Deterministic profile completeness (0-100). AI is never involved.
 * Weights deliberately mirror the product spec's priority ordering.
 */
export function computeProfileCompleteness(profile) {
    const weights = [
        { ok: Boolean(profile.photoUrl), weight: 15 },
        { ok: Boolean(profile.positions?.length), weight: 15 },
        { ok: Boolean(profile.playingLevel), weight: 10 },
        { ok: Boolean(profile.availability?.length), weight: 10 },
        { ok: hasRatings(profile.skillRatings) || hasRatings(profile.physicalAttributes) || hasRatings(profile.mentalAttributes), weight: 20 },
        { ok: Boolean(profile.playingHistory?.trim() || profile.bio?.trim()), weight: 10 },
        { ok: Boolean(profile.videoCount && profile.videoCount > 0), weight: 10 },
        { ok: Boolean(profile.region), weight: 5 },
        { ok: Boolean(profile.currentClub || profile.previousClubs?.length), weight: 5 },
    ];
    const total = weights.reduce((sum, w) => sum + (w.ok ? w.weight : 0), 0);
    return Math.max(0, Math.min(100, total));
}
function hasRatings(map) {
    return Boolean(map && Object.values(map).some((v) => typeof v === 'number' && v > 0));
}
const PROFILE_FIELDS = new Set([
    'displayName', 'dob', 'positions', 'secondaryPositions', 'dominantFoot', 'heightCm',
    'playingLevel', 'currentClub', 'previousClubs', 'playingHistory', 'achievements',
    'availability', 'trainingAvailability', 'trialAvailability', 'region', 'preferredRadiusKm',
    'bio', 'skillRatings', 'physicalAttributes', 'mentalAttributes', 'photoUrl',
]);
/** Player updates their own profile. Server recomputes completeness + enqueues recalc. */
export const updatePlayerProfile = onCall(async (request) => {
    const uid = requireUid(request);
    const data = parseInput(PLAYER_PROFILE_SCHEMA, request.data);
    const profileRef = adminDb.collection('players').doc(uid);
    const existing = await profileRef.get();
    if (!existing.exists)
        throw new Error('player profile not found');
    const merged = { ...(existing.data() ?? {}), ...data };
    const completeness = computeProfileCompleteness(merged);
    const updatedAtMs = Date.now();
    await profileRef.update({
        ...data,
        profileCompleteness: completeness,
        updatedAtMs,
        updatedAt: FieldValue.serverTimestamp(),
    });
    await enqueueMatchJob('player', uid);
    return { ok: true, profileCompleteness: completeness };
});
/** Server-side profile completeness recalculation trigger (defense in depth). */
export async function recalcCompletenessForPlayer(uid) {
    const snap = await adminDb.collection('players').doc(uid).get();
    if (!snap.exists)
        return 0;
    const completeness = computeProfileCompleteness(snap.data() ?? {});
    await adminDb.collection('players').doc(uid).update({ profileCompleteness: completeness });
    return completeness;
}
export { PROFILE_FIELDS };
