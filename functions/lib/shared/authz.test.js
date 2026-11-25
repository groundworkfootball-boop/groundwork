import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { requireAdminToken, requireUid } from './authz.js';
describe('functions authz custom claims checks', () => {
    it('requireUid rejects unauthenticated callers', () => {
        assert.throws(() => requireUid({ auth: null }), /signed in/i);
    });
    it('requireUid returns uid when authenticated', () => {
        assert.equal(requireUid({ auth: { uid: 'user-1', token: {} } }), 'user-1');
    });
    it('requireAdminToken rejects players even if Firestore doc claims admin', () => {
        assert.throws(() => requireAdminToken({ auth: { uid: 'p-1', token: { role: 'player' } } }), /Admin access required/i);
    });
    it('requireAdminToken accepts authoritative admin custom claim', () => {
        assert.equal(requireAdminToken({ auth: { uid: 'a-1', token: { role: 'admin' } } }), 'a-1');
    });
});
