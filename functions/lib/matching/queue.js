import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../shared/firebaseAdmin.js';
import { writeAuditLog } from '../shared/audit.js';
import { calculateMatchScore } from './calculateMatchResult.js';
import { getActiveMatchConfig } from '../shared/config.js';
/** Enqueue a scoring recalculation. Deduplicates identical pending jobs. */
export async function enqueueMatchJob(jobType, id) {
    const field = jobType === 'player' ? 'playerId' : 'clubId';
    const existing = await adminDb
        .collection('matchingJobs')
        .where(field, '==', id)
        .where('jobType', '==', jobType)
        .where('status', 'in', ['pending', 'processing'])
        .limit(1)
        .get();
    if (!existing.empty)
        return; // already queued
    await adminDb.collection('matchingJobs').add({
        jobType,
        [field]: id,
        status: 'pending',
        attempts: 0,
        createdAt: FieldValue.serverTimestamp(),
    });
}
/** Is a club eligible to receive this player's match results? */
function clubEligibleForPlayer(club, player) {
    if (player.isYouth) {
        if (club.verifiedYouth !== true)
            return false;
        const expiresAt = club.youthVerificationExpiresAt;
        if (expiresAt) {
            const expiryMs = expiresAt instanceof Date
                ? expiresAt.getTime()
                : typeof expiresAt === 'object' && expiresAt !== null && 'seconds' in expiresAt
                    ? Number(expiresAt.seconds) * 1000
                    : Number.NaN;
            if (!Number.isNaN(expiryMs) && expiryMs < Date.now())
                return false;
        }
    }
    return true;
}
/**
 * Compare-and-set write that implements optimistic concurrency:
 * a stale worker must NEVER overwrite a newer calculation.
 * The result is only written when the incoming snapshot is at least as new as
 * what is already stored, for both `updatedAtMs` and `calculationVersion`.
 */
async function writeMatchResultConcurrent(resultId, data, updatedAtMs, calculationVersion) {
    let wrote = false;
    await adminDb.runTransaction(async (tx) => {
        const ref = adminDb.collection('matchResults').doc(resultId);
        const existingSnap = await tx.get(ref);
        if (existingSnap.exists) {
            const existing = existingSnap.data() ?? {};
            const existsAt = Number(existing.updatedAtMs ?? 0);
            const existsVersion = Number(existing.calculationVersion ?? 0);
            if (existsAt > updatedAtMs)
                return; // newer data already present
            if (existsAt === updatedAtMs && existsVersion > calculationVersion)
                return;
        }
        tx.set(ref, data, { merge: true });
        wrote = true;
    });
    return wrote;
}
/**
 * Score ONE player against ONE club and store the match result.
 * Youth players are only scored against verified, non-expired clubs.
 */
export async function scorePair(playerDoc, playerUpdatedAtMs, clubDoc) {
    const resultId = `${clubDoc.uid}_${playerDoc.uid}`;
    if (!playerDoc.searchable) {
        await adminDb.collection('matchResults').doc(resultId).delete();
        return;
    }
    if (!clubEligibleForPlayer(clubDoc, playerDoc)) {
        await adminDb.collection('matchResults').doc(resultId).delete();
        return;
    }
    const config = await getActiveMatchConfig();
    const breakdown = calculateMatchScore(playerDoc, clubDoc, config);
    const base = {
        clubId: clubDoc.uid,
        playerId: playerDoc.uid,
        matchScore: breakdown.score,
        scoreBreakdown: {
            positionScore: breakdown.positionScore,
            distanceScore: breakdown.distanceScore,
            levelScore: breakdown.levelScore,
            attributeScore: breakdown.attributeScore,
            availabilityScore: breakdown.availabilityScore,
            boostScore: breakdown.boostScore,
        },
        position: playerDoc.positions?.[0] ?? 'unknown',
        ageBand: playerDoc.isYouth ? 'youth' : 'adult',
        region: playerDoc.region ?? clubDoc.region ?? 'unknown',
        searchable: playerDoc.searchable,
        configVersion: breakdown.configVersion,
        calculationVersion: config.version,
        updatedAtMs: playerUpdatedAtMs,
        scoredAt: FieldValue.serverTimestamp(),
    };
    await writeMatchResultConcurrent(resultId, base, playerUpdatedAtMs, config.version);
}
/** Recompute one player against every eligible club (player profile change). */
export async function recalcPlayer(playerId) {
    const playerSnap = await adminDb.collection('players').doc(playerId).get();
    if (!playerSnap.exists()) {
        await removePlayerMatchResults(playerId);
        return { scored: 0 };
    }
    const data = playerSnap.data() ?? {};
    const playerDoc = {
        uid: playerId,
        positions: data.positions,
        region: data.region,
        playingLevel: data.playingLevel,
        availability: data.availability,
        trainingAvailability: data.trainingAvailability,
        trialAvailability: data.trialAvailability,
        skillRatings: data.skillRatings,
        physicalAttributes: data.physicalAttributes,
        mentalAttributes: data.mentalAttributes,
        profileCompleteness: data.profileCompleteness,
        boostsActive: data.boostsActive,
        searchable: data.searchable,
        isYouth: data.isYouth,
    };
    const updatedAtMs = data.updatedAtMs ?? Date.now();
    if (playerDoc.isYouth) {
        const youthSnap = await adminDb.collection('youthProfiles').doc(playerId).get();
        if (youthSnap.exists() && youthSnap.data()?.consentStatus !== 'granted') {
            await removePlayerMatchResults(playerId);
            return { scored: 0 };
        }
    }
    const clubs = await adminDb.collection('clubs').get();
    let scored = 0;
    for (const clubSnap of clubs.docs) {
        const clubData = clubSnap.data() ?? {};
        const clubDoc = {
            uid: clubSnap.id,
            region: clubData.region,
            preferredRadiusKm: clubData.preferredRadiusKm,
            targetPositions: clubData.targetPositions,
            targetPlayingLevels: clubData.targetPlayingLevels,
            trainingAvailability: clubData.trainingAvailability,
            trialAvailability: clubData.trialAvailability,
            verifiedYouth: clubData.verifiedYouth,
            youthVerificationExpiresAt: clubData.youthVerificationExpiresAt,
        };
        await scorePair(playerDoc, updatedAtMs, clubDoc);
        scored += 1;
    }
    return { scored };
}
/** Recompute every player against a single club (club profile change / config change). */
export async function recalcClub(clubId) {
    const clubSnap = await adminDb.collection('clubs').doc(clubId).get();
    if (!clubSnap.exists())
        return { scored: 0 };
    const clubData = clubSnap.data() ?? {};
    const clubDoc = {
        uid: clubId,
        region: clubData.region,
        preferredRadiusKm: clubData.preferredRadiusKm,
        targetPositions: clubData.targetPositions,
        targetPlayingLevels: clubData.targetPlayingLevels,
        trainingAvailability: clubData.trainingAvailability,
        trialAvailability: clubData.trialAvailability,
        verifiedYouth: clubData.verifiedYouth,
        youthVerificationExpiresAt: clubData.youthVerificationExpiresAt,
    };
    const players = await adminDb.collection('players').get();
    let scored = 0;
    for (const playerSnap of players.docs) {
        const data = playerSnap.data() ?? {};
        if (data.isYouth === true) {
            const youthSnap = await adminDb.collection('youthProfiles').doc(playerSnap.id).get();
            if (youthSnap.exists() && youthSnap.data()?.consentStatus !== 'granted')
                continue;
        }
        const playerDoc = {
            uid: playerSnap.id,
            positions: data.positions,
            region: data.region,
            playingLevel: data.playingLevel,
            availability: data.availability,
            trainingAvailability: data.trainingAvailability,
            trialAvailability: data.trialAvailability,
            skillRatings: data.skillRatings,
            physicalAttributes: data.physicalAttributes,
            mentalAttributes: data.mentalAttributes,
            profileCompleteness: data.profileCompleteness,
            boostsActive: data.boostsActive,
            searchable: data.searchable,
            isYouth: data.isYouth,
        };
        const updatedAtMs = data.updatedAtMs ?? Date.now();
        await scorePair(playerDoc, updatedAtMs, clubDoc);
        scored += 1;
    }
    return { scored };
}
/** Remove all match results for a player (consent withdrawal, deletion). */
export async function removePlayerMatchResults(playerId) {
    const results = await adminDb.collection('matchResults').where('playerId', '==', playerId).get();
    const batch = adminDb.batch();
    for (const doc of results.docs)
        batch.delete(doc.ref);
    await batch.commit();
}
/** Full sweep used after a matching config version change. */
export async function recalcAll() {
    const players = await adminDb.collection('players').get();
    let scored = 0;
    for (const playerSnap of players.docs) {
        await recalcPlayer(playerSnap.id);
        scored += 1;
    }
    await writeAuditLog({
        action: 'matching_recalculated_all',
        resourceType: 'matchingConfigs',
        resourceId: 'default',
        actorId: 'system',
        actorRole: 'system',
    });
    return { scored };
}
