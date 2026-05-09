import {
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { paths } from './paths';
import { toHypothesis } from './converters';
import {
  HypothesisInputBaseSchema,
  HypothesisInputSchema,
  type Hypothesis,
  type HypothesisInput,
} from '@/types/hypothesis';

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k of Object.keys(obj) as (keyof T)[]) {
    if (obj[k] !== undefined) out[k] = obj[k];
  }
  return out;
}

export async function createHypothesis(
  uid: string,
  productId: string,
  input: HypothesisInput,
): Promise<string> {
  const parsed = HypothesisInputSchema.parse(input);
  const ref = collection(db, paths.hypotheses(uid, productId));
  const docRef = await addDoc(ref, {
    ...stripUndefined(parsed),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Update with merged validation: fetch current → merge with input →
 * run full HypothesisInputSchema.parse on the merged shape so Trinity
 * holds even when the caller passes a partial that omits trinity fields.
 */
export async function updateHypothesis(
  uid: string,
  productId: string,
  hypothesisId: string,
  input: Partial<HypothesisInput>,
): Promise<void> {
  if (Object.keys(input).length === 0) return;
  const parsedInput = HypothesisInputBaseSchema.partial().parse(input);
  const ref = doc(db, paths.hypothesis(uid, productId, hypothesisId));
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Hypothesis not found');
  const current = toHypothesis({ id: snap.id, ...snap.data() });
  const merged = { ...current, ...parsedInput };
  HypothesisInputSchema.parse(merged);
  await updateDoc(ref, {
    ...stripUndefined(parsedInput),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteHypothesis(
  uid: string,
  productId: string,
  hypothesisId: string,
): Promise<void> {
  await deleteDoc(doc(db, paths.hypothesis(uid, productId, hypothesisId)));
}

export async function getHypothesis(
  uid: string,
  productId: string,
  hypothesisId: string,
): Promise<Hypothesis | null> {
  const ref = doc(db, paths.hypothesis(uid, productId, hypothesisId));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return toHypothesis({ id: snap.id, ...snap.data() });
}
