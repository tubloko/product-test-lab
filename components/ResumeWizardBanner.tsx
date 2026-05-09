'use client';

import { useRouter } from 'next/navigation';
import { Hourglass } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useActiveWizardSession } from '@/hooks/useActiveWizardSession';
import { useWizardSessionMutations } from '@/hooks/useWizardSessionMutations';

export function ResumeWizardBanner() {
  const { data: session } = useActiveWizardSession();
  const router = useRouter();
  const { deleteWizardSession } = useWizardSessionMutations();

  if (!session) return null;

  const handleResume = () => router.push(`/wizard/${session.id}`);

  const handleDiscard = async () => {
    try {
      await deleteWizardSession(session.id);
      toast.success('Wizard discarded.');
    } catch (e) {
      console.error('[resume-banner/discard] failed', e);
      toast.error('Could not discard wizard.');
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-elevated p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 text-body text-text">
        <Hourglass className="size-4 text-text-muted" />
        <span>
          You have a wizard in progress (step {session.currentStep} of 9).
        </span>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={handleResume}>
          Resume
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDiscard}>
          Discard
        </Button>
      </div>
    </div>
  );
}
