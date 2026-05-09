'use client';

import { doc, type FirestoreError } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase/config';
import { paths } from '@/lib/firebase/paths';
import { toHypothesis } from '@/lib/firebase/converters';
import { useUser } from './useUser';
import type { Hypothesis } from '@/types/hypothesis';

interface HypothesisResult {
  data: Hypothesis | null;
  loading: boolean;
  error: FirestoreError | undefined;
}

export function useHypothesis(
  productId: string | undefined,
  hypothesisId: string | undefined,
): HypothesisResult {
  const { data: user } = useUser();
  const ref =
    user && productId && hypothesisId
      ? doc(db, paths.hypothesis(user.uid, productId, hypothesisId))
      : null;
  const [snap, loading, error] = useDocument(ref);

  if (!user || !productId || !hypothesisId)
    return { data: null, loading: false, error: undefined };
  if (!snap?.exists()) return { data: null, loading, error };

  return {
    data: toHypothesis({ id: snap.id, ...snap.data() }),
    loading,
    error,
  };
}
