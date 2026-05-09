'use client';

import { useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAiAngles } from '@/hooks/useAiAngles';
import { useWizardSessionMutations } from '@/hooks/useWizardSessionMutations';
import { PerformativeLoading } from './PerformativeLoading';
import { StaggeredReveal } from './StaggeredReveal';
import { AvatarTabs } from './AvatarTabs';
import { AngleSuggestionCard } from './AngleSuggestionCard';
import type { AngleSuggestion, WizardSession } from '@/types/wizardSession';

interface Card5Props {
  session: WizardSession;
  sessionId: string;
}

const LOADING_MESSAGES = ['Reading avatar…', 'Drafting angles…', 'Tightening hooks…'];

export function Card5Angles({ session, sessionId }: Card5Props) {
  const { updateWizardSession } = useWizardSessionMutations();
  const { suggest } = useAiAngles();

  const avatars = session.selectedAvatars ?? [];
  const [active, setActive] = useState(0);

  const [batches, setBatches] = useState<Record<number, AngleSuggestion[] | null>>(() => {
    const initial: Record<number, AngleSuggestion[] | null> = {};
    avatars.forEach((_, i) => {
      const stored = session.selectedAngles?.[String(i)];
      initial[i] = stored ? [stored] : null;
    });
    return initial;
  });
  const [selected, setSelected] = useState<Record<number, AngleSuggestion | null>>(() => {
    const initial: Record<number, AngleSuggestion | null> = {};
    avatars.forEach((_, i) => {
      initial[i] = session.selectedAngles?.[String(i)] ?? null;
    });
    return initial;
  });
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);

  if (avatars.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <p className="text-body text-text-muted">No avatars selected. Go back to Card 4.</p>
      </div>
    );
  }

  const handleGenerate = async (idx: number) => {
    const avatar = avatars[idx];
    if (!avatar) return;
    setLoadingIdx(idx);
    const productName = session.productBasics?.name ?? 'Untitled';
    const niche = session.context?.niche ?? null;
    const out = await suggest({ productName, niche, avatar });
    setLoadingIdx(null);
    if (!out) {
      toast.error('Could not generate angles. Try again.');
      return;
    }
    setBatches((b) => ({ ...b, [idx]: out.angles }));
    setSelected((s) => ({ ...s, [idx]: null }));
  };

  const handleSelect = (idx: number, angle: AngleSuggestion) => {
    setSelected((s) => ({ ...s, [idx]: angle }));
  };

  const allSelected = avatars.every((_, i) => selected[i] != null);

  const handleBack = async () => {
    try {
      await updateWizardSession(sessionId, { currentStep: 4 });
    } catch (e) {
      console.error('[wizard/card5] back failed', e);
      toast.error('Could not go back.');
    }
  };

  const handleNext = async () => {
    if (!allSelected) {
      toast.error('Pick an angle for every avatar tab.');
      return;
    }
    const out: Record<string, AngleSuggestion> = {};
    avatars.forEach((_, i) => {
      out[String(i)] = selected[i]!;
    });
    try {
      await updateWizardSession(sessionId, { selectedAngles: out, currentStep: 6 });
    } catch (e) {
      console.error('[wizard/card5] next failed', e);
      toast.error('Could not save. Try again.');
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="space-y-1">
        <h2 className="text-heading text-text">Pick an angle for each avatar</h2>
        <p className="text-caption text-text-muted">One angle per avatar.</p>
      </header>

      <AvatarTabs avatars={avatars} active={active} onActiveChange={setActive}>
        {(idx) => {
          const batch = batches[idx];
          const sel = selected[idx];
          if (loadingIdx === idx) {
            return <PerformativeLoading messages={LOADING_MESSAGES} />;
          }
          if (!batch) {
            return (
              <div className="flex flex-col items-center gap-4 py-8">
                <Button size="lg" onClick={() => handleGenerate(idx)}>
                  <Sparkles className="size-5" />
                  Generate 5 angles
                </Button>
              </div>
            );
          }
          return (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-caption text-text-muted">
                  {sel ? '1 selected' : 'Pick one'}
                </p>
                <Button variant="ghost" size="sm" onClick={() => handleGenerate(idx)}>
                  <RefreshCw className="size-4" />
                  Regenerate
                </Button>
              </div>
              <div className="grid gap-3">
                <StaggeredReveal>
                  {batch.map((angle, i) => (
                    <AngleSuggestionCard
                      key={i}
                      angle={angle}
                      selected={Boolean(sel && sel.hook === angle.hook && sel.type === angle.type)}
                      onSelect={() => handleSelect(idx, angle)}
                    />
                  ))}
                </StaggeredReveal>
              </div>
            </div>
          );
        }}
      </AvatarTabs>

      <footer className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={handleBack}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={!allSelected}>
          Next
        </Button>
      </footer>
    </div>
  );
}
