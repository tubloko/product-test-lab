'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAiLanding } from '@/hooks/useAiLanding';
import { useWizardSessionMutations } from '@/hooks/useWizardSessionMutations';
import { AvatarTabs } from './AvatarTabs';
import { PerformativeLoading } from './PerformativeLoading';
import type { LandingMatch } from '@/types/hypothesis';
import type { WizardSession } from '@/types/wizardSession';

interface Card6Props {
  session: WizardSession;
  sessionId: string;
}

const LandingValuesSchema = z.record(
  z.string(),
  z.object({
    heroMessage: z.string().min(2, 'Required'),
    primaryBenefit: z.string(),
    proofElement: z.string(),
    cta: z.string(),
  }),
);
type LandingValues = z.infer<typeof LandingValuesSchema>;

const LOADING_MESSAGES = ['Reading angle…', 'Drafting hero…', 'Matching tone…'];

export function Card6LandingMatch({ session, sessionId }: Card6Props) {
  const avatars = useMemo(
    () => session.selectedAvatars ?? [],
    [session.selectedAvatars],
  );
  const angles = useMemo(
    () => session.selectedAngles ?? {},
    [session.selectedAngles],
  );
  const initialMatches = useMemo(
    () => session.landingMatches ?? {},
    [session.landingMatches],
  );
  const { updateWizardSession } = useWizardSessionMutations();
  const { suggest } = useAiLanding();

  const [active, setActive] = useState(0);
  const [autoLoadingIdx, setAutoLoadingIdx] = useState<number | null>(null);
  const autoTriggeredRef = useRef<Set<number>>(new Set());

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LandingValues>({
    resolver: zodResolver(LandingValuesSchema),
    defaultValues: avatars.reduce<LandingValues>((acc, _, i) => {
      const match = initialMatches[String(i)];
      acc[String(i)] = match ?? {
        heroMessage: '',
        primaryBenefit: '',
        proofElement: '',
        cta: '',
      };
      return acc;
    }, {}),
  });

  useEffect(() => {
    const idx = active;
    const key = String(idx);
    if (autoTriggeredRef.current.has(idx)) return;
    const existing = initialMatches[key];
    if (existing && existing.heroMessage) return;
    const avatar = avatars[idx];
    const angle = angles[key];
    if (!avatar || !angle) return;
    autoTriggeredRef.current.add(idx);
    queueMicrotask(() => {
      setAutoLoadingIdx(idx);
      suggest({
        productName: session.productBasics?.name ?? 'Untitled',
        avatar,
        angle,
        offerPrice: session.context?.sellingPrice ?? null,
      })
        .then((out) => {
          if (!out) {
            toast.error('Could not auto-suggest landing for this avatar.');
            return;
          }
          setValue(`${key}.heroMessage`, out.heroMessage);
          setValue(`${key}.primaryBenefit`, out.primaryBenefit);
          setValue(`${key}.proofElement`, out.proofElement);
          setValue(`${key}.cta`, out.cta);
        })
        .finally(() => {
          setAutoLoadingIdx((cur) => (cur === idx ? null : cur));
        });
    });
  }, [
    active,
    avatars,
    angles,
    initialMatches,
    suggest,
    setValue,
    session.productBasics?.name,
    session.context?.sellingPrice,
  ]);

  if (avatars.length === 0) {
    return (
      <p className="py-12 text-center text-body text-text-muted">
        Pick avatars on Card 4.
      </p>
    );
  }

  const handleBack = async () => {
    try {
      await updateWizardSession(sessionId, { currentStep: 5 });
    } catch (e) {
      console.error('[wizard/card6] back failed', e);
      toast.error('Could not go back.');
    }
  };

  const onSubmit = async (values: LandingValues) => {
    const out: Record<string, LandingMatch> = {};
    avatars.forEach((_, i) => {
      const slice = values[String(i)];
      if (slice) out[String(i)] = slice;
    });
    try {
      await updateWizardSession(sessionId, { landingMatches: out, currentStep: 7 });
    } catch (e) {
      console.error('[wizard/card6] next failed', e);
      toast.error('Could not save. Try again.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto flex w-full max-w-3xl flex-col gap-6"
      noValidate
    >
      <header className="space-y-1">
        <h2 className="text-heading text-text">Landing page match</h2>
        <p className="text-caption text-text-muted">
          The landing must continue the angle. If your ad promises X, the page must lead with X — not features.
        </p>
      </header>

      <AvatarTabs avatars={avatars} active={active} onActiveChange={setActive}>
        {(idx) => {
          const key = String(idx);
          if (autoLoadingIdx === idx) {
            return <PerformativeLoading messages={LOADING_MESSAGES} />;
          }
          const errs = errors[key];
          return (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor={`${key}-hero`}>Hero message *</Label>
                <Input
                  id={`${key}-hero`}
                  aria-invalid={Boolean(errs?.heroMessage)}
                  {...register(`${key}.heroMessage`)}
                />
                {errs?.heroMessage && (
                  <p className="text-caption text-danger-text">
                    {errs.heroMessage.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${key}-benefit`}>Primary benefit</Label>
                <Input id={`${key}-benefit`} {...register(`${key}.primaryBenefit`)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${key}-proof`}>Proof element</Label>
                <Input
                  id={`${key}-proof`}
                  placeholder="UGC video / customer reviews / before-after / demo / expert / comparison table"
                  {...register(`${key}.proofElement`)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${key}-cta`}>CTA</Label>
                <Input id={`${key}-cta`} {...register(`${key}.cta`)} />
              </div>
            </div>
          );
        }}
      </AvatarTabs>

      <footer className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={handleBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Next'}
        </Button>
      </footer>
    </form>
  );
}
