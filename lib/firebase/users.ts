import {
  Timestamp,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db } from './config';
import { UserSchema, type User, type UserSource } from '@/types/user';

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

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date(0);
}

function toUser(raw: { id: string } & Record<string, unknown>): User {
  const parsed = UserSchema.parse({
    id: raw.id,
    email: raw.email,
    displayName: raw.displayName,
    createdAt: toDate(raw.createdAt),
    lastActiveAt: toDate(raw.lastActiveAt),
    source: raw.source,
  });
  return parsed;
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
