import {
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { paths } from './paths';
import { toWizardSession } from './converters';
import {
  WizardSessionInputSchema,
  type WizardSession,
  type WizardSessionInput,
} from '@/types/wizardSession';

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k of Object.keys(obj) as (keyof T)[]) {
    if (obj[k] !== undefined) out[k] = obj[k];
  }
  return out;
}

export async function createWizardSession(
  uid: string,
  input: WizardSessionInput,
): Promise<string> {
  const parsed = WizardSessionInputSchema.parse(input);
  const ref = collection(db, paths.wizardSessions(uid));
  const docRef = await addDoc(ref, {
    ...stripUndefined(parsed),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    completedAt: null,
  });
  return docRef.id;
}

export async function updateWizardSession(
  uid: string,
  sessionId: string,
  input: Partial<WizardSessionInput>,
): Promise<void> {
  const parsed = WizardSessionInputSchema.partial().parse(input);
  const ref = doc(db, paths.wizardSession(uid, sessionId));
  await updateDoc(ref, {
    ...stripUndefined(parsed),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteWizardSession(
  uid: string,
  sessionId: string,
): Promise<void> {
  await deleteDoc(doc(db, paths.wizardSession(uid, sessionId)));
}

export async function getWizardSession(
  uid: string,
  sessionId: string,
): Promise<WizardSession | null> {
  const ref = doc(db, paths.wizardSession(uid, sessionId));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return toWizardSession({ id: snap.id, ...snap.data() });
}

/**
 * Latest in-progress session for the resume banner on the dashboard.
 * Returns null if none.
 */
export async function getActiveWizardSession(
  uid: string,
): Promise<WizardSession | null> {
  const q = query(
    collection(db, paths.wizardSessions(uid)),
    where('status', '==', 'in_progress'),
    orderBy('updatedAt', 'desc'),
    limit(1),
  );
  const snap = await getDocs(q);
  const first = snap.docs[0];
  if (!first) return null;
  return toWizardSession({ id: first.id, ...first.data() });
}
