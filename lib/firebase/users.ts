import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db } from './config';
import { toUser } from './converters';
import type { User, UserSource } from '@/types/user';

export function inferSource(user: FirebaseUser): UserSource {
  return user.providerData[0]?.providerId === 'google.com'
    ? 'signup_google'
    : 'signup_email';
}

function deriveDisplayName(user: FirebaseUser): string {
  if (user.displayName?.trim()) return user.displayName;
  const localPart = user.email?.split('@')[0];
  return localPart && localPart.length > 0 ? localPart : 'You';
}

export async function ensureUserDocument(user: FirebaseUser): Promise<void> {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { lastActiveAt: serverTimestamp() });
    return;
  }
  await setDoc(ref, {
    email: user.email ?? '',
    displayName: deriveDisplayName(user),
    createdAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
    source: inferSource(user),
  });
}

export async function getUser(uid: string): Promise<User | null> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return toUser({ id: snap.id, ...snap.data() });
}
