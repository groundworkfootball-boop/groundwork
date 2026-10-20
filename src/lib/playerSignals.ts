import type { PlayerRecord } from '../app/types';

export interface SignalRecommendation {
  action: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Deterministic, rule-based suggestions derived only from the player's own
 * profile signals. This is the fallback when the AI callable is unavailable,
 * and it never rates ability or influences match scores.
 */
export function deriveRecommendations(player: PlayerRecord | null): SignalRecommendation[] {
  if (!player) return [];
  const out: SignalRecommendation[] = [];

  if (!player.photoUrl) {
    out.push({
      action: 'Add a profile photo',
      reason: 'Profiles with a photo are easier for recruiters to recognise and revisit.',
      priority: 'high',
    });
  }
  if (!player.positions?.length) {
    out.push({
      action: 'Set your primary and secondary positions',
      reason: 'Position compatibility is the heaviest dimension in the matching engine.',
      priority: 'high',
    });
  }
  if (!player.availability?.length) {
    out.push({
      action: 'Declare your training availability',
      reason: 'Availability overlap contributes to every club match score.',
      priority: 'high',
    });
  }

  const ratingCount =
    Object.keys(player.skillRatings ?? {}).length +
    Object.keys(player.physicalAttributes ?? {}).length +
    Object.keys(player.mentalAttributes ?? {}).length;
  if (ratingCount < 3) {
    out.push({
      action: 'Log your technical and physical attributes',
      reason: 'Attribute scores are a weighted dimension of the match calculation.',
      priority: 'medium',
    });
  }
  if (!player.videoCount) {
    out.push({
      action: 'Upload a match clip',
      reason: 'Video gives recruiters observable evidence beyond written attributes.',
      priority: 'medium',
    });
  }
  if (!player.region) {
    out.push({
      action: 'Set your region',
      reason: 'Distance is a weighted dimension — without a region the engine cannot score it.',
      priority: 'medium',
    });
  }
  if (!player.bio?.trim() && !player.currentClub) {
    out.push({
      action: 'Add playing history or a short bio',
      reason: 'Context helps a recruiter understand your pathway at a glance.',
      priority: 'low',
    });
  }

  return out.slice(0, 6);
}
