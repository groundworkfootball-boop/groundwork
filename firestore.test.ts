import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

let testEnv: RulesTestEnvironment;

describe('Firestore Security Rules', () => {
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

  it('denies unauthenticated access by default', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(db.collection('players').doc('alice').get());
    await assertFails(db.collection('users').doc('alice').set({ name: 'Alice' }));
  });

  it('allows a player to create and read their own profile', async () => {
    const db = testEnv.authenticatedContext('player-1', { role: 'player' }).firestore();
    await assertSucceeds(db.collection('players').doc('player-1').set({ searchable: true }));
    await assertSucceeds(db.collection('players').doc('player-1').get());
  });

  it('prevents a player from creating another player profile', async () => {
    const db = testEnv.authenticatedContext('player-1', { role: 'player' }).firestore();
    await assertFails(db.collection('players').doc('player-2').set({ searchable: true }));
  });

  it('allows a guardian account to create its own guardian record', async () => {
    const db = testEnv.authenticatedContext('guardian-1', { role: 'guardian' }).firestore();
    await assertSucceeds(db.collection('guardians').doc('guardian-1').set({ name: 'Guardian One' }));
  });

  it('allows a club account to create its own club record', async () => {
    const db = testEnv.authenticatedContext('club-1', { role: 'club' }).firestore();
    await assertSucceeds(db.collection('clubs').doc('club-1').set({ name: 'Club One' }));
  });

  it('denies club access to hidden youth profiles', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('players').doc('youth-1').set({ searchable: false, isYouth: true });
    });

    const db = testEnv.authenticatedContext('club-1', { role: 'club' }).firestore();
    await assertFails(db.collection('players').doc('youth-1').get());
  });

  it('allows admin read access to audit logs and blocks writes', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('auditLogs').doc('log-1').set({ action: 'test' });
    });

    const db = testEnv.authenticatedContext('admin-1', { role: 'admin', isSuperAdmin: true }).firestore();
    await assertSucceeds(db.collection('auditLogs').doc('log-1').get());
    await assertFails(db.collection('auditLogs').doc('log-1').set({ action: 'change' }));
  });
});
