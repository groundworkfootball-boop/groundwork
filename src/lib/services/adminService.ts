import { collection, getCountFromServer, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export interface AdminOverview {
  totalPlayers: number;
  adultPlayers: number;
  youthPlayers: number;
  totalClubs: number;
  verifiedClubs: number;
  pendingVerifications: number;
  pendingYouthVerifications: number;
  totalApplications: number;
  activeSubscriptions: number;
  openReports: number;
  openGdprRequests: number;
  aiCalls30d: number;
}

async function count(queryRef: Parameters<typeof getCountFromServer>[0]): Promise<number> {
  try {
    const snapshot = await getCountFromServer(queryRef);
    return snapshot.data().count;
  } catch (err) {
    console.warn('[adminService] count failed', err);
    return 0;
  }
}

/**
 * Aggregated platform metrics. Uses Firestore count aggregation so the browser
 * never downloads whole collections.
 */
export async function getAdminOverview(): Promise<AdminOverview> {
  const results = await Promise.all([
    count(collection(db, 'players')),
    count(query(collection(db, 'players'), where('isYouth', '==', true))),
    count(collection(db, 'clubs')),
    count(query(collection(db, 'clubs'), where('verifiedAdult', '==', true))),
    count(query(collection(db, 'clubs'), where('verificationStatus', 'in', ['pending', 'under_review']))),
    count(query(collection(db, 'youthVerifications'), where('status', '==', 'pending'))),
    count(collection(db, 'applications')),
    count(query(collection(db, 'subscriptions'), where('status', '==', 'active'))),
    count(query(collection(db, 'moderationReports'), where('status', 'in', ['pending', 'investigating']))),
    count(query(collection(db, 'gdprRequests'), where('status', 'in', ['pending', 'processing']))),
  ]);

  const [
    totalPlayers,
    youthPlayers,
    totalClubs,
    verifiedClubs,
    pendingVerifications,
    pendingYouthVerifications,
    totalApplications,
    activeSubscriptions,
    openReports,
    openGdprRequests,
  ] = results;

  return {
    totalPlayers,
    adultPlayers: Math.max(0, totalPlayers - youthPlayers),
    youthPlayers,
    totalClubs,
    verifiedClubs,
    pendingVerifications,
    pendingYouthVerifications,
    totalApplications,
    activeSubscriptions,
    openReports,
    openGdprRequests,
    aiCalls30d: 0,
  };
}

export interface AuditLogEntry {
  id: string;
  action?: string;
  actorId?: string;
  actorRole?: string;
  resourceType?: string;
  resourceId?: string;
  timestamp?: { seconds: number };
  metadata?: Record<string, unknown>;
}

export async function listRecentAuditLogs(max = 20): Promise<AuditLogEntry[]> {
  const snapshot = await getDocs(
    query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(max)),
  );
  return snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<AuditLogEntry, 'id'>) }));
}
