# MATCHING ENGINE

The deterministic player–club scoring system. **AI never participates.**

## Contract

```ts
calculateMatchScore(player, club, config) => ScoreBreakdown
```

Pure function. No randomness, no `Date.now()`, no network, no AI. Identical
inputs always produce identical output.

## Weights (default config v1)

| Dimension | Weight | Field |
| --- | --- | --- |
| Position compatibility | 30% | `positionWeight` |
| Playing level | 20% | `levelWeight` |
| Attributes | 20% | `attributesWeight` |
| Distance / region | 15% | `distanceWeight` |
| Availability overlap | 10% | `availabilityWeight` |
| Active boost | 5% | `boostWeight` |

Weights live in `matchingConfigs/default` and must sum to 1.0. Every change
creates a new document in `matchingConfigVersions` with an incremented
`version`. Historical `matchResults` retain the `configVersion` they were
scored under — they are never silently rewritten.

## Dimension rules

**Position** — exact match `1.0`, adjacent position `0.5`, incompatible `0`.
Adjacency is a fixed table (`RB↔RWB`, `CM↔CDM`, `CM↔CAM`, `ST↔CF`, …).

**Distance** — same region `1.0`. Otherwise a deterministic decay based on the
club's `preferredRadiusKm`; no geocoding, no external calls.

**Playing level** — `1 - |playerLevel - clubTargetLevel| / 10`, clamped to
`[0, 1]`.

**Attributes** — weighted average of `skillRatings`, `physicalAttributes` and
`mentalAttributes`, each normalised from 1–10 to 0–1. Falls back to
`profileCompleteness / 100` when no ratings exist.

**Availability** — overlap ratio between player availability and the club's
training/trial slots.

**Boost** — flat `1.0` while `boostStatus === 'active'`, else `0`. A boost is one
documented 5% dimension; it cannot alter any other score.

## Final score

```
score = positionScore   * positionWeight
      + distanceScore   * distanceWeight
      + levelScore      * levelWeight
      + attributeScore  * attributesWeight
      + availabilityScore * availabilityWeight
      + boostScore      * boostWeight
```

Clamped to `[0, 1]`. The full breakdown is stored alongside the score so the UI
can show real contributions rather than generic text.

## Storage

`matchResults/{clubId}_{playerId}`

```ts
{
  clubId, playerId,
  matchScore, scoreBreakdown,
  positionScore, distanceScore, levelScore,
  attributeScore, availabilityScore, boostScore,
  configVersion, scoredAt, ttlExpiry,
  playerSnapshot: { displayName, positions, region, ageBand, playingLevel, profileCompleteness },
  position, ageBand, region, searchable
}
```

Denormalised snapshots let club search filter and sort without reading full
player documents.

## Recalculation

1. A scoring-relevant player or club field changes.
2. A Firestore trigger enqueues a job (`matchingJobs`).
3. The worker recomputes and writes results with optimistic concurrency:
   `calculationVersion` must be greater than the stored value, otherwise the
   write is discarded. A stale worker can never overwrite a newer calculation.

## Tests

`src/lib/scoringEngine.test.ts` covers exact/adjacent/incompatible positions,
distance and level boundaries, attribute boundaries, availability, boost,
custom weights, determinism (50 identical runs) and clamping.
