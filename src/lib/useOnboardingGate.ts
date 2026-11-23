import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../context/AuthContext';

export interface OnboardingGate {
  loading: boolean;
  /** True when the signed-in user still has to complete first-run setup. */
  needsOnboarding: boolean;
  role: Role | null;
  reload: () => void;
}

/**
 * Decides whether a user must be sent through first-run onboarding.
 *
 * Rules-first safety: the check is read-only and fails open to the dashboard so
 * a Firestore hiccup can never lock a user out of their own workspace.
 */
export function useOnboardingGate(): OnboardingGate {
  const { user, role, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    if (!isAuthenticated || !user?.uid) {
      setLoading(false);
      setNeedsOnboarding(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const check = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (cancelled) return;
        const onboarding = (snap.data()?.onboarding ?? {}) as {
          completed?: boolean;
          role?: string;
          version?: number;
        };
              // Admins are provisioned operationally, so they never see the guided
              // flow. Players, clubs and guardians all get a first-run setup.
              const eligibleRole = role === 'player' || role === 'club' || role === 'guardian';
        const alreadyDone = onboarding.completed === true && onboarding.role === role;
        setNeedsOnboarding(Boolean(eligibleRole && !alreadyDone));
      } catch {
        if (!cancelled) setNeedsOnboarding(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void check();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.uid, role, nonce]);

  return { loading, needsOnboarding, role, reload };
}