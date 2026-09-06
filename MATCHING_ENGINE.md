# Deterministic Matching Engine Specification

## 1. Principle of Determinism
In GROUNDWORK, player-club matching scores are **100% deterministic, transparent, and auditable**. AI and LLMs are **STRICTLY FORBIDDEN** from calculating, modifying, or ranking player scores.

## 2. Six-Dimension Scoring Formula

The matching engine computes a pure score between `0.00` and `1.00` (or `0%` to `100%`):

$$\text{Score} = \sum (\text{Dimension Score} \times \text{Dimension Weight})$$

### Default Weights
| Dimension | Weight | Criteria & Function |
| :--- | :--- | :--- |
| **Position Compatibility** | **30%** | Exact primary match: `1.0`<br>Secondary/adjacent match: `0.5`<br>Incompatible: `0.0` |
| **Playing Level** | **20%** | Normalised distance: $\max(0, 1.0 - \frac{|\text{PlayerLevel} - \text{TargetLevel}|}{5})$ |
| **Player Attributes** | **20%** | Normalised average of technical, physical, and mental ratings (`1-10` scale $\div 10$) |
| **Distance / Region** | **15%** | Same geographic region = `1.0`, external region = `0.0` (or distance decay curve) |
| **Availability Overlap** | **10%** | Ratio of overlapping training/trial slots: $\frac{|\text{PlayerSlots} \cap \text{ClubSlots}|}{|\text{ClubSlots}|}$ |
| **Visibility Boost** | **5%** | Flat bonus while visibility boost is active (`1.0` if active, `0.0` if expired) |
| **Total** | **100%** | Clamped to $[0.0, 1.0]$ |

## 3. Score Breakdown Transparency
Every match calculation records a detailed breakdown. Both players and clubs can inspect the exact percentages:
```json
{
  "positionMatch": 0.30,
  "distanceMatch": 0.15,
  "levelMatch": 0.20,
  "attributesMatch": 0.18,
  "availabilityMatch": 0.10,
  "boostMatch": 0.05,
  "totalScore": 0.98
}
```

## 4. Configuration Versioning
- Weights are configured via Firestore document: `matchingConfigs/default`.
- Any modification by an admin increments `version` (e.g. `version: 2`) and logs an immutable audit entry.
- Historical match records store `configVersion` so calculations are fully reproducible across time.
