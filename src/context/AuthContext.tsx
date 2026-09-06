import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { auth, db } from '../lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export type Role = 'player' | 'guardian' | 'club' | 'admin';

export interface AppUser {
  uid: string;
  email: string | null;
  role: Role;
  name: string;
  emailVerified: boolean;
  claimsRole?: Role | null;
  [key: string]: unknown;
}

interface AuthContextType {
  role: Role | null;
  isAuthenticated: boolean;
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: (fallbackRole?: Role) => Promise<void>;
  register: (email: string, pass: string, role: Role, name: string, extra?: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  sendReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          const [tokenResult, userSnap] = await Promise.all([
            fbUser.getIdTokenResult(true).catch(() => null),
            getDoc(doc(db, 'users', fbUser.uid)),
          ]);

          const claimRole = (tokenResult?.claims?.role as Role | undefined) ?? null;
          const profile = userSnap.exists() ? userSnap.data() : {};
          const userRole: Role = claimRole ?? ((profile.role as Role | undefined) ?? 'player');

          setRole(userRole);
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            emailVerified: fbUser.emailVerified,
            name: (profile.name as string) ?? fbUser.displayName ?? fbUser.email ?? 'User',
            role: userRole,
            claimsRole: claimRole,
            ...profile,
          });
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setIsAuthenticated(true);
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            emailVerified: fbUser.emailVerified,
            name: fbUser.email ?? 'User',
            role: 'player',
            claimsRole: null,
          });
        }
      } else {
        setFirebaseUser(null);
        setRole(null);
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const loginWithGoogle = async (fallbackRole: Role = 'player') => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);

    await setDoc(
      doc(db, 'users', result.user.uid),
      {
        uid: result.user.uid,
        email: result.user.email,
        name: result.user.displayName ?? result.user.email ?? 'User',
        role: fallbackRole,
        emailVerified: result.user.emailVerified,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  };

  const register = async (
    email: string,
    pass: string,
    selectedRole: Role,
    name: string,
    extra?: Record<string, unknown>,
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = cred.user.uid;

    const isYouth = extra?.isYouth === true;

    // Write to users collection (source of role truth)
    await setDoc(doc(db, 'users', uid), {
      uid,
      email,
      name,
      role: selectedRole,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      emailVerified: false,
      disabled: false,
    });

    // Write role-specific document
    if (selectedRole === 'player') {
      await setDoc(doc(db, 'players', uid), {
        uid,
        email,
        name,
        role: 'player',
        isYouth,
        searchable: !isYouth,
        consentStatus: isYouth ? 'pending' : 'n/a',
        profileComplete: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(isYouth && extra?.dob ? { dob: extra.dob } : {}),
      });

      // Youth safeguarding: create a youthProfiles record
      if (isYouth && extra) {
        await setDoc(doc(db, 'youthProfiles', uid), {
          playerId: uid,
          guardianName: extra.guardianName ?? '',
          guardianEmail: extra.guardianEmail ?? '',
          relationship: extra.relationship ?? '',
          consentStatus: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } else if (selectedRole === 'guardian') {
      await setDoc(doc(db, 'guardians', uid), {
        uid,
        email,
        name,
        role: 'guardian',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (selectedRole === 'club') {
      await setDoc(doc(db, 'clubs', uid), {
        uid,
        email,
        name,
        role: 'club',
        verificationStatus: 'pending',
        verifiedAdult: false,
        verifiedYouth: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // Send verification email (non-blocking)
    sendEmailVerification(cred.user).catch(console.warn);
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  const sendReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider
      value={useMemo(
        () => ({ role, isAuthenticated, user, firebaseUser, loading, login, loginWithGoogle, register, logout, sendReset }),
        [role, isAuthenticated, user, firebaseUser, loading],
      )}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
