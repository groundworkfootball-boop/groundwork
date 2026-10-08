import type { Role } from '../context/AuthContext';

export interface RememberedAccount {
  uid: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
  lastLoginAt: number;
  verified?: boolean;
  clubCode?: string;
}

const REMEMBERED_ACCOUNTS_KEY = 'groundwork_remembered_accounts';
const ACTIVE_SESSION_KEY = 'groundwork_active_session';

/**
 * Retrieve all remembered accounts from localStorage
 */
export function getRememberedAccounts(): RememberedAccount[] {
  try {
    const raw = localStorage.getItem(REMEMBERED_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse remembered accounts:', err);
    return [];
  }
}

/**
 * Save or update a remembered account in localStorage
 */
export function saveRememberedAccount(account: Omit<RememberedAccount, 'lastLoginAt'> & { lastLoginAt?: number }): void {
  try {
    const existing = getRememberedAccounts();
    const updatedAccount: RememberedAccount = {
      ...account,
      lastLoginAt: account.lastLoginAt ?? Date.now(),
    };
    
    // Filter out previous version of this user
    const filtered = existing.filter((acc) => acc.uid !== account.uid);
    // Add to the front of the list
    const updatedList = [updatedAccount, ...filtered].slice(0, 5); // Keep max 5 recent accounts
    
    localStorage.setItem(REMEMBERED_ACCOUNTS_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.warn('Failed to save remembered account:', err);
  }
}

/**
 * Remove an account from the remembered list
 */
export function removeRememberedAccount(uid: string): void {
  try {
    const existing = getRememberedAccounts();
    const filtered = existing.filter((acc) => acc.uid !== uid);
    localStorage.setItem(REMEMBERED_ACCOUNTS_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to remove remembered account:', err);
  }
}

/**
 * Store the active session in sessionStorage
 */
export function setActiveSession(account: RememberedAccount): void {
  try {
    sessionStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(account));
  } catch (err) {
    console.warn('Failed to set active session:', err);
  }
}

/**
 * Retrieve the active session from sessionStorage
 */
export function getActiveSession(): RememberedAccount | null {
  try {
    const raw = sessionStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to get active session:', err);
    return null;
  }
}

/**
 * Clear the active session from sessionStorage
 */
export function clearActiveSession(): void {
  try {
    sessionStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch (err) {
    console.warn('Failed to clear active session:', err);
  }
}
