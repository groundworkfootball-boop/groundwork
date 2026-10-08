import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  getRememberedAccounts,
  saveRememberedAccount,
  removeRememberedAccount,
  setActiveSession,
  getActiveSession,
  clearActiveSession,
} from './sessionStorage';

// Mock Web Storage API for Node.js test runner environment
class MockStorage implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
}

describe('Session Storage & Remembered Accounts Service', () => {
  beforeAll(() => {
    if (typeof globalThis.localStorage === 'undefined') {
      const mockLocal = new MockStorage();
      const mockSession = new MockStorage();
      Object.defineProperty(globalThis, 'localStorage', { value: mockLocal, writable: true });
      Object.defineProperty(globalThis, 'sessionStorage', { value: mockSession, writable: true });
    }
  });

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('starts with empty list when no accounts are remembered', () => {
    expect(getRememberedAccounts()).toEqual([]);
  });

  it('saves an account and retrieves it', () => {
    saveRememberedAccount({
      uid: 'player-123',
      email: 'player@example.com',
      name: 'Marcus Striker',
      role: 'player',
      verified: true,
    });

    const accounts = getRememberedAccounts();
    expect(accounts).toHaveLength(1);
    expect(accounts[0].email).toBe('player@example.com');
    expect(accounts[0].name).toBe('Marcus Striker');
    expect(accounts[0].role).toBe('player');
    expect(accounts[0].lastLoginAt).toBeDefined();
  });

  it('updates existing account rather than duplicating it', () => {
    saveRememberedAccount({
      uid: 'club-456',
      email: 'recruiter@club.com',
      name: 'London FC',
      role: 'club',
    });

    saveRememberedAccount({
      uid: 'club-456',
      email: 'recruiter@club.com',
      name: 'London FC Academy',
      role: 'club',
      clubCode: 'LON-456',
    });

    const accounts = getRememberedAccounts();
    expect(accounts).toHaveLength(1);
    expect(accounts[0].name).toBe('London FC Academy');
    expect(accounts[0].clubCode).toBe('LON-456');
  });

  it('removes an account by uid', () => {
    saveRememberedAccount({
      uid: 'admin-1',
      email: 'admin@groundwork.internal',
      name: 'Chief Admin',
      role: 'admin',
    });

    expect(getRememberedAccounts()).toHaveLength(1);
    removeRememberedAccount('admin-1');
    expect(getRememberedAccounts()).toHaveLength(0);
  });

  it('limits remembered accounts to top 5 most recent', () => {
    for (let i = 1; i <= 7; i++) {
      saveRememberedAccount({
        uid: `user-${i}`,
        email: `user${i}@example.com`,
        name: `User ${i}`,
        role: 'player',
      });
    }

    const accounts = getRememberedAccounts();
    expect(accounts).toHaveLength(5);
    expect(accounts[0].uid).toBe('user-7'); // Most recent first
  });

  it('manages active session in sessionStorage', () => {
    expect(getActiveSession()).toBeNull();

    const sessionData = {
      uid: 'guardian-789',
      email: 'parent@example.com',
      name: 'Sarah Guardian',
      role: 'guardian' as const,
      lastLoginAt: Date.now(),
    };

    setActiveSession(sessionData);
    expect(getActiveSession()).toEqual(sessionData);

    clearActiveSession();
    expect(getActiveSession()).toBeNull();
  });
});
