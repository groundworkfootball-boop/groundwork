import { describe, it, expect } from 'vitest';
import {
  calculateMatchScore,
  type PlayerProfile,
  type ClubPreferences,
  type MatchingWeights,
} from './scoringEngine';

describe('Deterministic Scoring Engine - Pure Mathematical Integrity', () => {
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

  describe('1. Positional Compatibility (Weight: 30%)', () => {
    it('exact position match yields 1.0 (0.30 weighted)', () => {
      const res = calculateMatchScore(basePlayer, { ...baseClub, targetPositions: ['ST'] });
      expect(res.positionMatch).toBe(0.30);
    });

    it('adjacent position match (e.g., LB vs LWB, CM vs CDM, ST vs CF) yields 0.5 (0.15 weighted)', () => {
      const defenderPlayer: PlayerProfile = {
        ...basePlayer,
        positions: ['LWB'],
      };
      const defenderClub: ClubPreferences = {
        ...baseClub,
        targetPositions: ['LB'],
      };
      const res = calculateMatchScore(defenderPlayer, defenderClub);
      expect(res.positionMatch).toBe(0.15); // 0.5 * 0.30
    });

    it('incompatible position match (e.g., GK vs ST) yields 0.0 (0.00 weighted)', () => {
      const res = calculateMatchScore(basePlayer, { ...baseClub, targetPositions: ['GK'] });
      expect(res.positionMatch).toBe(0.00);
    });
  });

  describe('2. Distance & Region (Weight: 15%)', () => {
    it('same region yields 1.0 (0.15 weighted)', () => {
      const res = calculateMatchScore(basePlayer, { ...baseClub, region: 'London' });
      expect(res.distanceMatch).toBe(0.15);
    });

    it('different region yields 0.0 (0.00 weighted)', () => {
      const res = calculateMatchScore(basePlayer, { ...baseClub, region: 'North West' });
      expect(res.distanceMatch).toBe(0.00);
    });
  });

  describe('3. Playing Level Boundary (Weight: 20%)', () => {
    it('exact level match (diff = 0) yields 1.0 (0.20 weighted)', () => {
      const res = calculateMatchScore({ ...basePlayer, playingLevel: 8 }, { ...baseClub, targetLevel: 8 });
      expect(res.levelMatch).toBe(0.20);
    });

    it('1 tier difference yields 0.8 (0.16 weighted)', () => {
      const res = calculateMatchScore({ ...basePlayer, playingLevel: 7 }, { ...baseClub, targetLevel: 8 });
      expect(res.levelMatch).toBeCloseTo(0.16, 5);
    });

    it('5+ tier difference clamps to 0.0 (0.00 weighted)', () => {
      const res = calculateMatchScore({ ...basePlayer, playingLevel: 2 }, { ...baseClub, targetLevel: 8 });
      expect(res.levelMatch).toBe(0.00);
    });
  });

  describe('4. Attributes Boundary (Weight: 20%)', () => {
    it('perfect 10.0 ratings yield 1.0 (0.20 weighted)', () => {
      const perfectPlayer: PlayerProfile = {
        ...basePlayer,
        skillRatings: { pace: 10, shooting: 10, passing: 10, dribbling: 10 },
      };
      const res = calculateMatchScore(perfectPlayer, baseClub);
      expect(res.attributesMatch).toBe(0.20);
    });

    it('average 5.0 ratings yield 0.5 (0.10 weighted)', () => {
      const avgPlayer: PlayerProfile = {
        ...basePlayer,
        skillRatings: { pace: 5, shooting: 5, passing: 5, dribbling: 5 },
      };
      const res = calculateMatchScore(avgPlayer, baseClub);
      expect(res.attributesMatch).toBe(0.10);
    });
  });

  describe('5. Availability Overlap Boundary (Weight: 10%)', () => {
    it('100% overlap yields 1.0 (0.10 weighted)', () => {
      const res = calculateMatchScore(basePlayer, {
        ...baseClub,
        requiredAvailability: ['Tuesday Eve', 'Thursday Eve'],
      });
      expect(res.availabilityMatch).toBe(0.10);
    });

    it('50% overlap yields 0.5 (0.05 weighted)', () => {
      const res = calculateMatchScore(basePlayer, {
        ...baseClub,
        requiredAvailability: ['Tuesday Eve', 'Sunday Morning'], // only Tuesday Eve overlaps
      });
      expect(res.availabilityMatch).toBe(0.05);
    });

    it('0% overlap yields 0.0 (0.00 weighted)', () => {
      const res = calculateMatchScore(basePlayer, {
        ...baseClub,
        requiredAvailability: ['Friday Eve', 'Sunday Morning'],
      });
      expect(res.availabilityMatch).toBe(0.00);
    });
  });

  describe('6. Visibility Boost (Weight: 5%)', () => {
    it('active boost gives exact +0.05 bonus and nothing more', () => {
      const unboosted = calculateMatchScore(basePlayer, baseClub);
      const boosted = calculateMatchScore({ ...basePlayer, hasActiveBoost: true }, baseClub);

      expect(unboosted.boostMatch).toBe(0.00);
      expect(boosted.boostMatch).toBe(0.05);
      expect(boosted.totalScore).toBeCloseTo(unboosted.totalScore + 0.05, 3);
    });
  });

  describe('7. Configuration Versions & Custom Weights', () => {
    it('respects admin custom weights configuration', () => {
      const customWeights: MatchingWeights = {
        POSITION: 0.50,
        DISTANCE: 0.10,
        LEVEL: 0.10,
        ATTRIBUTES: 0.10,
        AVAILABILITY: 0.10,
        BOOST: 0.10,
      };

      const res = calculateMatchScore(basePlayer, baseClub, customWeights);
      expect(res.positionMatch).toBe(0.50);
      expect(res.distanceMatch).toBe(0.10);
    });
  });

  describe('8. Reproducibility & Race Condition Immutability', () => {
    it('repeated executions produce mathematically identical results (pure function)', () => {
      const results = Array.from({ length: 50 }, () => calculateMatchScore(basePlayer, baseClub));
      const first = results[0];

      results.forEach((r) => {
        expect(r.totalScore).toBe(first.totalScore);
        expect(r.positionMatch).toBe(first.positionMatch);
        expect(r.distanceMatch).toBe(first.distanceMatch);
        expect(r.levelMatch).toBe(first.levelMatch);
        expect(r.attributesMatch).toBe(first.attributesMatch);
        expect(r.availabilityMatch).toBe(first.availabilityMatch);
        expect(r.boostMatch).toBe(first.boostMatch);
      });
    });

    it('total score is always clamped between 0.0 and 1.0', () => {
      const maxedPlayer: PlayerProfile = {
        positions: ['ST'],
        region: 'London',
        playingLevel: 10,
        skillRatings: { pace: 10, shooting: 10, passing: 10, dribbling: 10 },
        availability: ['Tuesday Eve'],
        hasActiveBoost: true,
      };
      const matchingClub: ClubPreferences = {
        targetPositions: ['ST'],
        region: 'London',
        targetLevel: 10,
        requiredAvailability: ['Tuesday Eve'],
      };

      const res = calculateMatchScore(maxedPlayer, matchingClub);
      expect(res.totalScore).toBeLessThanOrEqual(1.0);
      expect(res.totalScore).toBeGreaterThanOrEqual(0.0);
    });
  });
});
