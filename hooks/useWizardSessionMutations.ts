'use client';

import { useCallback } from 'react';
import {
  createWizardSession,
  updateWizardSession,
  deleteWizardSession,
} from '@/lib/firebase/wizardSessions';
import { useUser } from './useUser';
import type { WizardSessionInput } from '@/types/wizardSession';

interface WizardSessionMutations {
  createWizardSession: (input: WizardSessionInput) => Promise<string>;
  updateWizardSession: (
    sessionId: string,
    input: Partial<WizardSessionInput>,
  ) => Promise<void>;
  deleteWizardSession: (sessionId: string) => Promise<void>;
}

export function useWizardSessionMutations(): WizardSessionMutations {
  const { data: user } = useUser();

  const create = useCallback(
    async (input: WizardSessionInput) => {
      if (!user) throw new Error('Not authenticated');
      return createWizardSession(user.uid, input);
    },
    [user],
  );

  const update = useCallback(
    async (sessionId: string, input: Partial<WizardSessionInput>) => {
      if (!user) throw new Error('Not authenticated');
      await updateWizardSession(user.uid, sessionId, input);
    },
    [user],
  );

  const remove = useCallback(
    async (sessionId: string) => {
      if (!user) throw new Error('Not authenticated');
      await deleteWizardSession(user.uid, sessionId);
    },
    [user],
  );

  return {
    createWizardSession: create,
    updateWizardSession: update,
    deleteWizardSession: remove,
  };
}
