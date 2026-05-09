import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { paths } from './paths';
import { toViability } from './converters';
import {
  ViabilityInputSchema,
  type Viability,
  type ViabilityInput,
} from '@/types/viability';

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k of Object.keys(obj) as (keyof T)[]) {
    if (obj[k] !== undefined) out[k] = obj[k];
  }
  return out;
}

/**
 * Singleton: deterministic doc id `current` per product. Read-then-write
 * so we only set createdAt on first insert; subsequent calls merge with
 * a fresh updatedAt.
 */
export async function upsertViability(
  uid: string,
  productId: string,
  input: ViabilityInput,
): Promise<void> {
  const parsed = ViabilityInputSchema.parse(input);
  const ref = doc(db, paths.viabilityDoc(uid, productId));
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await setDoc(
      ref,
      {
        ...stripUndefined(parsed),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return;
  }
  await setDoc(ref, {
    ...stripUndefined(parsed),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getViability(
  uid: string,
  productId: string,
): Promise<Viability | null> {
  const ref = doc(db, paths.viabilityDoc(uid, productId));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return toViability({ id: snap.id, ...snap.data() });
}

export async function deleteViability(
  uid: string,
  productId: string,
): Promise<void> {
  await deleteDoc(doc(db, paths.viabilityDoc(uid, productId)));
}
