import { httpsCallable } from 'firebase/functions';
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { functions, db } from '../firebase';

/**
 * Payment + subscription client service.
 *
 * Stripe state is server-authoritative: the browser never writes a price, a
 * status, or a verification flag. Every mutation goes through a Cloud Function
 * that re-derives the amount from the server-side catalogue. The local fallback
 * exists only for Spark-plan deployments where functions are not available —
 * and it writes to *request* collections that admins reconcile, never to a
 * trusted status field.
 */

export interface PlanDefinition {
  id: 'free' | 'standard' | 'premium';
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
}

export const CLUB_PLANS: PlanDefinition[] = [
  {
    id: 'free',
    name: 'Free Scout',
    price: '£0',
    period: 'forever',
    description: 'Baseline access for grassroots scouts and community clubs.',
    features: [
      '3 active opportunity listings',
      'Adult player search and discovery',
      'Deterministic match scores',
      'Direct candidate enquiries',
    ],
  },
  {
    id: 'standard',
    name: 'Club Pro',
    price: '£49',
    period: 'per month',
    description: 'For semi-pro and academy teams building a recruitment pipeline.',
    features: [
      'Unlimited opportunity listings',
      'Youth scouting access (requires certificate)',
      'Full six-dimension score breakdowns',
      'AI squad gap analysis',
      'Priority trial scheduling',
      'Club code and multi-channel invites',
    ],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Elite Academy',
    price: '£149',
    period: 'per month',
    description: 'Full recruitment suite for professional academies and multi-team setups.',
    features: [
      'Everything in Club Pro',
      'Continuous deterministic recalculation',
      'Multi-staff scout accounts',
      'Listing visibility boosts included',
      'Recruitment conversion funnel',
      'Named safeguarding compliance contact',
    ],
  },
];

export interface BoostPackage {
  id: '7-day' | '14-day' | '30-day';
  duration: string;
  price: string;
  impressions: string;
  popular?: boolean;
}

export const BOOST_PACKAGES: BoostPackage[] = [
  { id: '7-day', duration: '7 days', price: '£19', impressions: '~400 impressions' },
  { id: '14-day', duration: '14 days', price: '£35', impressions: '~950 impressions', popular: true },
  { id: '30-day', duration: '30 days', price: '£65', impressions: '~2,200 impressions' },
];

export interface PaymentRequestResult {
  mode: 'stripe' | 'request';
  url?: string;
  message: string;
}

function isUnavailable(err: unknown): boolean {
  const code = (err as { code?: string })?.code ?? '';
  const message = (err as { message?: string })?.message ?? '';
  return (
    code === 'functions/not-found' ||
    code === 'functions/unavailable' ||
    code === 'functions/internal' ||
    code === 'functions/failed-precondition' ||
    code === 'functions/deadline-exceeded' ||
    message.includes('CORS') ||
    message.includes('not found')
  );
}

/** Start a Stripe Checkout session for a club subscription plan. */
export async function startClubSubscription(
  uid: string,
  plan: 'standard' | 'premium',
): Promise<PaymentRequestResult> {
  const origin = window.location.origin;
  try {
    const create = httpsCallable<{ plan: string; successUrl: string; cancelUrl: string }, { url?: string }>(
      functions,
      'createCheckoutSession',
    );
    const { data } = await create({
      plan,
      successUrl: `${origin}/dashboard/club/subscription?status=success`,
      cancelUrl: `${origin}/dashboard/club/subscription?status=cancelled`,
    });
    if (data?.url) return { mode: 'stripe', url: data.url, message: 'Redirecting to Stripe…' };
    return { mode: 'request', message: 'Checkout session created without a redirect URL.' };
  } catch (err) {
    if (!isUnavailable(err)) throw err;
    // Spark plan: record an intent that finance admins reconcile. No trusted
    // status field is written, so no entitlement is granted client-side.
    await addDoc(collection(db, 'subscriptionRequests'), {
      userId: uid,
      plan,
      status: 'pending',
      source: 'client_fallback',
      createdAt: serverTimestamp(),
    });
    return {
      mode: 'request',
      message: 'Payment provider is not configured yet — your request has been queued for activation.',
    };
  }
}

/** Open the Stripe billing portal so a club can manage or cancel. */
export async function openBillingPortal(): Promise<string | null> {
  const origin = window.location.origin;
  try {
    const create = httpsCallable<{ returnUrl: string }, { url?: string }>(functions, 'createBillingPortalSession');
    const { data } = await create({ returnUrl: `${origin}/dashboard/club/subscription` });
    return data?.url ?? null;
  } catch (err) {
    if (isUnavailable(err)) return null;
    throw err;
  }
}

/** Purchase a visibility boost. Server derives price and expiry. */
export async function purchaseBoost(uid: string, packageId: string): Promise<PaymentRequestResult> {
  const origin = window.location.origin;
  try {
    const create = httpsCallable<Record<string, unknown>, { url?: string }>(
      functions,
      'createBoostCheckout',
    );
    const { data } = await create({
      packageId,
      ownerType: 'club',
      successUrl: `${origin}/dashboard/club/boosts?status=success`,
      cancelUrl: `${origin}/dashboard/club/boosts?status=cancelled`,
    });
    if (data?.url) return { mode: 'stripe', url: data.url, message: 'Redirecting to Stripe…' };
    return { mode: 'request', message: 'Boost request recorded.' };
  } catch (err) {
    if (!isUnavailable(err)) throw err;
    await addDoc(collection(db, 'boostRequests'), {
      userId: uid,
      packageId,
      status: 'pending',
      source: 'client_fallback',
      createdAt: serverTimestamp(),
    });
    return {
      mode: 'request',
      message: 'Payment provider is not configured yet — your boost request has been queued.',
    };
  }
}

export interface ActiveBoost {
  packageId?: string;
  boostStatus?: string;
  boostStartedAt?: { seconds?: number } | null;
  boostExpiresAt?: { seconds?: number } | null;
}

/** Read a player's own boost state (read-only; writes are server-owned). */
export async function getPlayerBoost(uid: string): Promise<ActiveBoost | null> {
  const snap = await getDoc(doc(db, 'players', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    packageId: data.boostProduct as string | undefined,
    boostStatus: data.boostStatus as string | undefined,
    boostStartedAt: (data.boostStartedAt as ActiveBoost['boostStartedAt']) ?? null,
    boostExpiresAt: (data.boostExpiresAt as ActiveBoost['boostExpiresAt']) ?? null,
  };
}

/** Player Pro membership request (server activates on payment). */
export async function requestPlayerPro(uid: string): Promise<PaymentRequestResult> {
  const origin = window.location.origin;
  try {
    const create = httpsCallable<Record<string, unknown>, { url?: string }>(functions, 'createPlayerProCheckout');
    const { data } = await create({
      successUrl: `${origin}/dashboard/subscription?status=success`,
      cancelUrl: `${origin}/dashboard/subscription?status=cancelled`,
    });
    if (data?.url) return { mode: 'stripe', url: data.url, message: 'Redirecting to Stripe…' };
    return { mode: 'request', message: 'Membership request recorded.' };
  } catch (err) {
    if (!isUnavailable(err)) throw err;
    await addDoc(collection(db, 'subscriptionRequests'), {
      userId: uid,
      plan: 'player-pro',
      status: 'pending',
      source: 'client_fallback',
      createdAt: serverTimestamp(),
    });
    return {
      mode: 'request',
      message: 'Payment provider is not configured yet — your request has been queued for activation.',
    };
  }
}

/**
 * Submit club verification. Prefers the callable which stamps review state and
 * writes audit records; on Spark it updates only the fields a club is allowed to
 * write and records the submission for admin review.
 */
export async function submitClubVerification(
  uid: string,
  payload: {
    registrationNumber?: string;
    authorizedRepName?: string;
    authorizedRepRole?: string;
    registrationDocUrl?: string;
    registrationDocPublicId?: string;
    safeguardingDocUrl?: string;
    safeguardingDocPublicId?: string;
    notes?: string;
  },
): Promise<{ mode: 'callable' | 'fallback' }> {
  try {
    const submit = httpsCallable(functions, 'submitVerification');
    await submit({
      documents: {
        registration: payload.registrationDocUrl ?? '',
        safeguarding: payload.safeguardingDocUrl ?? '',
      },
      notes: payload.notes ?? '',
    });
    // Callable stamps `verificationStatus`; mirror the non-protected profile
    // fields so the UI has them without waiting for the admin review.
    await updateDoc(doc(db, 'clubs', uid), {
      registrationNumber: payload.registrationNumber ?? '',
      authorizedRepName: payload.authorizedRepName ?? '',
      authorizedRepRole: payload.authorizedRepRole ?? '',
      registrationDocUrl: payload.registrationDocUrl ?? null,
      registrationDocPublicId: payload.registrationDocPublicId ?? null,
      safeguardingDocUrl: payload.safeguardingDocUrl ?? null,
      safeguardingDocPublicId: payload.safeguardingDocPublicId ?? null,
      updatedAt: serverTimestamp(),
    });
    return { mode: 'callable' };
  } catch (err) {
    if (!isUnavailable(err)) throw err;
    // `verificationStatus` and `verifiedAdult/Youth` are admin-only in rules, so
    // the fallback writes a review request instead of faking approval.
    await addDoc(collection(db, 'clubVerifications'), {
      clubId: uid,
      status: 'pending',
      documents: {
        registration: payload.registrationDocUrl ?? '',
        safeguarding: payload.safeguardingDocUrl ?? '',
      },
      registrationNumber: payload.registrationNumber ?? '',
      authorizedRepName: payload.authorizedRepName ?? '',
      authorizedRepRole: payload.authorizedRepRole ?? '',
      notes: payload.notes ?? '',
      source: 'client_submission',
      submittedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'clubs', uid), {
      verificationSubmittedAt: serverTimestamp(),
      registrationNumber: payload.registrationNumber ?? '',
      authorizedRepName: payload.authorizedRepName ?? '',
      authorizedRepRole: payload.authorizedRepRole ?? '',
      registrationDocUrl: payload.registrationDocUrl ?? null,
      registrationDocPublicId: payload.registrationDocPublicId ?? null,
      safeguardingDocUrl: payload.safeguardingDocUrl ?? null,
      safeguardingDocPublicId: payload.safeguardingDocPublicId ?? null,
      updatedAt: serverTimestamp(),
    });
    return { mode: 'fallback' };
  }
}