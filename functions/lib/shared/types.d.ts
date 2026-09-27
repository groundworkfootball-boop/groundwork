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
export declare const DEFAULT_MATCH_CONFIG: MatchConfig;
export declare const WEIGHT_KEYS: (keyof MatchConfig)[];
/**
 * Adjacent position pairs used by the deterministic engine.
 * Exact match => 1.0, adjacent => 0.5, incompatible => 0.
 */
export declare const ADJACENT_POSITION_PAIRS: string[];
export declare function areAdjacentPositions(a: string, b: string): boolean;
export declare const SKILL_ATTRIBUTE_KEYS: string[];
export declare const PHYSICAL_ATTRIBUTE_KEYS: string[];
export declare const MENTAL_ATTRIBUTE_KEYS: string[];
export declare const ALL_ATTRIBUTE_KEYS: string[];
