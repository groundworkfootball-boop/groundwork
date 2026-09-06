// Direct test runner for GROUNDWORK critical systems
import assert from 'node:assert';
import { calculateMatchScore } from '../src/lib/scoringEngine.js';
import {
  generateClubCode,
  isValidClubCode,
  getClubInviteUrl,
  multiPlatformShare,
  generateDeterministicQRMatrix,
} from '../src/lib/clubCode.js';

console.log('--- RUNNING GROUNDWORK CRITICAL SYSTEM TESTS ---');

// TEST 1: DETERMINISTIC MATCHING ENGINE
console.log('Testing Deterministic Matching Engine...');

const basePlayer = {
  positions: ['ST', 'CF'],
  region: 'London',
  playingLevel: 8,
  skillRatings: { pace: 8, shooting: 9, dribbling: 7, passing: 8 },
  availability: ['Tuesday Eve', 'Thursday Eve', 'Saturday'],
  hasActiveBoost: false,
};

const baseClub = {
  targetPositions: ['ST'],
  region: 'London',
  targetLevel: 8,
  requiredAvailability: ['Tuesday Eve', 'Thursday Eve'],
};

// 1. Pure reproducibility
const res1 = calculateMatchScore(basePlayer, baseClub);
const res2 = calculateMatchScore(basePlayer, baseClub);
assert.strictEqual(res1.totalScore, res2.totalScore, 'Score must be deterministic and identical');
assert.strictEqual(res1.positionMatch, 0.30, 'Exact position match must contribute 30%');
assert.strictEqual(res1.distanceMatch, 0.15, 'Exact region match must contribute 15%');
assert.strictEqual(res1.levelMatch, 0.20, 'Exact level match must contribute 20%');
assert.strictEqual(res1.availabilityMatch, 0.10, 'Complete availability overlap must contribute 10%');
assert.strictEqual(res1.boostMatch, 0.00, 'Unboosted player must receive 0% boost bonus');
console.log('✓ Deterministic scoring reproducibility passed');

// 2. Boost test
const boostedRes = calculateMatchScore({ ...basePlayer, hasActiveBoost: true }, baseClub);
assert.strictEqual(boostedRes.boostMatch, 0.05, 'Boosted player must receive 5% boost bonus');
assert.strictEqual(Math.round((boostedRes.totalScore - res1.totalScore) * 100) / 100, 0.05, 'Boost difference must equal 0.05');
console.log('✓ Boost bonus test passed');

// 3. Distance decay test
const distantClub = { ...baseClub, region: 'North West' };
const distantRes = calculateMatchScore(basePlayer, distantClub);
assert.strictEqual(distantRes.distanceMatch, 0.0, 'Distant region must receive 0%');
assert.ok(distantRes.totalScore < res1.totalScore, 'Distant club score must be lower');
console.log('✓ Distance decay test passed');

// TEST 2: CLUB CODE GENERATOR & MULTI-PLATFORM SHARING
console.log('\nTesting Club Code Generator & Multi-Platform Sharing...');

const code = generateClubCode('Arsenal Academy');
assert.ok(/^GW-[A-Z0-9]{3}-[A-Z0-9]{4}$/.test(code), 'Club code format must match GW-XXX-XXXX');
assert.strictEqual(isValidClubCode(code), true, 'Generated code must pass validation');
assert.strictEqual(isValidClubCode('INVALID'), false, 'Malformed code must be rejected');
console.log('✓ Unique club code generator passed:', code);

const inviteUrl = getClubInviteUrl('GW-ARS-9B2F');
assert.ok(inviteUrl.includes('clubCode=GW-ARS-9B2F'), 'Invite URL must contain clubCode param');
console.log('✓ Invite URL builder passed:', inviteUrl);

const shares = multiPlatformShare({ clubName: 'Arsenal FC', clubCode: 'GW-ARS-9B2F' });
assert.ok(shares.whatsapp.includes('whatsapp://send'), 'WhatsApp URL generated');
assert.ok(shares.email.includes('mailto:'), 'Email URL generated');
assert.ok(shares.sms.includes('sms:'), 'SMS URL generated');
assert.ok(shares.twitter.includes('twitter.com'), 'Twitter URL generated');
console.log('✓ Multi-platform share links generated successfully');

const matrix = generateDeterministicQRMatrix('GW-ARS-9B2F');
assert.strictEqual(matrix.length, 25, 'QR Matrix must be 25x25');
assert.strictEqual(matrix[0].length, 25, 'QR Matrix row length must be 25');
console.log('✓ Deterministic QR Matrix generated successfully');

console.log('\n========================================');
console.log('ALL GROUNDWORK CRITICAL TESTS PASSED 100%');
console.log('========================================');
