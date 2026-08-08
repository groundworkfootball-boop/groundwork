import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

let testEnv: RulesTestEnvironment;

describe('Firestore Security Rules', () => {
  beforeAll(async () => {
    // Initialize the test environment with our rules
    testEnv = await initializeTestEnvironment({
      projectId: 'groundwork-test',
      firestore: {
        rules: fs.readFileSync(path.resolve(__dirname, 'firestore.rules'), 'utf8'),
      },
    });
  });

  beforeEach(async () => {
    // Clear the database between tests
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe('Global Deny-by-Default', () => {
    it('should reject unauthenticated read to arbitrary collections', async () => {
      const unauthedDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthedDb.collection('unknown').doc('123').get());
    });

    it('should reject unauthenticated write to arbitrary collections', async () => {
      const unauthedDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthedDb.collection('unknown').doc('123').set({ data: 'test' }));
    });
  });

  describe('Adult Pathway (players)', () => {
    it('should allow authenticated users to read player profiles', async () => {
      const aliceDb = testEnv.authenticatedContext('alice').firestore();
      await assertSucceeds(aliceDb.collection('players').doc('bob').get());
    });

    it('should allow user to create their own profile', async () => {
      const aliceDb = testEnv.authenticatedContext('alice').firestore();
      await assertSucceeds(aliceDb.collection('players').doc('alice').set({ name: 'Alice' }));
    });

    it('should reject user creating profile for another user', async () => {
      const aliceDb = testEnv.authenticatedContext('alice').firestore();
      await assertFails(aliceDb.collection('players').doc('bob').set({ name: 'Bob' }));
    });

    it('should reject user updating protected fields (score)', async () => {
      const aliceDb = testEnv.authenticatedContext('alice').firestore();
      // Initially create without protected fields
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('players').doc('alice').set({ name: 'Alice' });
      });

      await assertFails(aliceDb.collection('players').doc('alice').update({ score: 99 }));
    });
  });

  describe('Youth Pathway (players_youth)', () => {
    it('should reject non-owner access to youth data', async () => {
      const aliceDb = testEnv.authenticatedContext('alice').firestore();
      await assertFails(aliceDb.collection('players_youth').doc('charlie').get());
    });

    it('should allow owner access to youth data', async () => {
      const charlieDb = testEnv.authenticatedContext('charlie').firestore();
      await assertSucceeds(charlieDb.collection('players_youth').doc('charlie').get());
    });
  });

  describe('Audit Logging (audit_logs)', () => {
    it('should reject authenticated user read access', async () => {
      const aliceDb = testEnv.authenticatedContext('alice').firestore();
      await assertFails(aliceDb.collection('audit_logs').doc('log1').get());
    });

    it('should reject authenticated user write access', async () => {
      const aliceDb = testEnv.authenticatedContext('alice').firestore();
      await assertFails(aliceDb.collection('audit_logs').doc('log1').set({ action: 'test' }));
    });

    it('should allow admin read access', async () => {
      const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore();
      await assertSucceeds(adminDb.collection('audit_logs').doc('log1').get());
    });
  });
});
