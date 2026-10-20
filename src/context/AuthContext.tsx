import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { auth, db } from '../lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { saveRememberedAccount, setActiveSession, clearActiveSession } from '../lib/sessionStorage';

export type Role = 'player' | 'guardian' | 'club' | 'admin';

export interface AppUser {
  uid: string;
  email: string | null;
  role: Role;
  name: string;
  emailVerified: boolean;
  claimsRole?: Role | null;
  photoUrl?: string;
  [key: string]: unknown;
}

export interface RegisterExtra {
  dob?: string;
  isYouth?: boolean;
  positions?: string[];
  primaryPosition?: string;
  secondaryPosition?: string | null;
  playingLevel?: number;
  region?: string;
  availability?: string[];
  guardianName?: string;
  guardianEmail?: string;
  guardianRelationship?: string;
  clubName?: string;
  league?: string;
  clubType?: string;
  preferredRadiusKm?: number;
}

interface AuthContextType {
  role: Role | null;
  isAuthenticated: boolean;
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, pass: string, remember?: boolean) => Promise<void>;
  loginWithGoogle: (fallbackRole?: Role) => Promise<void>;
  register: (email: string, pass: string, role: Role, name: string, extra?: RegisterExtra) => Promise<void>;
  logout: () => Promise<void>;
  sendReset: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshClaims: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const VALID_ROLES: Role[] = ['player', 'guardian', 'club', 'admin'];

function normaliseRole(value: unknown): Role | null {
  return typeof value === 'string' && (VALID_ROLES as string[]).includes(value) ? (value as Role) : null;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setFirebaseUser(null);
        setRole(null);
        setUser(null);
        setIsAuthenticated(false);
        clearActiveSession();
        setLoading(false);
        return;
      }

      setFirebaseUser(fbUser);

      try {
        const [tokenResult, userSnap] = await Promise.all([
          fbUser.getIdTokenResult(true).catch(() => null),
          getDoc(doc(db, 'users', fbUser.uid)).catch(() => null),
        ]);

        const claimRole = normaliseRole(tokenResult?.claims?.role);
        const profile = userSnap?.exists() ? userSnap.data() : {};
        // Custom claims are authoritative. The Firestore document is only a fallback
        // for accounts created before claims were provisioned.
        const resolvedRole: Role = claimRole ?? normaliseRole(profile.role) ?? 'player';
        const displayName =
          (profile.name as string | undefined) ?? fbUser.displayName ?? fbUser.email ?? 'Member';

        const appUser: AppUser = {
          ...profile,
          uid: fbUser.uid,
          email: fbUser.email,
          emailVerified: fbUser.emailVerified,
          name: displayName,
          role: resolvedRole,
          claimsRole: claimRole,
          photoUrl: (profile.photoUrl as string | undefined) ?? fbUser.photoURL ?? undefined,
        };

        setRole(resolvedRole);
        setUser(appUser);
        setIsAuthenticated(true);

        const verified = Boolean(
          profile.verifiedAdult ||
            fbUser.emailVerified ||
            (typeof profile.profileCompleteness === 'number' && profile.profileCompleteness >= 80),
        );

        saveRememberedAccount({
          uid: fbUser.uid,
          email: fbUser.email ?? '',
          name: displayName,
          role: resolvedRole,
          avatarUrl: appUser.photoUrl,
          verified,
          clubCode: (profile.clubCode as string | undefined) ?? undefined,
        });
        setActiveSession({
          uid: fbUser.uid,
          email: fbUser.email ?? '',
          name: displayName,
          role: resolvedRole,
          avatarUrl: appUser.photoUrl,
          lastLoginAt: Date.now(),
          verified,
          clubCode: (profile.clubCode as string | undefined) ?? undefined,
        });
      } catch (err) {
        console.error('Failed to resolve user profile', err);
        // Fail closed: never grant a privileged role when the profile cannot be read.
        setRole('player');
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          emailVerified: fbUser.emailVerified,
          name: fbUser.displayName ?? fbUser.email ?? 'Member',
          role: 'player',
          claimsRole: null,
        });
        setIsAuthenticated(true);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string, _remember = true) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const loginWithGoogle = async (fallbackRole: Role = 'player') => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);

    // Only create the profile document if it does not already exist. Role is never
    // taken from the client for an existing account.
    const userRef = doc(db, 'users', result.user.uid);
    const existing = await getDoc(userRef);
    if (!existing.exists()) {
      const safeRole: Role = fallbackRole === 'admin' ? 'player' : fallbackRole;
      await setDoc(userRef, {
        uid: result.user.uid,
        email: result.user.email,
        name: result.user.displayName ?? result.user.email ?? 'Member',
        role: safeRole,
        emailVerified: result.user.emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  };

  const register = async (
    email: string,
    pass: string,
    selectedRole: Role,
    name: string,
    extra: RegisterExtra = {},
  ) => {
    if (selectedRole === 'admin') {
      throw new Error('Administrator accounts cannot be created through registration.');
    }

    const createAccount = httpsCallable<
      { email: string; password: string; role: Role; name: string; extra: RegisterExtra },
      { uid: string; role: string; isYouth: boolean; clubCode?: string }
    >(functions, 'createAccount');

    await createAccount({ email, password: pass, role: selectedRole, name, extra });

    // Sign in with the freshly provisioned credentials so the client picks up claims.
    const credential = await signInWithEmailAndPassword(auth, email, pass);
    await credential.user.getIdToken(true);

    if (!credential.user.emailVerified) {
      sendEmailVerification(credential.user).catch(() => {
        /* non-blocking: user can resend from the verify screen */
      });
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  const sendReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const resendVerification = async () => {
    if (!auth.currentUser) throw new Error('You must be signed in to resend verification.');
    await sendEmailVerification(auth.currentUser);
  };

  const refreshClaims = async () => {
    if (!auth.currentUser) return;
    const token = await auth.currentUser.getIdTokenResult(true);
    const nextRole = normaliseRole(token.claims.role);
    if (nextRole) {
      setRole(nextRole);
      setUser((prev) => (prev ? { ...prev, role: nextRole, claimsRole: nextRole } : prev));
    }
  };

  const value = useMemo(
    () => ({
      role,
      isAuthenticated,
      user,
      firebaseUser,
      loading,
      login,
      loginWithGoogle,
      register,
      logout,
      sendReset,
      resendVerification,
      refreshClaims,
    }),
    [role, isAuthenticated, user, firebaseUser, loading],
  );

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
