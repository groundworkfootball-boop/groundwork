import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

let testEnv: RulesTestEnvironment;

const FUTURE = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
const PAST = new Date(Date.now() - 24 * 60 * 60 * 1000);

async function seedClub(
  clubId: string,
  overrides: Record<string, unknown> = {},
): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'clubs', clubId), {
      uid: clubId,
      name: 'Test FC',
      verificationStatus: 'approved',
      verifiedAdult: true,
      verifiedYouth: false,
      youthVerificationExpiresAt: null,
      ...overrides,
    });
  });
}

async function seedPlayer(playerId: string, overrides: Record<string, unknown> = {}): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'players', playerId), {
      uid: playerId,
      name: 'Test Player',
      searchable: true,
      isYouth: false,
      consentStatus: 'n/a',
      ...overrides,
    });
  });
}

describe('Firestore security rules', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'groundwork-test',
      firestore: {
        rules: fs.readFileSync(path.resolve(__dirname, 'firestore.rules'), 'utf8'),
      },
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  // ── Baseline ─────────────────────────────────────────────────────────────
  it('denies unauthenticated reads and writes', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'players', 'alice')));
    await assertFails(setDoc(doc(db, 'users', 'alice'), { name: 'Alice' }));
  });

  it('denies client creation of user documents (server-only)', async () => {
    const db = testEnv.authenticatedContext('player-1', { role: 'player' }).firestore();
    await assertFails(setDoc(doc(db, 'users', 'player-1'), { role: 'admin' }));
  });

  it('denies client creation of player profiles (server-only)', async () => {
    const db = testEnv.authenticatedContext('player-1', { role: 'player' }).firestore();
    await assertFails(setDoc(doc(db, 'players', 'player-1'), { searchable: true }));
  });

  // ── Role escalation ──────────────────────────────────────────────────────
  it('prevents a player from escalating their own role', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users', 'player-1'), { role: 'player', name: 'P' });
    });
    const db = testEnv.authenticatedContext('player-1', { role: 'player' }).firestore();
    await assertFails(updateDoc(doc(db, 'users', 'player-1'), { role: 'admin' }));
  });

  it('prevents a player from self-verifying or self-granting consent', async () => {
    await seedPlayer('youth-1', { isYouth: true, searchable: false, consentStatus: 'pending' });
    const db = testEnv.authenticatedContext('youth-1', { role: 'player' }).firestore();
    await assertFails(updateDoc(doc(db, 'players', 'youth-1'), { consentStatus: 'granted' }));
    await assertFails(updateDoc(doc(db, 'players', 'youth-1'), { searchable: true }));
    await assertFails(updateDoc(doc(db, 'players', 'youth-1'), { profileCompleteness: 100 }));
  });

  it('allows a player to update their own non-protected profile fields', async () => {
    await seedPlayer('player-1');
    const db = testEnv.authenticatedContext('player-1', { role: 'player' }).firestore();
    await assertSucceeds(updateDoc(doc(db, 'players', 'player-1'), { bio: 'Left-footed midfielder.' }));
  });

  it('prevents a club from self-verifying', async () => {
    await seedClub('club-1', { verificationStatus: 'pending', verifiedAdult: false });
    const db = testEnv.authenticatedContext('club-1', { role: 'club' }).firestore();
    await assertFails(updateDoc(doc(db, 'clubs', 'club-1'), { verifiedAdult: true }));
    await assertFails(updateDoc(doc(db, 'clubs', 'club-1'), { verifiedYouth: true }));
    await assertFails(updateDoc(doc(db, 'clubs', 'club-1'), { verificationStatus: 'approved' }));
  });

  // ── Youth safeguarding ───────────────────────────────────────────────────
  it('denies an unverified club access to a consented youth profile', async () => {
    await seedClub('club-1', { verifiedYouth: false });
    await seedPlayer('youth-1', {
      isYouth: true,
      searchable: true,
      consentStatus: 'granted',
      guardianEmail: 'g@example.com',
    });
    const db = testEnv.authenticatedContext('club-1', { role: 'club' }).firestore();
    await assertFails(getDoc(doc(db, 'players', 'youth-1')));
  });

  it('denies a club with expired youth verification', async () => {
    await seedClub('club-1', { verifiedYouth: true, youthVerificationExpiresAt: PAST });
    await seedPlayer('youth-1', {
      isYouth: true,
      searchable: true,
      consentStatus: 'granted',
      guardianEmail: 'g@example.com',
    });
    const db = testEnv.authenticatedContext('club-1', { role: 'club' }).firestore();
    await assertFails(getDoc(doc(db, 'players', 'youth-1')));
  });

  it('allows a live-verified club to read a consented, searchable youth profile', async () => {
    await seedClub('club-1', { verifiedYouth: true, youthVerificationExpiresAt: FUTURE });
    await seedPlayer('youth-1', {
      isYouth: true,
      searchable: true,
      consentStatus: 'granted',
      guardianEmail: 'g@example.com',
    });
    const db = testEnv.authenticatedContext('club-1', { role: 'club' }).firestore();
    await assertSucceeds(getDoc(doc(db, 'players', 'youth-1')));
  });

  it('denies a live-verified club when consent is pending or withdrawn', async () => {
    await seedClub('club-1', { verifiedYouth: true, youthVerificationExpiresAt: FUTURE });
    await seedPlayer('youth-pending', {
      isYouth: true,
      searchable: false,
      consentStatus: 'pending',
      guardianEmail: 'g@example.com',
    });
    await seedPlayer('youth-withdrawn', {
      isYouth: true,
      searchable: false,
      consentStatus: 'withdrawn',
      guardianEmail: 'g@example.com',
    });
    const db = testEnv.authenticatedContext('club-1', { role: 'club' }).firestore();
    await assertFails(getDoc(doc(db, 'players', 'youth-pending')));
    await assertFails(getDoc(doc(db, 'players', 'youth-withdrawn')));
  });

  it('denies a normal player access to another player profile', async () => {
    await seedPlayer('player-2');
    const db = testEnv.authenticatedContext('player-1', { role: 'player' }).firestore();
    await assertFails(getDoc(doc(db, 'players', 'player-2')));
  });

  it('allows a guardian to read their own youth profile', async () => {
    await seedPlayer('youth-1', {
      isYouth: true,
      searchable: false,
      consentStatus: 'pending',
      guardianEmail: 'guardian@example.com',
    });
    const db = testEnv
      .authenticatedContext('guardian-1', { role: 'guardian', email: 'guardian@example.com' })
      .firestore();
    await assertSucceeds(getDoc(doc(db, 'players', 'youth-1')));
  });

  it('denies an unrelated guardian access to a youth profile', async () => {
    await seedPlayer('youth-1', {
      isYouth: true,
      searchable: false,
      consentStatus: 'pending',
      guardianEmail: 'guardian@example.com',
    });
    const db = testEnv
      .authenticatedContext('guardian-2', { role: 'guardian', email: 'other@example.com' })
      .firestore();
    await assertFails(getDoc(doc(db, 'players', 'youth-1')));
  });

  // ── Server-owned collections ─────────────────────────────────────────────
  it('prevents any client from writing match results', async () => {
    const db = testEnv.authenticatedContext('club-1', { role: 'club' }).firestore();
    await assertFails(setDoc(doc(db, 'matchResults', 'club-1_player-1'), { matchScore: 1 }));
  });

  it('prevents any client from writing consent audits', async () => {
    const db = testEnv.authenticatedContext('guardian-1', { role: 'guardian' }).firestore();
    await assertFails(
      addDoc(collection(db, 'consentAudits'), {
        youthId: 'youth-1',
        guardianId: 'guardian-1',
        action: 'granted',
      }),
    );
  });

  it('prevents any client from writing audit logs', async () => {
    const db = testEnv.authenticatedContext('admin-1', { role: 'admin', isSuperAdmin: true }).firestore();
    await assertFails(setDoc(doc(db, 'auditLogs', 'log-1'), { action: 'forged' }));
  });

  it('allows an admin to read audit logs', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'auditLogs', 'log-1'), { action: 'test' });
    });
    const db = testEnv.authenticatedContext('admin-1', { role: 'admin' }).firestore();
    await assertSucceeds(getDoc(doc(db, 'auditLogs', 'log-1')));
  });

  it('prevents a non-admin from reading audit logs', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'auditLogs', 'log-1'), { action: 'test' });
    });
    const db = testEnv.authenticatedContext('player-1', { role: 'player' }).firestore();
    await assertFails(getDoc(doc(db, 'auditLogs', 'log-1')));
  });

  // ── Notifications ────────────────────────────────────────────────────────
  it('prevents a user from creating notifications for themselves', async () => {
    const db = testEnv.authenticatedContext('player-1', { role: 'player' }).firestore();
    await assertFails(
      addDoc(collection(db, 'notifications'), { userId: 'player-1', title: 'Forged', read: false }),
    );
  });

  it('allows a user to mark their own notification read', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'notifications', 'n1'), {
        userId: 'player-1',
        title: 'Hello',
        read: false,
      });
    });
    const db = testEnv.authenticatedContext('player-1', { role: 'player' }).firestore();
    await assertSucceeds(updateDoc(doc(db, 'notifications', 'n1'), { read: true }));
  });

  it('denies reading another user notification', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'notifications', 'n1'), {
        userId: 'player-2',
        title: 'Private',
        read: false,
      });
    });
    const db = testEnv.authenticatedContext('player-1', { role: 'player' }).firestore();
    await assertFails(getDoc(doc(db, 'notifications', 'n1')));
  });

  // ── Club private data ────────────────────────────────────────────────────
  it('denies a player reading club private notes', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'clubs', 'club-1', 'private', 'notes'), {
        recruitmentNotes: 'Internal only',
      });
    });
    const db = testEnv.authenticatedContext('player-1', { role: 'player' }).firestore();
    await assertFails(getDoc(doc(db, 'clubs', 'club-1', 'private', 'notes')));
  });

  it('allows the owning club to read its private notes', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'clubs', 'club-1', 'private', 'notes'), {
        recruitmentNotes: 'Internal only',
      });
    });
    const db = testEnv.authenticatedContext('club-1', { role: 'club' }).firestore();
    await assertSucceeds(getDoc(doc(db, 'clubs', 'club-1', 'private', 'notes')));
  });

  // ── Payments ─────────────────────────────────────────────────────────────
  it('prevents a client from writing subscription or payment state', async () => {
    const db = testEnv.authenticatedContext('club-1', { role: 'club' }).firestore();
    await assertFails(setDoc(doc(db, 'subscriptions', 'club-1'), { status: 'active' }));
    await assertFails(setDoc(doc(db, 'payments', 'p1'), { userId: 'club-1', amount: 0 }));
    await assertFails(setDoc(doc(db, 'boosts', 'club-1'), { boostStatus: 'active' }));
  });

  // ── Applications ─────────────────────────────────────────────────────────
  it('allows a player to submit an application for themselves', async () => {
    const db = testEnv.authenticatedContext('player-1', { role: 'player' }).firestore();
    await assertSucceeds(
      addDoc(collection(db, 'applications'), {
        playerId: 'player-1',
        clubId: 'club-1',
        opportunityId: 'opp-1',
        status: 'submitted',
      }),
    );
  });

  it('prevents a player from submitting an application on behalf of another player', async () => {
    const db = testEnv.authenticatedContext('player-1', { role: 'player' }).firestore();
    await assertFails(
      addDoc(collection(db, 'applications'), {
        playerId: 'player-2',
        clubId: 'club-1',
        status: 'submitted',
      }),
    );
  });

  it('prevents a player from reading another player application', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'applications', 'a1'), {
        playerId: 'player-2',
        clubId: 'club-1',
        status: 'submitted',
      });
    });
    const db = testEnv.authenticatedContext('player-1', { role: 'player' }).firestore();
    await assertFails(getDoc(doc(db, 'applications', 'a1')));
  });

  // ── Matching config ──────────────────────────────────────────────────────
  it('prevents a non-super-admin from changing matching weights', async () => {
    const db = testEnv.authenticatedContext('admin-1', { role: 'admin' }).firestore();
    await assertFails(setDoc(doc(db, 'matchingConfigs', 'default'), { positionWeight: 0.9 }));
  });

  it('allows a super admin to change matching weights', async () => {
    const db = testEnv
      .authenticatedContext('admin-1', { role: 'admin', isSuperAdmin: true })
      .firestore();
    await assertSucceeds(setDoc(doc(db, 'matchingConfigs', 'default'), { positionWeight: 0.3 }));
  });

  // ── GDPR ─────────────────────────────────────────────────────────────────
  it('allows a user to create their own GDPR request', async () => {
    const db = testEnv.authenticatedContext('player-1', { role: 'player' }).firestore();
    await assertSucceeds(
      addDoc(collection(db, 'gdprRequests'), { userId: 'player-1', type: 'export', status: 'pending' }),
    );
  });

  it('prevents a user from creating a GDPR request for someone else', async () => {
    const db = testEnv.authenticatedContext('player-1', { role: 'player' }).firestore();
    await assertFails(
      addDoc(collection(db, 'gdprRequests'), { userId: 'player-2', type: 'delete', status: 'pending' }),
    );
  });

  it('prevents a user from deleting their own GDPR request record', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'gdprRequests', 'r1'), {
        userId: 'player-1',
        type: 'export',
        status: 'pending',
      });
    });
    const db = testEnv.authenticatedContext('player-1', { role: 'player' }).firestore();
    await assertFails(deleteDoc(doc(db, 'gdprRequests', 'r1')));
  });
});
