import { adminDb } from './firebaseAdmin.js';
import { MatchConfig, DEFAULT_MATCH_CONFIG, WEIGHT_KEYS } from './types.js';

const CONFIG_DOC = 'matchingConfigs/default';
const CACHE_TTL_MS = 30_000;
let cached: { config: MatchConfig; loadedAt: number } | null = null;

/** Reads the active matching config; falls back to defaults, never throws. */
export async function getActiveMatchConfig(): Promise<MatchConfig> {
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) return cached.config;
  try {
    const snap = await adminDb.collection('matchingConfigs').doc('default').get();
    if (snap.exists) {
      const data = snap.data();
      const config: MatchConfig = { ...DEFAULT_MATCH_CONFIG };
      let version = data?.version;
      for (const key of WEIGHT_KEYS) {
        const v = data?.[key];
        if (typeof v === 'number' && v >= 0 && v <= 1) config[key] = v;
      }
      version = typeof version === 'number' && version > 0 ? version : DEFAULT_MATCH_CONFIG.version;
      config.version = version;
      config.boostWeight = normalizeWeights(config);
      cached = { config, loadedAt: Date.now() };
      return config;
    }
  } catch (err) {
    console.warn('getActiveMatchConfig fallback to defaults', err);
  }
  cached = { config: { ...DEFAULT_MATCH_CONFIG }, loadedAt: Date.now() };
  return cached.config;
}

/** Forces the next read to hit Firestore (used after admin config changes). */
export function invalidateConfigCache(): void {
  cached = null;
}

/** Ensure the six weights sum to exactly 1.0 (small drift tolerated). */
export function normalizeWeights(config: MatchConfig): number {
  const total = WEIGHT_KEYS.reduce((sum, key) => sum + (config[key] as number), 0);
  if (Math.abs(total - 1) < 0.0001) return config.boostWeight;
  // Scale all weights proportionally to sum to 1.
  const scale = 1 / Math.max(0.0001, total);
  for (const key of WEIGHT_KEYS) {
    if (key !== 'version') config[key] = Math.round((config[key] as number) * scale * 10000) / 10000;
  }
  return config.boostWeight;
}

/** Validate that weights are sane and sum to 1.0 (±0.0001). */
export function validateWeightsSum(candidate: Record<string, number | undefined>): boolean {
  const sum = WEIGHT_KEYS.reduce((total, key) => total + (typeof candidate[key] === 'number' ? (candidate[key] as number) : 0), 0);
  return Math.abs(sum - 1) < 0.0001;
}

/** Deletes the TTL-expired match result markers when a player is no longer eligible. */
export const MATCH_RESULT_MAX_TTL_DAYS = 30;