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
  createUserWithEmailAndPassword,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { saveRememberedAccount, setActiveSession, clearActiveSession } from '../lib/sessionStorage';
import { generateClubCode } from '../lib/clubCode';

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

/** Age check used only for the client-side provisioning fallback. */
function isUnder18(dob: string): boolean {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return false;
  const eighteenth = new Date(birth.getFullYear() + 18, birth.getMonth(), birth.getDate());
  return Date.now() < eighteenth.getTime();
}
/**
 * Client-side provisioning used only when the createAccount callable is not
 * deployed. Firestore rules pin every server-owned field to a safe default, so
 * this path can never self-verify, self-grant a boost, or expose a youth profile.
 */
async function provisionSelf(
  uid: string,
  email: string,
  name: string,
  role: Exclude<Role, 'admin'>,
  extra: RegisterExtra,
): Promise<void> {
  const isYouth = Boolean(extra.isYouth && extra.dob && isUnder18(extra.dob));

  await setDoc(doc(db, 'users', uid), {
    uid,
    email,
    name,
    role,
    emailVerified: false,
    disabled: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (role === 'player') {
    await setDoc(doc(db, 'players', uid), {
      uid,
      email,
      name,
      displayName: name,
      role: 'player',
      isYouth,
      searchable: false,
      consentStatus: isYouth ? 'pending' : 'n/a',
      profileCompleteness: 0,
      dob: extra.dob ?? null,
      positions: extra.positions ?? [],
      playingLevel: extra.playingLevel ?? null,
      region: extra.region ?? null,
      availability: extra.availability ?? [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now(),
    });

    if (isYouth) {
      await setDoc(doc(db, 'youthProfiles', uid), {
        playerId: uid,
        guardianName: extra.guardianName ?? '',
        guardianEmail: extra.guardianEmail ?? '',
        relationship: extra.guardianRelationship ?? '',
        consentStatus: 'pending',
        searchable: false,
        privacyNoticeVersion: '1.0',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return;
  }

  if (role === 'guardian') {
    await setDoc(doc(db, 'guardians', uid), {
      uid,
      email,
      name,
      role: 'guardian',
      linkedYouthIds: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return;
  }

  await setDoc(doc(db, 'clubs', uid), {
    uid,
    email,
    name,
    role: 'club',
    clubCode: generateClubCode(name),
    verificationStatus: 'pending',
    verifiedAdult: false,
    verifiedYouth: false,
    targetPositions: [],
    targetPlayingLevels: [],
    league: extra.league ?? null,
    region: extra.region ?? null,
    clubType: extra.clubType ?? null,
    preferredRadiusKm: extra.preferredRadiusKm ?? null,
    trainingAvailability: [],
    trialAvailability: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
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

    let provisionedServerSide = true;
    try {
      await createAccount({ email, password: pass, role: selectedRole, name, extra });
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      // The callable is the authoritative path. If it is not deployed yet we fall
      // back to client-side provisioning, which Firestore rules restrict to the
      // caller's own document, non-privileged roles, and safe default fields.
      const unavailable =
        code === 'functions/not-found' ||
        code === 'functions/unavailable' ||
        code === 'functions/internal' ||
        code === 'functions/deadline-exceeded';
      if (!unavailable) throw err;
      provisionedServerSide = false;
    }

    if (!provisionedServerSide) {
      const credential = await createUserWithEmailAndPassword(auth, email, pass);
      await provisionSelf(credential.user.uid, email, name, selectedRole, extra);
      await credential.user.getIdToken(true);
      if (!credential.user.emailVerified) {
        sendEmailVerification(credential.user).catch(() => {
          /* non-blocking: user can resend from the verify screen */
        });
      }
      return;
    }

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
