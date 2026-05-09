'use client';

import { doc, type FirestoreError } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase/config';
import { paths } from '@/lib/firebase/paths';
import { toWizardSession } from '@/lib/firebase/converters';
import { useUser } from './useUser';
import type { WizardSession } from '@/types/wizardSession';

interface WizardSessionResult {
  data: WizardSession | null;
  loading: boolean;
  error: FirestoreError | undefined;
}

export function useWizardSession(
  sessionId: string | undefined,
): WizardSessionResult {
  const { data: user } = useUser();
  const ref =
    user && sessionId ? doc(db, paths.wizardSession(user.uid, sessionId)) : null;
  const [snap, loading, error] = useDocument(ref);

  if (!user || !sessionId) return { data: null, loading: false, error: undefined };
  if (!snap?.exists()) return { data: null, loading, error };

  return {
    data: toWizardSession({ id: snap.id, ...snap.data() }),
    loading,
    error,
  };
}
