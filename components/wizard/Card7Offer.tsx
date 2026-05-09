'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWizardSessionMutations } from '@/hooks/useWizardSessionMutations';
import { AvatarTabs } from './AvatarTabs';
import type { Offer } from '@/types/hypothesis';
import type { WizardSession } from '@/types/wizardSession';

interface Card7Props {
  session: WizardSession;
  sessionId: string;
}

const numberSetValueAs = (v: unknown) =>
  v === '' || v === null || v === undefined ? undefined : Number(v);

const OffersSchema = z.record(
  z.string(),
  z.object({
    price: z
      .number({ message: 'Required' })
      .nonnegative('Must be ≥ 0'),
    structure: z.string(),
    urgency: z.string(),
  }),
);
type OffersValues = z.infer<typeof OffersSchema>;

export function Card7Offer({ session, sessionId }: Card7Props) {
  const avatars = session.selectedAvatars ?? [];
  const initial = session.offers ?? {};
  const defaultPrice = session.context?.sellingPrice ?? undefined;
  const { updateWizardSession } = useWizardSessionMutations();
  const [active, setActive] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OffersValues>({
    resolver: zodResolver(OffersSchema),
    defaultValues: avatars.reduce<OffersValues>((acc, _, i) => {
      const cur = initial[String(i)];
      acc[String(i)] = {
        price: cur?.price ?? defaultPrice ?? 0,
        structure: cur?.structure ?? '',
        urgency: cur?.urgency ?? '',
      };
      return acc;
    }, {}),
  });

  if (avatars.length === 0) {
    return (
      <p className="py-12 text-center text-body text-text-muted">
        Pick avatars on Card 4.
      </p>
    );
  }

  const handleBack = async () => {
    try {
      await updateWizardSession(sessionId, { currentStep: 6 });
    } catch (e) {
      console.error('[wizard/card7] back failed', e);
      toast.error('Could not go back.');
    }
  };

  const onSubmit = async (values: OffersValues) => {
    const out: Record<string, Offer> = {};
    avatars.forEach((_, i) => {
      const v = values[String(i)];
      if (!v) return;
      out[String(i)] = {
        price: v.price,
        structure: v.structure,
        urgency: v.urgency.trim().length > 0 ? v.urgency : null,
      };
    });
    try {
      await updateWizardSession(sessionId, { offers: out, currentStep: 8 });
    } catch (e) {
      console.error('[wizard/card7] next failed', e);
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
        <h2 className="text-heading text-text">Offer</h2>
        <p className="text-caption text-text-muted">
          Price tier, structure, and urgency per avatar.
        </p>
      </header>

      <AvatarTabs avatars={avatars} active={active} onActiveChange={setActive}>
        {(idx) => {
          const key = String(idx);
          const errs = errors[key];
          return (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor={`${key}-price`}>Price ($) *</Label>
                <Input
                  id={`${key}-price`}
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  aria-invalid={Boolean(errs?.price)}
                  {...register(`${key}.price`, { setValueAs: numberSetValueAs })}
                />
                {errs?.price && (
                  <p className="text-caption text-danger-text">{errs.price.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${key}-structure`}>Structure</Label>
                <Input
                  id={`${key}-structure`}
                  placeholder="e.g. 1 for $59 / 2 for $99 (save $19)"
                  {...register(`${key}.structure`)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${key}-urgency`}>Urgency</Label>
                <Input
                  id={`${key}-urgency`}
                  placeholder="e.g. Free shipping ends midnight"
                  {...register(`${key}.urgency`)}
                />
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
