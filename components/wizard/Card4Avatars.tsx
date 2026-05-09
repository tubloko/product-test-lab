'use client';

import { useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAiAvatars } from '@/hooks/useAiAvatars';
import { useWizardSessionMutations } from '@/hooks/useWizardSessionMutations';
import { PerformativeLoading } from './PerformativeLoading';
import { StaggeredReveal } from './StaggeredReveal';
import { AvatarSuggestionCard } from './AvatarSuggestionCard';
import type { AvatarSuggestion, WizardSession } from '@/types/wizardSession';

interface Card4Props {
  session: WizardSession;
  sessionId: string;
}

const LOADING_MESSAGES = [
  'Reading product context…',
  'Considering viability flags…',
  'Mapping pain points…',
  'Generating avatars…',
];

export function Card4Avatars({ session, sessionId }: Card4Props) {
  const { updateWizardSession } = useWizardSessionMutations();
  const { suggest, loading: aiLoading } = useAiAvatars();

  const [generated, setGenerated] = useState<AvatarSuggestion[] | null>(
    session.selectedAvatars && session.selectedAvatars.length > 0
      ? session.selectedAvatars
      : null,
  );
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(() => {
    if (session.selectedAvatars && session.selectedAvatars.length > 0) {
      return new Set(session.selectedAvatars.map((_, i) => i));
    }
    return new Set();
  });

  const handleGenerate = async () => {
    const productName = session.productBasics?.name;
    if (!productName) {
      toast.error('Add a product name on Card 1 first.');
      return;
    }
    const niche = session.context?.niche ?? null;
    const sellingPrice = session.context?.sellingPrice ?? null;
    const viabilitySummary = session.viability?.summary?.recommendation ?? null;
    const out = await suggest({ productName, niche, sellingPrice, viabilitySummary });
    if (!out) {
      toast.error('Could not generate avatars. Try again.');
      return;
    }
    setGenerated(out.avatars);
    setSelectedIndices(new Set());
  };

  const toggleSelection = (idx: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else if (next.size < 3) {
        next.add(idx);
      } else {
        toast.error('Pick at most 3 avatars.');
      }
      return next;
    });
  };

  const handleBack = async () => {
    try {
      await updateWizardSession(sessionId, { currentStep: 3 });
    } catch (e) {
      console.error('[wizard/card4] back failed', e);
      toast.error('Could not go back.');
    }
  };

  const handleNext = async () => {
    if (!generated) {
      toast.error('Generate avatars first.');
      return;
    }
    if (selectedIndices.size < 1) {
      toast.error('Pick at least 1 avatar.');
      return;
    }
    const filtered = Array.from(selectedIndices)
      .sort((a, b) => a - b)
      .map((i) => generated[i]!);
    try {
      await updateWizardSession(sessionId, {
        selectedAvatars: filtered,
        selectedAngles: null,
        landingMatches: null,
        offers: null,
        expectedKPIs: null,
        currentStep: 5,
      });
    } catch (e) {
      console.error('[wizard/card4] next failed', e);
      toast.error('Could not save. Try again.');
    }
  };

  if (aiLoading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header>
          <h2 className="text-heading text-text">Generate avatars</h2>
        </header>
        <PerformativeLoading messages={LOADING_MESSAGES} />
      </div>
    );
  }

  if (!generated) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 py-12">
        <header className="space-y-2 text-center">
          <h2 className="text-heading text-text">Generate buyer avatars</h2>
          <p className="text-body text-text-muted">
            We&apos;ll suggest 5 distinct avatars based on your product context.
          </p>
        </header>
        <Button size="lg" onClick={handleGenerate}>
          <Sparkles className="size-5" />
          Generate 5 buyer avatars
        </Button>
        <Button variant="ghost" onClick={handleBack}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-heading text-text">Pick 1–3 avatars</h2>
          <p className="text-caption text-text-muted">
            You picked: {selectedIndices.size} / 3
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleGenerate}>
          <RefreshCw className="size-4" />
          Regenerate
        </Button>
      </header>

      <div className="grid gap-3">
        <StaggeredReveal>
          {generated.map((avatar, idx) => (
            <AvatarSuggestionCard
              key={idx}
              avatar={avatar}
              selected={selectedIndices.has(idx)}
              onToggle={() => toggleSelection(idx)}
              disabled={!selectedIndices.has(idx) && selectedIndices.size >= 3}
            />
          ))}
        </StaggeredReveal>
      </div>

      <footer className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={handleBack}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={selectedIndices.size < 1}>
          Next ({selectedIndices.size} selected)
        </Button>
      </footer>
    </div>
  );
}
