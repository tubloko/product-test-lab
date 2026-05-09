'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAiBaselines } from '@/hooks/useAiBaselines';
import { useWizardSessionMutations } from '@/hooks/useWizardSessionMutations';
import { AvatarTabs } from './AvatarTabs';
import type { KPIs } from '@/types/hypothesis';
import type { WizardSession } from '@/types/wizardSession';

interface Card8Props {
  session: WizardSession;
  sessionId: string;
}

const numberSetValueAs = (v: unknown) =>
  v === '' || v === null || v === undefined ? null : Number(v);

const KPIsValuesSchema = z.record(
  z.string(),
  z.object({
    ctr: z.number().nullable(),
    cpc: z.number().nullable(),
    atc: z.number().nullable(),
    roas: z.number().nullable(),
  }),
);
type KPIsValues = z.infer<typeof KPIsValuesSchema>;

export function Card8ExpectedKPIs({ session, sessionId }: Card8Props) {
  const avatars = session.selectedAvatars ?? [];
  const angles = session.selectedAngles ?? {};
  const initial = session.expectedKPIs ?? {};
  const { updateWizardSession } = useWizardSessionMutations();
  const { suggest } = useAiBaselines();
  const [active, setActive] = useState(0);
  const [suggestingIdx, setSuggestingIdx] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<KPIsValues>({
    resolver: zodResolver(KPIsValuesSchema),
    defaultValues: avatars.reduce<KPIsValues>((acc, _, i) => {
      const cur = initial[String(i)];
      acc[String(i)] = {
        ctr: cur?.ctr ?? null,
        cpc: cur?.cpc ?? null,
        atc: cur?.atc ?? null,
        roas: cur?.roas ?? null,
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
      await updateWizardSession(sessionId, { currentStep: 7 });
    } catch (e) {
      console.error('[wizard/card8] back failed', e);
      toast.error('Could not go back.');
    }
  };

  const handleSuggestBaselines = async (idx: number) => {
    const avatar = avatars[idx];
    const angle = angles[String(idx)];
    if (!avatar || !angle) {
      toast.error('Missing avatar or angle for this tab.');
      return;
    }
    setSuggestingIdx(idx);
    const out = await suggest({
      niche: session.context?.niche ?? null,
      avatar,
      angle,
      sellingPrice: session.context?.sellingPrice ?? null,
    });
    setSuggestingIdx(null);
    if (!out) {
      toast.error('Could not suggest baselines.');
      return;
    }
    const mid = (r: { min: number; max: number }) => (r.min + r.max) / 2;
    const key = String(idx);
    setValue(`${key}.ctr`, mid(out.ctr));
    setValue(`${key}.cpc`, mid(out.cpc));
    setValue(`${key}.atc`, mid(out.atc));
    setValue(`${key}.roas`, mid(out.roas));
  };

  const onSubmit = async (values: KPIsValues) => {
    const out: Record<string, KPIs> = {};
    avatars.forEach((_, i) => {
      const v = values[String(i)];
      if (!v) return;
      out[String(i)] = {
        ctr: v.ctr,
        cpc: v.cpc,
        atc: v.atc,
        roas: v.roas,
      };
    });
    try {
      await updateWizardSession(sessionId, { expectedKPIs: out, currentStep: 9 });
    } catch (e) {
      console.error('[wizard/card8] next failed', e);
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
        <h2 className="text-heading text-text">Expected KPIs</h2>
        <p className="text-caption text-text-muted">
          Optional baseline targets. You can have AI suggest sensible defaults from your niche + avatar + angle.
        </p>
      </header>

      <AvatarTabs avatars={avatars} active={active} onActiveChange={setActive}>
        {(idx) => {
          const key = String(idx);
          const isSuggesting = suggestingIdx === idx;
          return (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSuggestBaselines(idx)}
                  disabled={isSuggesting}
                >
                  <Sparkles className="size-4" />
                  {isSuggesting ? 'Suggesting…' : 'Suggest baselines'}
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`${key}-ctr`}>CTR (%)</Label>
                  <Input
                    id={`${key}-ctr`}
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    {...register(`${key}.ctr`, { setValueAs: numberSetValueAs })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${key}-cpc`}>CPC ($)</Label>
                  <Input
                    id={`${key}-cpc`}
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    {...register(`${key}.cpc`, { setValueAs: numberSetValueAs })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${key}-atc`}>ATC (%)</Label>
                  <Input
                    id={`${key}-atc`}
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    {...register(`${key}.atc`, { setValueAs: numberSetValueAs })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${key}-roas`}>ROAS</Label>
                  <Input
                    id={`${key}-roas`}
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    {...register(`${key}.roas`, { setValueAs: numberSetValueAs })}
                  />
                </div>
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
