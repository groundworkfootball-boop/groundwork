import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export async function getYouthProfile(uid: string) {
  const snapshot = await getDoc(doc(db, 'youthProfiles', uid));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function listConsentAudits(uid: string) {
  const snapshot = await getDocs(query(collection(db, 'consentAudits'), where('youthId', '==', uid), orderBy('timestamp', 'desc'), limit(20)));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
}
