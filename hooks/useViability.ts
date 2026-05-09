'use client';

import { doc, type FirestoreError } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase/config';
import { paths } from '@/lib/firebase/paths';
import { toViability } from '@/lib/firebase/converters';
import { useUser } from './useUser';
import type { Viability } from '@/types/viability';

interface ViabilityResult {
  data: Viability | null;
  loading: boolean;
  error: FirestoreError | undefined;
}

export function useViability(productId: string | undefined): ViabilityResult {
  const { data: user } = useUser();
  const ref =
    user && productId ? doc(db, paths.viabilityDoc(user.uid, productId)) : null;
  const [snap, loading, error] = useDocument(ref);

  if (!user || !productId) return { data: null, loading: false, error: undefined };
  if (!snap?.exists()) return { data: null, loading, error };

  return {
    data: toViability({ id: snap.id, ...snap.data() }),
    loading,
    error,
  };
}
