export type Role = 'player' | 'guardian' | 'club' | 'admin';

export type VerificationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'expired' | 'suspended';

export type ConsentStatus = 'pending' | 'granted' | 'withdrawn';

export type ProcessingStatus = 'pending' | 'processing' | 'ready' | 'failed' | 'deleted';

export type ApplicationStatus = 'draft' | 'submitted' | 'viewed' | 'shortlisted' | 'trial_invited' | 'rejected' | 'withdrawn' | 'accepted';

/** Canonical deterministic matching weights. Must always sum to 1.0. */
export interface MatchConfig {
  positionWeight: number;
  distanceWeight: number;
  levelWeight: number;
  attributesWeight: number;
  availabilityWeight: number;
  boostWeight: number;
  version: number;
}

export const DEFAULT_MATCH_CONFIG: MatchConfig = {
  positionWeight: 0.3,
  distanceWeight: 0.15,
  levelWeight: 0.2,
  attributesWeight: 0.2,
  availabilityWeight: 0.1,
  boostWeight: 0.05,
  version: 1,
};

export const WEIGHT_KEYS: (keyof MatchConfig)[] = [
  'positionWeight',
  'distanceWeight',
  'levelWeight',
  'attributesWeight',
  'availabilityWeight',
  'boostWeight',
];

/**
 * Adjacent position pairs used by the deterministic engine.
 * Exact match => 1.0, adjacent => 0.5, incompatible => 0.
 */
export const ADJACENT_POSITION_PAIRS: string[] = [
  'RB:RWB', 'RWB:RB',
  'LB:LWB', 'LWB:LB',
  'CM:CDM', 'CDM:CM',
  'CM:CAM', 'CAM:CM',
  'ST:CF', 'CF:ST',
  'RW:RM', 'RM:RW',
  'LW:LM', 'LM:LW',
  'CB:CDM', 'CDM:CB',
  'LB:CB', 'CB:LB',
  'RB:CB', 'CB:RB',
  'CF:ST', 'ST:CF',
];

const POSITION_ADJACENCY: Map<string, Set<string>> = buildAdjacency();

function buildAdjacency(): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const pair of ADJACENT_POSITION_PAIRS) {
    const [a, b] = pair.split(':');
    if (!map.has(a)) map.set(a, new Set());
    if (!map.has(b)) map.set(b, new Set());
    map.get(a)!.add(b);
    map.get(b)!.add(a);
  }
  return map;
}

export function areAdjacentPositions(a: string, b: string): boolean {
  return POSITION_ADJACENCY.get(a)?.has(b) ?? false;
}

export const SKILL_ATTRIBUTE_KEYS = [
  'technical', 'passing', 'dribbling', 'shooting', 'first_touch',
  'defending', 'crossing', 'heading', 'tackling',
];

export const PHYSICAL_ATTRIBUTE_KEYS = ['pace', 'acceleration', 'stamina', 'strength', 'agility'];

export const MENTAL_ATTRIBUTE_KEYS = ['positioning', 'decision_making', 'work_rate', 'teamwork'];

export const ALL_ATTRIBUTE_KEYS = [...SKILL_ATTRIBUTE_KEYS, ...PHYSICAL_ATTRIBUTE_KEYS, ...MENTAL_ATTRIBUTE_KEYS];
