import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../shared/firebaseAdmin.js';
import { requireUid } from '../shared/authz.js';
import { getAIProvider } from './claude.js';
import { hashContent } from './provider.js';

/**
 * AI PLAYER IMPROVEMENT RECOMMENDATIONS (SYSTEM 2 — advisory only)
 *
 * Reads ONLY the caller's own structured profile data. Never reads another
 * player's data, never writes to matchResults/playerScores, and is never
 * surfaced to clubs.
 */

const SYSTEM_PROMPT = `You are a football profile coach. You receive a JSON object describing ONE player's own profile completeness signals.
Produce 2-5 concrete, actionable recommendations that would improve their discoverability to clubs.

Rules:
- Use ONLY the provided signals. Never invent statistics, clubs, or attributes.
- Never rate, rank, or predict the player's ability or potential.
- Never infer age, ethnicity, health, religion, or any sensitive attribute.
- Never mention other players or compare the player to anyone.
- Each recommendation must be something the player can do in the product.
- Respond ONLY with JSON: {"recommendations":[{"action":string,"reason":string,"priority":"high"|"medium"|"low"}]}`;

const SYSTEM_PROMPT_VERSION = 'player-recommendations-v1';

interface Signals {
  hasPhoto: boolean;
  positionCount: number;
  hasPlayingLevel: boolean;
  availabilityCount: number;
  skillRatingCount: number;
  hasHistory: boolean;
  hasBio: boolean;
  videoCount: number;
  hasRegion: boolean;
  profileCompleteness: number;
  searchable: boolean;
  hasActiveBoost: boolean;
}

interface ModelOutput {
  recommendations?: Array<{ action?: unknown; reason?: unknown; priority?: unknown }>;
}

export interface PlayerRecommendation {
  action: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

const PRIORITIES = new Set(['high', 'medium', 'low']);

/** Deterministic fallback used when no AI provider is configured. */
function deterministicRecommendations(signals: Signals): PlayerRecommendation[] {
  const out: PlayerRecommendation[] = [];
  if (!signals.hasPhoto) {
    out.push({
      action: 'Add a profile photo',
      reason: 'Profiles with a photo are easier for recruiters to recognise and revisit.',
      priority: 'high',
    });
  }
  if (signals.positionCount === 0) {
    out.push({
      action: 'Set your primary and secondary positions',
      reason: 'Position compatibility is the heaviest dimension in the matching engine.',
      priority: 'high',
    });
  }
  if (signals.availabilityCount === 0) {
    out.push({
      action: 'Declare your training availability',
      reason: 'Availability overlap contributes to every club match score.',
      priority: 'high',
    });
  }
  if (signals.skillRatingCount < 3) {
    out.push({
      action: 'Log your technical and physical attributes',
      reason: 'Attribute scores are a weighted dimension of the match calculation.',
      priority: 'medium',
    });
  }
  if (signals.videoCount === 0) {
    out.push({
      action: 'Upload a match clip',
      reason: 'Video gives recruiters observable evidence beyond written attributes.',
      priority: 'medium',
    });
  }
  if (!signals.hasHistory && !signals.hasBio) {
    out.push({
      action: 'Add playing history or a short bio',
      reason: 'Context helps a recruiter understand your pathway at a glance.',
      priority: 'low',
    });
  }
  return out.slice(0, 5);
}

export const getPlayerRecommendations = onCall(async (request) => {
  const uid = requireUid(request);

  const snap = await adminDb.collection('players').doc(uid).get();
  if (!snap.exists) throw new HttpsError('not-found', 'Player profile not found.');
  const player = snap.data() ?? {};

  // Youth safety: never send youth data to a provider without granted consent.
  if (player.isYouth === true && player.consentStatus !== 'granted') {
    return {
      recommendations: [] as PlayerRecommendation[],
      advisoryOnly: true as const,
      source: 'blocked-consent' as const,
    };
  }

  const signals: Signals = {
    hasPhoto: Boolean(player.photoUrl),
    positionCount: Array.isArray(player.positions) ? player.positions.length : 0,
    hasPlayingLevel: typeof player.playingLevel === 'number' && player.playingLevel > 0,
    availabilityCount: Array.isArray(player.availability) ? player.availability.length : 0,
    skillRatingCount:
      (player.skillRatings && Object.keys(player.skillRatings).length) +
      (player.physicalAttributes && Object.keys(player.physicalAttributes).length) +
      (player.mentalAttributes && Object.keys(player.mentalAttributes).length),
    hasHistory: Boolean(player.playingHistory && String(player.playingHistory).trim()),
    hasBio: Boolean(player.bio && String(player.bio).trim()),
    videoCount: typeof player.videoCount === 'number' ? player.videoCount : 0,
    hasRegion: Boolean(player.region),
    profileCompleteness: typeof player.profileCompleteness === 'number' ? player.profileCompleteness : 0,
    searchable: player.searchable === true,
    hasActiveBoost: player.boostStatus === 'active',
  };

  const contentHash = hashContent({ signals, v: SYSTEM_PROMPT_VERSION });

  // Serve a previously generated result for identical signals.
  const cachedSnap = await adminDb
    .collection('aiResults')
    .where('ownerId', '==', uid)
    .where('feature', '==', 'player-recommendations')
    .where('contentHash', '==', contentHash)
    .limit(1)
    .get();

  if (!cachedSnap.empty) {
    const cached = cachedSnap.docs[0].data();
    return {
      recommendations: (cached.recommendations ?? []) as PlayerRecommendation[],
      advisoryOnly: true as const,
      source: 'cache' as const,
    };
  }

  const provider = getAIProvider();
  let recommendations: PlayerRecommendation[];

  if (provider.name === 'stub') {
    recommendations = deterministicRecommendations(signals);
  } else {
    try {
      const result = await provider.completeJSON<ModelOutput>({
        purpose: 'player-recommendations',
        systemPrompt: SYSTEM_PROMPT,
        systemPromptVersion: SYSTEM_PROMPT_VERSION,
        userPrompt: JSON.stringify({ signals }),
        maxTokens: 700,
        temperature: 0.2,
        jsonSchema: {
          type: 'object',
          properties: {
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  action: { type: 'string' },
                  reason: { type: 'string' },
                  priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                },
                required: ['action', 'reason', 'priority'],
              },
            },
          },
          required: ['recommendations'],
        },
      });

      recommendations = (result.data.recommendations ?? [])
        .filter((item) => typeof item.action === 'string' && typeof item.reason === 'string')
        .slice(0, 5)
        .map((item) => ({
          action: String(item.action).slice(0, 160),
          reason: String(item.reason).slice(0, 400),
          priority: PRIORITIES.has(String(item.priority)) ? (item.priority as PlayerRecommendation['priority']) : 'medium',
        }));

      if (recommendations.length === 0) recommendations = deterministicRecommendations(signals);
    } catch (err) {
      console.error('player recommendations AI failed', err);
      recommendations = deterministicRecommendations(signals);
    }
  }

  await adminDb.collection('aiResults').add({
    ownerId: uid,
    feature: 'player-recommendations',
    contentHash,
    promptVersion: SYSTEM_PROMPT_VERSION,
    recommendations,
    advisoryOnly: true,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { recommendations, advisoryOnly: true as const, source: 'generated' as const };
});
