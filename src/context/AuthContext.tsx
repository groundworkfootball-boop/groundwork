import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { auth, db, functions } from '../lib/firebase';
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
import { saveRememberedAccount, setActiveSession, clearActiveSession } from '../lib/sessionStorage';
import { generateClubCode } from '../lib/clubCode';

export type Role = 'player' | 'guardian' | 'club' | 'admin';

export interface AdminFlags {
  isSuperAdmin: boolean;
  isModerator: boolean;
  isSafeguardingAdmin: boolean;
  isFinanceAdmin: boolean;
}

const EMPTY_ADMIN_FLAGS: AdminFlags = {
  isSuperAdmin: false,
  isModerator: false,
  isSafeguardingAdmin: false,
  isFinanceAdmin: false,
};

export interface AppUser {
  uid: string;
  email: string | null;
  role: Role;
  name: string;
  emailVerified: boolean;
  claimsRole?: Role | null;
  adminFlags: AdminFlags;
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
  adminFlags: AdminFlags;
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

function extractAdminFlags(claims?: Record<string, unknown> | null): AdminFlags {
  if (!claims || claims.role !== 'admin') return EMPTY_ADMIN_FLAGS;
  return {
    isSuperAdmin: claims.isSuperAdmin === true,
    isModerator: claims.isModerator === true,
    isSafeguardingAdmin: claims.isSafeguardingAdmin === true,
    isFinanceAdmin: claims.isFinanceAdmin === true,
  };
}

/** Age check used only for the client-side provisioning fallback. */
function isUnder18(dob: string): boolean {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return false;
  const eighteenth = new Date(birth.getFullYear() + 18, birth.getMonth(), birth.getDate());
  return Date.now() < eighteenth.getTime();
}

let canUseServerProvisioning = import.meta.env.VITE_SERVER_PROVISIONING === 'true';

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
      guardianEmail: isYouth ? (extra.guardianEmail ?? '').toLowerCase().trim() : null,
      guardianName: isYouth ? (extra.guardianName ?? '') : null,
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
  const [adminFlags, setAdminFlags] = useState<AdminFlags>(EMPTY_ADMIN_FLAGS);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setFirebaseUser(null);
        setRole(null);
        setAdminFlags(EMPTY_ADMIN_FLAGS);
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

        const profile = userSnap?.exists() ? userSnap.data() : {};
        if (profile.disabled === true || profile.suspended === true) {
          await firebaseSignOut(auth);
          setFirebaseUser(null);
          setRole(null);
          setAdminFlags(EMPTY_ADMIN_FLAGS);
          setUser(null);
          setIsAuthenticated(false);
          clearActiveSession();
          setLoading(false);
          return;
        }

        const claimRole = normaliseRole(tokenResult?.claims?.role);
        const flags = extractAdminFlags(tokenResult?.claims as Record<string, unknown> | undefined);

        // Custom claims are authoritative. Never grant `admin` from a Firestore
        // document alone; non-privileged roles fall back safely for Spark-plan accounts.
        const docRole = normaliseRole(profile.role);
        const resolvedRole: Role =
          claimRole ?? (docRole && docRole !== 'admin' ? docRole : 'player');

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
          adminFlags: flags,
          isSuperAdmin: flags.isSuperAdmin,
          isModerator: flags.isModerator,
          isSafeguardingAdmin: flags.isSafeguardingAdmin,
          isFinanceAdmin: flags.isFinanceAdmin,
          photoUrl: (profile.photoUrl as string | undefined) ?? fbUser.photoURL ?? undefined,
        };

        setRole(resolvedRole);
        setAdminFlags(flags);
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
        setRole('player');
        setAdminFlags(EMPTY_ADMIN_FLAGS);
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          emailVerified: fbUser.emailVerified,
          name: fbUser.displayName ?? fbUser.email ?? 'Member',
          role: 'player',
          claimsRole: null,
          adminFlags: EMPTY_ADMIN_FLAGS,
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

    const userRef = doc(db, 'users', result.user.uid);
    const existing = await getDoc(userRef);
    if (!existing.exists()) {
      const safeRole: Exclude<Role, 'admin'> = fallbackRole === 'admin' ? 'player' : fallbackRole;
      await provisionSelf(
        result.user.uid,
        result.user.email ?? '',
        result.user.displayName ?? result.user.email ?? 'Member',
        safeRole,
        {},
      );
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

    let provisionedServerSide = canUseServerProvisioning;
    if (provisionedServerSide) {
      try {
        await createAccount({ email, password: pass, role: selectedRole, name, extra });
      } catch (err) {
        const code = (err as { code?: string })?.code ?? '';
        if (code === 'already-exists') {
          throw Object.assign(new Error('An account already exists with this email address.'), {
            code: 'auth/email-already-in-use',
          });
        }
        console.info(
          '[register] Server-side account creation unavailable; using guarded client provisioning.',
        );
        canUseServerProvisioning = false;
        provisionedServerSide = false;
      }
    }

    if (!provisionedServerSide) {
      const credential = await createUserWithEmailAndPassword(auth, email, pass);
      await provisionSelf(credential.user.uid, email, name, selectedRole, extra);
      await credential.user.getIdToken(true);
      if (!credential.user.emailVerified) {
        sendEmailVerification(credential.user).catch(() => undefined);
      }
      return;
    }

    const credential = await signInWithEmailAndPassword(auth, email, pass);
    await credential.user.getIdToken(true);

    if (!credential.user.emailVerified) {
      sendEmailVerification(credential.user).catch(() => undefined);
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
    const nextFlags = extractAdminFlags(token.claims as Record<string, unknown>);
    if (nextRole) {
      setRole(nextRole);
      setAdminFlags(nextFlags);
      setUser((prev) =>
        prev
          ? {
              ...prev,
              role: nextRole,
              claimsRole: nextRole,
              adminFlags: nextFlags,
              isSuperAdmin: nextFlags.isSuperAdmin,
              isModerator: nextFlags.isModerator,
              isSafeguardingAdmin: nextFlags.isSafeguardingAdmin,
              isFinanceAdmin: nextFlags.isFinanceAdmin,
            }
          : prev,
      );
    }
  };

  const value = useMemo(
    () => ({
      role,
      adminFlags,
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
    [role, adminFlags, isAuthenticated, user, firebaseUser, loading],
  );

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
