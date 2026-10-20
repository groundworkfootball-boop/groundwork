import { describe, expect, it } from 'vitest';
import { deriveRecommendations } from './playerSignals';
import type { PlayerRecord } from '../app/types';

function player(overrides: Partial<PlayerRecord> = {}): PlayerRecord {
  return {
    id: 'p1',
    uid: 'p1',
    displayName: 'Test Player',
    photoUrl: 'https://example.com/a.jpg',
    positions: ['CM'],
    availability: ['weekday-evening'],
    region: 'Manchester',
    skillRatings: { passing: 70, dribbling: 65, shooting: 60 },
    physicalAttributes: { pace: 70 },
    mentalAttributes: { positioning: 68 },
    videoCount: 2,
    bio: 'Sunday league midfielder.',
    currentClub: 'Test FC',
    ...overrides,
  } as PlayerRecord;
}

describe('deriveRecommendations', () => {
  it('returns nothing for a null profile', () => {
    expect(deriveRecommendations(null)).toEqual([]);
  });

  it('returns nothing when every signal is present', () => {
    expect(deriveRecommendations(player())).toEqual([]);
  });

  it('flags a missing photo as high priority', () => {
    const recs = deriveRecommendations(player({ photoUrl: undefined }));
    expect(recs).toHaveLength(1);
    expect(recs[0].priority).toBe('high');
    expect(recs[0].action).toMatch(/photo/i);
  });

  it('flags missing positions and availability', () => {
    const recs = deriveRecommendations(player({ positions: [], availability: [] }));
    const actions = recs.map((r) => r.action).join(' | ');
    expect(actions).toMatch(/positions/i);
    expect(actions).toMatch(/availability/i);
  });

  it('flags sparse attributes when fewer than three ratings exist', () => {
    const recs = deriveRecommendations(
      player({ skillRatings: { passing: 70 }, physicalAttributes: {}, mentalAttributes: {} }),
    );
    expect(recs.some((r) => /attributes/i.test(r.action))).toBe(true);
  });

  it('flags a missing video and region', () => {
    const recs = deriveRecommendations(player({ videoCount: 0, region: undefined }));
    expect(recs.some((r) => /clip/i.test(r.action))).toBe(true);
    expect(recs.some((r) => /region/i.test(r.action))).toBe(true);
  });

  it('never returns more than six suggestions', () => {
    const recs = deriveRecommendations(
      player({
        photoUrl: undefined,
        positions: [],
        availability: [],
        region: undefined,
        videoCount: 0,
        bio: '',
        currentClub: undefined,
        skillRatings: {},
        physicalAttributes: {},
        mentalAttributes: {},
      }),
    );
    expect(recs.length).toBeLessThanOrEqual(6);
  });

  it('is deterministic across repeated calls', () => {
    const p = player({ photoUrl: undefined, videoCount: 0 });
    expect(deriveRecommendations(p)).toEqual(deriveRecommendations(p));
  });

  it('never emits a numeric score or rating field', () => {
    const recs = deriveRecommendations(player({ photoUrl: undefined, videoCount: 0 }));
    for (const rec of recs) {
      expect(Object.keys(rec).sort()).toEqual(['action', 'priority', 'reason']);
    }
  });
});
