'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ViabilityAnswersSchema,
  type ViabilityAnswers,
} from '@/types/viability';
import { useWizardSessionMutations } from '@/hooks/useWizardSessionMutations';
import { useAiViabilitySummary } from '@/hooks/useAiViabilitySummary';
import { useUser } from '@/hooks/useUser';
import { useProductMutations } from '@/hooks/useProductMutations';
import { upsertViability } from '@/lib/firebase/viability';
import { PerformativeLoading } from './PerformativeLoading';
import { ViabilityScorecard } from './ViabilityScorecard';
import type { WizardSession } from '@/types/wizardSession';
import type { ViabilitySummaryOutput } from '@/lib/claude/schemas';

interface Card3Props {
  session: WizardSession;
  sessionId: string;
}

type RadioField = Exclude<FieldPath<ViabilityAnswers>, 'notes'>;

interface Question {
  field: RadioField;
  label: string;
  helper: string;
  options: { value: string; label: string }[];
}

const QUESTIONS: Question[] = [
  {
    field: 'saturation',
    label: 'How long has this product been viral?',
    helper: 'Search the product on TikTok and check the oldest viral video.',
    options: [
      { value: 'lt_1_month', label: '<1 month' },
      { value: '1_3_months', label: '1–3 months' },
      { value: '3_6_months', label: '3–6 months' },
      { value: '6_plus_months', label: '6+ months' },
      { value: 'unsure', label: 'Unsure' },
    ],
  },
  {
    field: 'competition',
    label: 'How many active advertisers?',
    helper: 'Open Facebook Ad Library and search the product.',
    options: [
      { value: '0_5', label: '0–5' },
      { value: '5_20', label: '5–20' },
      { value: '20_plus', label: '20+' },
      { value: 'unsure', label: 'Unsure' },
    ],
  },
  {
    field: 'brandRisk',
    label: 'Brand risk',
    helper: 'Is this a branded product?',
    options: [
      { value: 'generic', label: 'Generic' },
      { value: 'single_brand', label: 'Branded by 1 company' },
      { value: 'multi_brand', label: 'Branded by multiple' },
      { value: 'unsure', label: 'Unsure' },
    ],
  },
  {
    field: 'sourcing',
    label: 'Sourcing',
    helper: 'Can you find this on AliExpress / CJ / Zendrop?',
    options: [
      { value: 'fast', label: 'Yes — fast shipping' },
      { value: 'slow', label: 'Yes — slow shipping' },
      { value: 'none', label: 'No' },
      { value: 'unsure', label: 'Unsure' },
    ],
  },
  {
    field: 'creativeAvailability',
    label: 'Creative availability',
    helper: 'UGC videos / reviews / demos available?',
    options: [
      { value: 'plenty', label: 'Plenty' },
      { value: 'some', label: 'Some' },
      { value: 'little', label: 'Very little' },
      { value: 'none', label: 'None' },
    ],
  },
  {
    field: 'wowMoment',
    label: 'Wow moment',
    helper: 'Does the product have a visual moment that grabs attention?',
    options: [
      { value: 'strong', label: 'Yes' },
      { value: 'sort_of', label: 'Sort of' },
      { value: 'none', label: 'Not really' },
    ],
  },
  {
    field: 'affordableCPA',
    label: 'Affordable CPA',
    helper:
      'At 2x ROAS target, can your margin support a realistic CPA in your market?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'unsure', label: 'Unsure' },
    ],
  },
];

type Phase = 'form' | 'loading' | 'scorecard';

const LOADING_MESSAGES = [
  'Reading your inputs…',
  'Cross-checking risk patterns…',
  'Building summary…',
];

export function Card3Viability({ session, sessionId }: Card3Props) {
  const router = useRouter();
  const { data: user } = useUser();
  const { updateWizardSession } = useWizardSessionMutations();
  const { createProduct } = useProductMutations();
  const { suggest } = useAiViabilitySummary();

  const initialPhase: Phase = session.viability?.summary ? 'scorecard' : 'form';
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [scorecard, setScorecard] = useState<ViabilitySummaryOutput | null>(
    session.viability?.summary ?? null,
  );
  const [savingKilled, setSavingKilled] = useState(false);

  const previousAnswers = session.viability?.answers;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ViabilityAnswers>({
    resolver: zodResolver(ViabilityAnswersSchema),
    defaultValues: previousAnswers
      ? { ...previousAnswers, notes: previousAnswers.notes ?? '' }
      : { notes: '' },
  });

  const handleBack = async () => {
    try {
      await updateWizardSession(sessionId, { currentStep: 2 });
    } catch (e) {
      console.error('[wizard/card3] back failed', e);
      toast.error('Could not go back. Try again.');
    }
  };

  const handleEditAnswers = () => setPhase('form');

  const handleRunSummary = async (answers: ViabilityAnswers) => {
    const productName = session.productBasics?.name;
    if (!productName || productName.length < 2) {
      toast.error('Add a product name on Card 1 first.');
      return;
    }
    const niche = session.context?.niche ?? null;
    const normalizedAnswers: ViabilityAnswers = {
      ...answers,
      notes: answers.notes && answers.notes.length > 0 ? answers.notes : null,
    };
    setPhase('loading');
    const out = await suggest({ productName, niche, answers: normalizedAnswers });
    if (!out) {
      toast.error('AI summary failed. Please try again.');
      setPhase('form');
      return;
    }
    setScorecard(out);
    try {
      await updateWizardSession(sessionId, {
        viability: { answers: normalizedAnswers, summary: out },
      });
      setPhase('scorecard');
    } catch (e) {
      console.error('[wizard/card3] persist failed', e);
      toast.error('Generated summary, but could not save. Try again.');
      setPhase('scorecard');
    }
  };

  const handleContinue = () => {
    toast('Cards 4–9 land in E7.2.');
  };

  const handleSaveAsKilled = async () => {
    if (!user) return;
    if (!scorecard) return;
    if (!session.viability?.answers) {
      toast.error('Run the viability summary first.');
      return;
    }
    const productName = session.productBasics?.name;
    if (!productName) {
      toast.error('Product name is required.');
      return;
    }
    setSavingKilled(true);
    try {
      const productId = await createProduct({
        name: productName,
        sourceUrl: session.productBasics?.sourceUrl ?? null,
        imageUrl: session.productBasics?.imageUrl ?? null,
        niche: session.context?.niche ?? null,
        sellingPrice: session.context?.sellingPrice ?? null,
        supplierCost: session.context?.supplierCost ?? null,
        status: 'killed',
        source: 'wizard',
      });
      await upsertViability(user.uid, productId, {
        answers: session.viability.answers,
        summary: scorecard,
        generatedAt: new Date(),
      });
      await updateWizardSession(sessionId, {
        productId,
        status: 'completed',
      });
      toast.success('Saved as Killed.');
      router.replace('/');
    } catch (e) {
      console.error('[wizard/card3] save as killed failed', e);
      toast.error('Could not save. Try again.');
      setSavingKilled(false);
    }
  };

  if (phase === 'loading') {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="space-y-1">
          <h2 className="text-heading text-text">Viability check</h2>
        </header>
        <PerformativeLoading messages={LOADING_MESSAGES} />
      </div>
    );
  }

  if (phase === 'scorecard' && scorecard) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="space-y-1">
          <h2 className="text-heading text-text">
            Viability check — {session.productBasics?.name ?? 'Untitled'}
          </h2>
        </header>
        <ViabilityScorecard summary={scorecard} />
        <footer className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleBack} disabled={savingKilled}>
              Back
            </Button>
            <Button variant="ghost" onClick={handleEditAnswers} disabled={savingKilled}>
              Edit answers
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleSaveAsKilled}
              disabled={savingKilled}
            >
              {savingKilled ? 'Saving…' : 'Save as Killed'}
            </Button>
            <Button onClick={handleContinue} disabled title="Cards 4–9 land in E7.2">
              Continue to hypotheses →
            </Button>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(handleRunSummary)}
      className="mx-auto flex w-full max-w-2xl flex-col gap-6"
      noValidate
    >
      <header className="space-y-2">
        <h2 className="text-heading text-text">Viability check</h2>
        <p className="text-body text-text-muted">
          Before we build hypotheses, let&apos;s check if this product is worth testing.
          Strongly recommended — it saves money on bad products.
        </p>
      </header>

      {QUESTIONS.map((q) => (
        <fieldset key={q.field} className="space-y-2">
          <legend className="text-body font-medium text-text">{q.label}</legend>
          <p className="text-caption text-text-muted">{q.helper}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {q.options.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-caption text-text transition-colors hover:bg-elevated has-[:checked]:border-primary has-[:checked]:bg-elevated"
              >
                <input
                  type="radio"
                  value={opt.value}
                  className="size-3.5 accent-primary"
                  {...register(q.field)}
                />
                {opt.label}
              </label>
            ))}
          </div>
          {errors[q.field] && (
            <p className="text-caption text-danger-text">Pick one</p>
          )}
        </fieldset>
      ))}

      <fieldset className="space-y-1.5">
        <Label htmlFor="notes">Anything else worth flagging?</Label>
        <Textarea
          id="notes"
          rows={3}
          placeholder="Optional…"
          aria-invalid={Boolean(errors.notes)}
          {...register('notes')}
        />
        {errors.notes && (
          <p className="text-caption text-danger-text">{errors.notes.message}</p>
        )}
      </fieldset>

      <footer className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={handleBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Running…' : 'Run viability summary'}
        </Button>
      </footer>
    </form>
  );
}
