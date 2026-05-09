'use client';

import { Hourglass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActiveWizardSession } from '@/hooks/useActiveWizardSession';

export function ResumeWizardBanner() {
  const { data: session } = useActiveWizardSession();
  if (!session) return null;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-elevated p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 text-body text-text">
        <Hourglass className="size-4 text-text-muted" />
        <span>
          You have a wizard in progress (step {session.currentStep} of 9).
        </span>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled title="Coming in E7">
          Resume
        </Button>
        <Button variant="ghost" size="sm" disabled title="Coming in E7">
          Discard
        </Button>
      </div>
    </div>
  );
}
