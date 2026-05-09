'use client';

import { useCallback } from 'react';
import { upsertViability, deleteViability } from '@/lib/firebase/viability';
import { useUser } from './useUser';
import type { ViabilityInput } from '@/types/viability';

interface ViabilityMutations {
  upsertViability: (input: ViabilityInput) => Promise<void>;
  deleteViability: () => Promise<void>;
}

export function useViabilityMutations(productId: string): ViabilityMutations {
  const { data: user } = useUser();

  const upsert = useCallback(
    async (input: ViabilityInput) => {
      if (!user) throw new Error('Not authenticated');
      await upsertViability(user.uid, productId, input);
    },
    [user, productId],
  );

  const remove = useCallback(async () => {
    if (!user) throw new Error('Not authenticated');
    await deleteViability(user.uid, productId);
  }, [user, productId]);

  return {
    upsertViability: upsert,
    deleteViability: remove,
  };
}
