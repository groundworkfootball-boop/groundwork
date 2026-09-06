export type Role = 'player' | 'guardian' | 'club' | 'admin';

export interface MatchConfig {
  positionWeight: number;
  distanceWeight: number;
  levelWeight: number;
  attributesWeight: number;
  availabilityWeight: number;
  boostWeight: number;
  version: number;
}
