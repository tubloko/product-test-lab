'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useProductMutations } from '@/hooks/useProductMutations';
import { useUser } from '@/hooks/useUser';
import { useWizardSessionMutations } from '@/hooks/useWizardSessionMutations';
import { createHypothesis } from '@/lib/firebase/hypotheses';
import { upsertViability } from '@/lib/firebase/viability';
import {
  HypothesisInputSchema,
  type HypothesisInput,
  type HypothesisStatus,
} from '@/types/hypothesis';
import type { ProductStatus } from '@/types/product';
import type { WizardSession } from '@/types/wizardSession';
import { HypothesisReviewItem } from './HypothesisReviewItem';

interface Card9Props {
  session: WizardSession;
  sessionId: string;
}

type ReviewStatus = Extract<HypothesisStatus, 'draft' | 'ready_to_test'>;

export function Card9Review({ session, sessionId }: Card9Props) {
  const router = useRouter();
  const { data: user } = useUser();
  const { updateWizardSession } = useWizardSessionMutations();
  const { createProduct } = useProductMutations();

  const avatars = useMemo(
    () => session.selectedAvatars ?? [],
    [session.selectedAvatars],
  );
  const angles = useMemo(
    () => session.selectedAngles ?? {},
    [session.selectedAngles],
  );
  const landingMatches = useMemo(
    () => session.landingMatches ?? {},
    [session.landingMatches],
  );
  const offers = useMemo(() => session.offers ?? {}, [session.offers]);
  const expectedKPIs = useMemo(
    () => session.expectedKPIs ?? {},
    [session.expectedKPIs],
  );

  const [statuses, setStatuses] = useState<Record<number, ReviewStatus>>(() =>
    avatars.reduce<Record<number, ReviewStatus>>((acc, _, i) => {
      acc[i] = 'draft';
      return acc;
    }, {}),
  );
  const [saving, setSaving] = useState(false);

  const setStatus = (i: number, s: ReviewStatus) =>
    setStatuses((prev) => ({ ...prev, [i]: s }));

  const trinityChecks = useMemo(
    () =>
      avatars.map((a, i) => {
        const angle = angles[String(i)];
        const lm = landingMatches[String(i)];
        return Boolean(
          a.painPoint?.trim() && angle?.hook?.trim() && lm?.heroMessage?.trim(),
        );
      }),
    [avatars, angles, landingMatches],
  );

  const handleBack = async () => {
    try {
      await updateWizardSession(sessionId, { currentStep: 8 });
    } catch (e) {
      console.error('[wizard/card9] back failed', e);
      toast.error('Could not go back.');
    }
  };

  const handleSaveAndFinish = async () => {
    if (!user) return;
    if (avatars.length === 0) {
      toast.error('No avatars selected.');
      return;
    }
    const productName = session.productBasics?.name;
    if (!productName) {
      toast.error('Product name is missing.');
      return;
    }

    const inputs: HypothesisInput[] = [];
    for (let i = 0; i < avatars.length; i++) {
      const a = avatars[i]!;
      const ang = angles[String(i)];
      const lm = landingMatches[String(i)];
      const off = offers[String(i)];
      const kp = expectedKPIs[String(i)];
      if (!ang || !lm || !off) {
        toast.error(`Hypothesis ${i + 1}: missing data. Go back and fill all cards.`);
        return;
      }
      const { reasoning: _ar, ...avatarPlain } = a;
      const { reasoning: _gr, ...anglePlain } = ang;
      void _ar;
      void _gr;
      const candidate: HypothesisInput = {
        version: 1,
        parentHypothesisId: null,
        avatar: avatarPlain,
        angle: anglePlain,
        landingMatch: lm,
        offer: off,
        expectedKPIs: kp ?? { ctr: null, cpc: null, atc: null, roas: null },
        actualResults: null,
        status: statuses[i] ?? 'draft',
        linkedAdTestLabId: null,
        createdFrom: 'wizard',
      };
      const parsed = HypothesisInputSchema.safeParse(candidate);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        toast.error(
          `Hypothesis ${i + 1} validation: ${issue?.path.join('.')} — ${issue?.message}`,
        );
        return;
      }
      inputs.push(parsed.data);
    }

    const anyReady = inputs.some((h) => h.status === 'ready_to_test');
    const productStatus: ProductStatus = anyReady ? 'brief_ready' : 'researching';

    setSaving(true);
    try {
      const productId = await createProduct({
        name: productName,
        sourceUrl: session.productBasics?.sourceUrl ?? null,
        imageUrl: session.productBasics?.imageUrl ?? null,
        niche: session.context?.niche ?? null,
        sellingPrice: session.context?.sellingPrice ?? null,
        supplierCost: session.context?.supplierCost ?? null,
        status: productStatus,
        source: 'wizard',
      });
      for (const h of inputs) {
        await createHypothesis(user.uid, productId, h);
      }
      if (session.viability) {
        await upsertViability(user.uid, productId, {
          answers: session.viability.answers,
          summary: session.viability.summary,
          generatedAt: new Date(),
        });
      }
      await updateWizardSession(sessionId, { productId, status: 'completed' });
      toast.success(
        `Product saved with ${inputs.length} hypothes${inputs.length > 1 ? 'es' : 'is'}.`,
      );
      router.replace('/');
    } catch (e) {
      console.error('[wizard/card9] save & finish failed', e);
      toast.error('Could not save. Try again.');
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="space-y-1">
        <h2 className="text-heading text-text">Review</h2>
        <p className="text-caption text-text-muted">
          {avatars.length} hypothes{avatars.length > 1 ? 'es' : 'is'} ready for save.
        </p>
      </header>

      <div className="space-y-3">
        {avatars.map((a, i) => {
          const angle = angles[String(i)];
          if (!angle) return null;
          return (
            <HypothesisReviewItem
              key={i}
              index={i}
              avatar={a}
              angle={angle}
              landingMatch={landingMatches[String(i)]}
              offer={offers[String(i)]}
              expectedKPIs={expectedKPIs[String(i)]}
              status={statuses[i] === 'ready_to_test' ? 'ready_to_test' : 'draft'}
              onStatusChange={(s) => setStatus(i, s)}
              trinityValid={trinityChecks[i] ?? false}
            />
          );
        })}
      </div>

      <footer className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={handleBack} disabled={saving}>
          Back
        </Button>
        <Button onClick={handleSaveAndFinish} disabled={saving}>
          {saving ? 'Saving…' : 'Save & finish'}
        </Button>
      </footer>
    </div>
  );
}
