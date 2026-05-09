'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useWizardSessionMutations } from '@/hooks/useWizardSessionMutations';

export function useStartWizard() {
  const router = useRouter();
  const { createWizardSession } = useWizardSessionMutations();
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    try {
      const sessionId = await createWizardSession({
        productId: '',
        currentStep: 1,
        status: 'in_progress',
        productBasics: null,
        context: null,
        viability: null,
        selectedAvatars: null,
        selectedAngles: null,
        landingMatches: null,
        offers: null,
        expectedKPIs: null,
      });
      router.push(`/wizard/${sessionId}`);
    } catch (e) {
      console.error('[wizard/start] failed', e);
      toast.error('Could not start wizard. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return { start, loading };
}
