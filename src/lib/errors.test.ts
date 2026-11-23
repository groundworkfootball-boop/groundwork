import { describe, it, expect } from 'vitest';
import { PermissionDeniedError, isPermissionDenied } from './errors';

describe('isPermissionDenied', () => {
  it('recognises the Firestore permission-denied code', () => {
    expect(isPermissionDenied({ code: 'permission-denied' })).toBe(true);
  });

  it('recognises the SDK error message', () => {
    expect(
      isPermissionDenied(new Error('Missing or insufficient permissions.')),
    ).toBe(true);
  });

  it('recognises our typed refusal, including in minified builds', () => {
    expect(isPermissionDenied(new PermissionDeniedError('players'))).toBe(true);
    // instanceof survives here, but the name check is what protects bundled builds.
    const cloned = Object.assign(new Error('x'), { name: 'PermissionDeniedError' });
    expect(isPermissionDenied(cloned)).toBe(true);
  });

  it('ignores ordinary failures', () => {
    expect(isPermissionDenied(new Error('network unavailable'))).toBe(false);
    expect(isPermissionDenied({ code: 'unavailable' })).toBe(false);
    expect(isPermissionDenied(null)).toBe(false);
    expect(isPermissionDenied(undefined)).toBe(false);
    expect(isPermissionDenied('')).toBe(false);
  });

  it('treats a plain string mentioning permission as a refusal', () => {
    expect(isPermissionDenied('permission denied')).toBe(true);
  });

  it('carries the resource that was refused', () => {
    expect(new PermissionDeniedError('matchResults').resource).toBe('matchResults');
  });
});
