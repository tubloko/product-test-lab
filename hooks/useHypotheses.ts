'use client';

import { collection, query, orderBy, type FirestoreError } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase/config';
import { paths } from '@/lib/firebase/paths';
import { toHypothesis } from '@/lib/firebase/converters';
import { useUser } from './useUser';
import type { Hypothesis } from '@/types/hypothesis';

interface HypothesesResult {
  data: Hypothesis[];
  loading: boolean;
  error: FirestoreError | undefined;
}

export function useHypotheses(productId: string | undefined): HypothesesResult {
  const { data: user } = useUser();
  const q =
    user && productId
      ? query(
          collection(db, paths.hypotheses(user.uid, productId)),
          orderBy('createdAt', 'asc'),
        )
      : null;

  const [snap, loading, error] = useCollection(q);

  if (!user || !productId) return { data: [], loading: false, error: undefined };

  const data = (snap?.docs ?? []).map((d) =>
    toHypothesis({ id: d.id, ...d.data() }),
  );
  return { data, loading, error };
}
