import { describe, it, expect } from 'vitest';
import { calculateMatchScore, type PlayerProfile, type ClubPreferences } from './scoringEngine';

describe('Deterministic Scoring Engine', () => {
  const basePlayer: PlayerProfile = {
    positions: ['ST', 'CF'],
    region: 'London',
    playingLevel: 8,
    skillRatings: {
      pace: 8,
      shooting: 9,
      dribbling: 7,
      passing: 8,
    },
    availability: ['Tuesday Eve', 'Thursday Eve', 'Saturday'],
    hasActiveBoost: false,
  };

  const baseClub: ClubPreferences = {
    targetPositions: ['ST'],
    region: 'London',
    targetLevel: 8,
    requiredAvailability: ['Tuesday Eve', 'Thursday Eve'],
  };

  it('calculates deterministic score with exact matches', () => {
    const res1 = calculateMatchScore(basePlayer, baseClub);
    const res2 = calculateMatchScore(basePlayer, baseClub);

    // Pure function: repeated executions MUST produce identical results
    expect(res1.totalScore).toBe(res2.totalScore);
    expect(res1.positionMatch).toBe(0.30); // 1.0 * 0.30
    expect(res1.distanceMatch).toBe(0.15); // 1.0 * 0.15
    expect(res1.levelMatch).toBe(0.20);    // 1.0 * 0.20
    expect(res1.availabilityMatch).toBe(0.10); // 1.0 * 0.10
    expect(res1.boostMatch).toBe(0.00);    // 0.0 * 0.05
    expect(res1.totalScore).toBeGreaterThan(0.8);
  });

  it('handles position mismatch deterministically', () => {
    const clubDifferentPos: ClubPreferences = {
      ...baseClub,
      targetPositions: ['GK'],
    };
    const res = calculateMatchScore(basePlayer, clubDifferentPos);
    // When no position matches, score drops
    expect(res.positionMatch).toBeLessThan(0.30);
  });

  it('applies visibility boost bonus correctly', () => {
    const unboosted = calculateMatchScore(basePlayer, baseClub);
    const boosted = calculateMatchScore({ ...basePlayer, hasActiveBoost: true }, baseClub);

    expect(boosted.boostMatch).toBe(0.05);
    expect(boosted.totalScore).toBeCloseTo(unboosted.totalScore + 0.05, 5);
  });

  it('penalizes distance when regions differ', () => {
    const distantClub: ClubPreferences = {
      ...baseClub,
      region: 'North West',
    };
    const res = calculateMatchScore(basePlayer, distantClub);
    expect(res.distanceMatch).toBe(0);
  });
});
