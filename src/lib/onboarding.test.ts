import { describe, expect, it } from 'vitest';
import { ageBandFor, calculateAge, playerCompleteness, AGE_GROUPS, POSITIONS, REGIONS } from './onboarding';

function dobForAge(age: number): string {
  const now = new Date();
  const date = new Date(now.getFullYear() - age, now.getMonth(), now.getDate());
  return date.toISOString().slice(0, 10);
}

describe('onboarding · age banding', () => {
  it('returns null for an empty or invalid date', () => {
    expect(calculateAge('')).toBeNull();
    expect(calculateAge('not-a-date')).toBeNull();
  });

  it('computes age from a date of birth', () => {
    expect(calculateAge(dobForAge(24))).toBe(24);
    expect(calculateAge(dobForAge(15))).toBe(15);
  });

  it('bands youth correctly at each boundary', () => {
    expect(ageBandFor(9)).toBe('U11');
    expect(ageBandFor(11)).toBe('U13');
    expect(ageBandFor(13)).toBe('U15');
    expect(ageBandFor(15)).toBe('U16');
    expect(ageBandFor(16)).toBe('U18');
    expect(ageBandFor(18)).toBe('U21');
    expect(ageBandFor(22)).toBe('Senior');
  });

  it('never bands a missing age into a youth group', () => {
    expect(ageBandFor(null)).toBe('Unknown');
  });
});

describe('onboarding · profile completeness', () => {
  it('scores an empty profile at zero', () => {
    expect(playerCompleteness({})).toBe(0);
  });

  it('reaches exactly 100 for a fully populated profile', () => {
    const score = playerCompleteness({
      photoUrl: 'https://example.com/photo.jpg',
      positions: ['CM'],
      playingLevel: 4,
      availability: ['Tue Eve'],
      skillRatings: { passing: 8 },
      bio: 'A' .repeat(30),
      videoCount: 2,
      region: 'London',
      currentClub: 'Riverside FC',
    });
    expect(score).toBe(100);
  });

  it('is deterministic for identical input', () => {
    const input = {
      positions: ['ST'],
      playingLevel: 3,
      availability: ['Sat AM'],
      region: 'Midlands',
    };
    const first = playerCompleteness(input);
    const second = playerCompleteness(input);
    expect(first).toBe(second);
  });

  it('increases monotonically as evidence is added', () => {
    const base = playerCompleteness({ positions: ['CM'] });
    const withLevel = playerCompleteness({ positions: ['CM'], playingLevel: 4 });
    const withAvailability = playerCompleteness({ positions: ['CM'], playingLevel: 4, availability: ['Sat AM'] });

    expect(base).toBeLessThan(withLevel);
    expect(withLevel).toBeLessThan(withAvailability);
  });

  it('counts attributes once, not per rating bucket', () => {
    const skillsOnly = playerCompleteness({ skillRatings: { passing: 5 } });
    const allBuckets = playerCompleteness({
      skillRatings: { passing: 5 },
      physicalAttributes: { pace: 6 },
      mentalAttributes: { positioning: 7 },
    });
    // All three attribute buckets share a single 20-point weight.
    expect(skillsOnly).toBe(20);
    expect(allBuckets).toBe(20);
  });

  it('ignores zero-valued ratings', () => {
    expect(playerCompleteness({ skillRatings: { passing: 0 } })).toBe(0);
  });

  it('never exceeds 100', () => {
    const score = playerCompleteness({
      photoUrl: 'x',
      positions: ['CM', 'CDM'],
      playingLevel: 1,
      availability: ['Mon Eve', 'Tue Eve'],
      skillRatings: { passing: 10, dribbling: 10 },
      bio: 'Long bio',
      videoCount: 10,
      region: 'London',
      currentClub: 'Club',
    });
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('onboarding · option catalogues', () => {
  it('exposes every position the scoring engine understands', () => {
    expect(POSITIONS).toContain('GK');
    expect(POSITIONS).toContain('CM');
    expect(POSITIONS).toContain('ST');
    expect(new Set(POSITIONS).size).toBe(POSITIONS.length);
  });

  it('keeps age groups and regions unique', () => {
    expect(new Set(AGE_GROUPS).size).toBe(AGE_GROUPS.length);
    expect(new Set(REGIONS).size).toBe(REGIONS.length);
  });
});