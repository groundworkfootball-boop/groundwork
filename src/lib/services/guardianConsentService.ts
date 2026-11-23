import { httpsCallable } from 'firebase/functions';
import { addDoc, collection, getDocs, limit, query, serverTimestamp, where } from 'firebase/firestore';
import { db, functions } from '../firebase';

/**
 * Guardian + safeguarding client service.
 *
 * Guardians never write to a youth's profile directly: Firestore rules only
 * allow the owning player (or an admin) to update `players/{uid}`. Every
 * guardian action therefore goes through a callable that verifies the
 * relationship server-side. On Spark plans the fallback writes a *request*
 * document for admin review — never a trusted consent state.
 */

export const PRIVACY_NOTICE_VERSION = '2026.1-EN';

export interface LinkedYouth {
  id: string;
  name: string;
  dob?: string;
  email?: string;
  consentStatus: 'pending' | 'granted' | 'withdrawn';
  linkedAt?: { seconds?: number } | null;
}

function isUnavailable(err: unknown): boolean {
  const code = (err as { code?: string })?.code ?? '';
  const message = (err as { message?: string })?.message ?? '';
  return (
    code === 'functions/not-found' ||
    code === 'functions/unavailable' ||
    code === 'functions/internal' ||
    code === 'functions/failed-precondition' ||
    message.includes('not found') ||
    message.includes('CORS')
  );
}

/** Guardian links a youth account to their own portal. */
export async function linkYouthAccount(input: {
  guardianEmail: string;
  guardianName: string;
  relationship: string;
  childEmail: string;
}): Promise<{ mode: 'callable' | 'request'; youthId?: string; name?: string }> {
  try {
    const link = httpsCallable<typeof input, { ok: boolean; youthId: string; name: string }>(
      functions,
      'linkGuardianYouth',
    );
    const { data } = await link(input);
    return { mode: 'callable', youthId: data.youthId, name: data.name };
  } catch (err) {
    if (!isUnavailable(err)) throw err;

    const snap = await getDocs(
      query(collection(db, 'players'), where('email', '==', input.childEmail.toLowerCase().trim()), limit(1)),
    );
    if (snap.empty) throw new Error('No player account found with that email address.');

    const childId = snap.docs[0].id;
    const child = snap.docs[0].data() as { isYouth?: boolean; name?: string };
    if (child.isYouth !== true) {
      throw new Error('That account is registered as an adult player. Ask our team to convert it to a youth profile.');
    }

    await addDoc(collection(db, 'guardianLinkRequests'), {
      guardianId: input.guardianEmail,
      guardianEmail: input.guardianEmail,
      guardianName: input.guardianName,
      relationship: input.relationship,
      youthId: childId,
      youthEmail: input.childEmail.toLowerCase().trim(),
      status: 'pending',
      source: 'client_fallback',
      createdAt: serverTimestamp(),
    });

    return { mode: 'request', youthId: childId, name: child.name ?? 'your player' };
  }
}

/** Guardian grants consent for a youth profile. */
export async function grantConsent(youthId: string): Promise<{ mode: 'callable' | 'request' }> {
  try {
    const grant = httpsCallable<{ youthId: string; privacyNoticeVersion: string }, { ok: boolean }>(
      functions,
      'grantConsentInApp',
    );
    await grant({ youthId, privacyNoticeVersion: PRIVACY_NOTICE_VERSION });
    return { mode: 'callable' };
  } catch (err) {
    if (!isUnavailable(err)) throw err;
    await addDoc(collection(db, 'consentRequests'), {
      youthId,
      action: 'granted',
      status: 'pending',
      privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      source: 'client_fallback',
      createdAt: serverTimestamp(),
    });
    return { mode: 'request' };
  }
}

/**
 * Guardian withdraws consent. Withdrawal is the safe direction (it always
 * reduces visibility), so it also works through the callable on Spark.
 */
export async function withdrawConsent(youthId: string): Promise<{ mode: 'callable' | 'request' }> {
  try {
    const withdraw = httpsCallable<{ youthId: string }, { ok: boolean }>(functions, 'withdrawConsent');
    await withdraw({ youthId });
    return { mode: 'callable' };
  } catch (err) {
    if (!isUnavailable(err)) throw err;
    await addDoc(collection(db, 'consentRequests'), {
      youthId,
      action: 'withdrawn',
      status: 'pending',
      privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      source: 'client_fallback',
      createdAt: serverTimestamp(),
    });
    return { mode: 'request' };
  }
}

/** List youth profiles linked to the signed-in guardian (read is rule-allowed). */
export async function listLinkedYouth(guardianEmail: string): Promise<LinkedYouth[]> {
  if (!guardianEmail) return [];
  const snap = await getDocs(
    query(collection(db, 'players'), where('guardianEmail', '==', guardianEmail), limit(20)),
  );
  return snap.docs.map((entry) => {
    const data = entry.data() as Record<string, unknown>;
    return {
      id: entry.id,
      name: (data.name as string) ?? (data.displayName as string) ?? 'Youth player',
      dob: data.dob as string | undefined,
      email: data.email as string | undefined,
      consentStatus: ((data.consentStatus as string) ?? 'pending') as LinkedYouth['consentStatus'],
      linkedAt: (data.consentInviteSentAt as LinkedYouth['linkedAt']) ?? null,
    };
  });
}

/** Append-only consent audit read for the guardian portal. */
export async function listConsentAudit(guardianEmail: string) {
  const snap = await getDocs(
    query(collection(db, 'consentAudits'), where('guardianEmail', '==', guardianEmail), limit(50)),
  ).catch(() => null);
  if (!snap) return [];
  return snap.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Record<string, unknown>) }));
}