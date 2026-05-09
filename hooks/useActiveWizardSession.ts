'use client';

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  type FirestoreError,
} from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase/config';
import { paths } from '@/lib/firebase/paths';
import { toWizardSession } from '@/lib/firebase/converters';
import { useUser } from './useUser';
import type { WizardSession } from '@/types/wizardSession';

interface ActiveWizardSessionResult {
  data: WizardSession | null;
  loading: boolean;
  error: FirestoreError | undefined;
}

export function useActiveWizardSession(): ActiveWizardSessionResult {
  const { data: user } = useUser();
  const q = user
    ? query(
        collection(db, paths.wizardSessions(user.uid)),
        where('status', '==', 'in_progress'),
        orderBy('updatedAt', 'desc'),
        limit(1),
      )
    : null;

  const [snap, loading, error] = useCollection(q);

  if (!user) return { data: null, loading: false, error: undefined };

  const first = snap?.docs[0];
  if (!first) return { data: null, loading, error };

  return {
    data: toWizardSession({ id: first.id, ...first.data() }),
    loading,
    error,
  };
}
