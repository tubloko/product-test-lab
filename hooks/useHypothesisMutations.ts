'use client';

import { useCallback } from 'react';
import {
  createHypothesis,
  updateHypothesis,
  deleteHypothesis,
} from '@/lib/firebase/hypotheses';
import { useUser } from './useUser';
import type { HypothesisInput } from '@/types/hypothesis';

interface HypothesisMutations {
  createHypothesis: (input: HypothesisInput) => Promise<string>;
  updateHypothesis: (
    hypothesisId: string,
    input: Partial<HypothesisInput>,
  ) => Promise<void>;
  deleteHypothesis: (hypothesisId: string) => Promise<void>;
}

export function useHypothesisMutations(productId: string): HypothesisMutations {
  const { data: user } = useUser();

  const create = useCallback(
    async (input: HypothesisInput) => {
      if (!user) throw new Error('Not authenticated');
      return createHypothesis(user.uid, productId, input);
    },
    [user, productId],
  );

  const update = useCallback(
    async (hypothesisId: string, input: Partial<HypothesisInput>) => {
      if (!user) throw new Error('Not authenticated');
      await updateHypothesis(user.uid, productId, hypothesisId, input);
    },
    [user, productId],
  );

  const remove = useCallback(
    async (hypothesisId: string) => {
      if (!user) throw new Error('Not authenticated');
      await deleteHypothesis(user.uid, productId, hypothesisId);
    },
    [user, productId],
  );

  return {
    createHypothesis: create,
    updateHypothesis: update,
    deleteHypothesis: remove,
  };
}
