'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWizardSessionMutations } from '@/hooks/useWizardSessionMutations';
import type { WizardSession } from '@/types/wizardSession';

const numberSetValueAs = (v: unknown) =>
  v === '' || v === null || v === undefined ? undefined : Number(v);

const Card2Schema = z.object({
  niche: z.string().max(120).optional(),
  sellingPrice: z.number().nonnegative('Must be ≥ 0').optional(),
  supplierCost: z.number().nonnegative('Must be ≥ 0').optional(),
});
type Card2Values = z.infer<typeof Card2Schema>;

interface Card2Props {
  session: WizardSession;
  sessionId: string;
}

export function Card2NicheAndPrice({ session, sessionId }: Card2Props) {
  const { updateWizardSession } = useWizardSessionMutations();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Card2Values>({
    resolver: zodResolver(Card2Schema),
    defaultValues: {
      niche: session.context?.niche ?? '',
      sellingPrice: session.context?.sellingPrice ?? undefined,
      supplierCost: session.context?.supplierCost ?? undefined,
    },
  });

  const sellingPrice = useWatch({ control, name: 'sellingPrice' });
  const supplierCost = useWatch({ control, name: 'supplierCost' });
  const margin =
    typeof sellingPrice === 'number' && typeof supplierCost === 'number'
      ? sellingPrice - supplierCost
      : null;
  const marginPct =
    margin !== null && typeof sellingPrice === 'number' && sellingPrice > 0
      ? (margin / sellingPrice) * 100
      : null;

  const onSubmit = async (values: Card2Values) => {
    try {
      await updateWizardSession(sessionId, {
        context: {
          niche: values.niche && values.niche.trim().length > 0 ? values.niche.trim() : null,
          sellingPrice: typeof values.sellingPrice === 'number' ? values.sellingPrice : null,
          supplierCost: typeof values.supplierCost === 'number' ? values.supplierCost : null,
        },
        currentStep: 3,
      });
    } catch (e) {
      console.error('[wizard/card2] save failed', e);
      toast.error('Could not save. Try again.');
    }
  };

  const handleBack = async () => {
    try {
      await updateWizardSession(sessionId, { currentStep: 1 });
    } catch (e) {
      console.error('[wizard/card2] back failed', e);
      toast.error('Could not go back. Try again.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto flex w-full max-w-2xl flex-col gap-6"
      noValidate
    >
      <header className="space-y-1">
        <h2 className="text-heading text-text">Niche &amp; price</h2>
        <p className="text-caption text-text-muted">
          Margin is what gives a test room to breathe. Numbers are optional but help downstream.
        </p>
      </header>

      <div className="space-y-1.5">
        <Label htmlFor="niche">Niche</Label>
        <Input
          id="niche"
          autoComplete="off"
          placeholder="e.g. home & kitchen, pet care, fitness"
          aria-invalid={Boolean(errors.niche)}
          {...register('niche')}
        />
        {errors.niche && (
          <p className="text-caption text-danger-text">{errors.niche.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="sellingPrice">Selling price</Label>
          <Input
            id="sellingPrice"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="59.00"
            aria-invalid={Boolean(errors.sellingPrice)}
            {...register('sellingPrice', { setValueAs: numberSetValueAs })}
          />
          {errors.sellingPrice && (
            <p className="text-caption text-danger-text">
              {errors.sellingPrice.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="supplierCost">Supplier cost</Label>
          <Input
            id="supplierCost"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="14.00"
            aria-invalid={Boolean(errors.supplierCost)}
            {...register('supplierCost', { setValueAs: numberSetValueAs })}
          />
          {errors.supplierCost && (
            <p className="text-caption text-danger-text">
              {errors.supplierCost.message}
            </p>
          )}
        </div>
      </div>

      {margin !== null && (
        <p className="text-caption text-text-muted">
          Margin: ${margin.toFixed(2)}
          {marginPct !== null ? ` (${marginPct.toFixed(0)}%)` : ''}
        </p>
      )}

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
