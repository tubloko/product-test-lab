'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useWizardSession } from '@/hooks/useWizardSession';
import { WizardLayout } from '@/components/wizard/WizardLayout';
import { Card1ProductBasics } from '@/components/wizard/Card1ProductBasics';
import { Card2NicheAndPrice } from '@/components/wizard/Card2NicheAndPrice';
import { Card3Viability } from '@/components/wizard/Card3Viability';
import { Card4Avatars } from '@/components/wizard/Card4Avatars';
import { Card5Angles } from '@/components/wizard/Card5Angles';
import { Card6LandingMatch } from '@/components/wizard/Card6LandingMatch';
import { Card7Offer } from '@/components/wizard/Card7Offer';
import { Card8ExpectedKPIs } from '@/components/wizard/Card8ExpectedKPIs';
import { Card9Review } from '@/components/wizard/Card9Review';

interface WizardPageProps {
  params: Promise<{ sessionId: string }>;
}

export default function WizardPage({ params }: WizardPageProps) {
  const { sessionId } = use(params);
  const router = useRouter();
  const { data: session, loading, error } = useWizardSession(sessionId);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100svh-8rem)] items-center justify-center text-text-muted">
        Loading wizard…
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-[calc(100svh-8rem)] items-center justify-center">
        <p className="text-caption text-danger-text">
          Couldn&apos;t load wizard: {error.message}
        </p>
      </div>
    );
  }
  if (!session) {
    return (
      <div className="flex min-h-[calc(100svh-8rem)] flex-col items-center justify-center gap-3">
        <p className="text-body text-text">This wizard session no longer exists.</p>
        <button
          className="text-caption text-primary underline-offset-4 hover:underline"
          onClick={() => router.replace('/')}
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <WizardLayout session={session} sessionId={sessionId}>
      {session.currentStep === 1 && (
        <Card1ProductBasics session={session} sessionId={sessionId} />
      )}
      {session.currentStep === 2 && (
        <Card2NicheAndPrice session={session} sessionId={sessionId} />
      )}
      {session.currentStep === 3 && (
        <Card3Viability session={session} sessionId={sessionId} />
      )}
      {session.currentStep === 4 && (
        <Card4Avatars session={session} sessionId={sessionId} />
      )}
      {session.currentStep === 5 && (
        <Card5Angles session={session} sessionId={sessionId} />
      )}
      {session.currentStep === 6 && (
        <Card6LandingMatch session={session} sessionId={sessionId} />
      )}
      {session.currentStep === 7 && (
        <Card7Offer session={session} sessionId={sessionId} />
      )}
      {session.currentStep === 8 && (
        <Card8ExpectedKPIs session={session} sessionId={sessionId} />
      )}
      {session.currentStep === 9 && (
        <Card9Review session={session} sessionId={sessionId} />
      )}
    </WizardLayout>
  );
}
