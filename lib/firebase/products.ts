import {
  doc,
  collection,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import { paths } from './paths';
import { toProduct } from './converters';
import { ProductInputSchema, type Product, type ProductInput } from '@/types/product';

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k of Object.keys(obj) as (keyof T)[]) {
    if (obj[k] !== undefined) out[k] = obj[k];
  }
  return out;
}

export async function createProduct(uid: string, input: ProductInput): Promise<string> {
  const parsed = ProductInputSchema.parse(input);
  const ref = collection(db, paths.products(uid));
  const docRef = await addDoc(ref, {
    ...stripUndefined(parsed),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateProduct(
  uid: string,
  productId: string,
  input: Partial<ProductInput>,
): Promise<void> {
  const parsed = ProductInputSchema.partial().parse(input);
  const ref = doc(db, paths.product(uid, productId));
  await updateDoc(ref, {
    ...stripUndefined(parsed),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Recursive delete: walks hypotheses + viability subcollections, then
 * deletes the product. Client SDK has no native recursive delete.
 */
export async function deleteProduct(uid: string, productId: string): Promise<void> {
  const refsToDelete: string[] = [];

  const hypothesesSnap = await getDocs(
    collection(db, paths.hypotheses(uid, productId)),
  );
  for (const h of hypothesesSnap.docs) refsToDelete.push(h.ref.path);

  const viabilitySnap = await getDocs(collection(db, paths.viability(uid, productId)));
  for (const v of viabilitySnap.docs) refsToDelete.push(v.ref.path);

  refsToDelete.push(paths.product(uid, productId));

  const CHUNK = 400;
  for (let i = 0; i < refsToDelete.length; i += CHUNK) {
    const batch = writeBatch(db);
    for (const path of refsToDelete.slice(i, i + CHUNK)) {
      batch.delete(doc(db, path));
    }
    await batch.commit();
  }
}

export async function getProduct(
  uid: string,
  productId: string,
): Promise<Product | null> {
  const ref = doc(db, paths.product(uid, productId));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return toProduct({ id: snap.id, ...snap.data() });
}
