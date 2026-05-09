'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWizardSessionMutations } from '@/hooks/useWizardSessionMutations';
import type { WizardSession } from '@/types/wizardSession';

const Card1Schema = z.object({
  name: z.string().min(2, 'At least 2 characters'),
  sourceUrl: z
    .string()
    .url('Enter a valid URL')
    .or(z.literal(''))
    .optional(),
  imageUrl: z
    .string()
    .url('Enter a valid URL')
    .or(z.literal(''))
    .optional(),
});
type Card1Values = z.infer<typeof Card1Schema>;

interface Card1Props {
  session: WizardSession;
  sessionId: string;
}

export function Card1ProductBasics({ session, sessionId }: Card1Props) {
  const { updateWizardSession } = useWizardSessionMutations();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Card1Values>({
    resolver: zodResolver(Card1Schema),
    defaultValues: {
      name: session.productBasics?.name ?? '',
      sourceUrl: session.productBasics?.sourceUrl ?? '',
      imageUrl: session.productBasics?.imageUrl ?? '',
    },
  });

  const onSubmit = async (values: Card1Values) => {
    try {
      await updateWizardSession(sessionId, {
        productBasics: {
          name: values.name,
          sourceUrl: values.sourceUrl ? values.sourceUrl : null,
          imageUrl: values.imageUrl ? values.imageUrl : null,
        },
        currentStep: 2,
      });
    } catch (e) {
      console.error('[wizard/card1] save failed', e);
      toast.error('Could not save. Try again.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto flex w-full max-w-2xl flex-col gap-6"
      noValidate
    >
      <header className="space-y-1">
        <h2 className="text-heading text-text">Product basics</h2>
        <p className="text-caption text-text-muted">
          What are you considering testing?
        </p>
      </header>

      <div className="space-y-1.5">
        <Label htmlFor="name">Product name *</Label>
        <Input
          id="name"
          autoFocus
          autoComplete="off"
          aria-invalid={Boolean(errors.name)}
          {...register('name')}
        />
        {errors.name && (
          <p className="text-caption text-danger-text">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sourceUrl">Source URL</Label>
        <Input
          id="sourceUrl"
          type="url"
          placeholder="TikTok / spy tool / AliExpress link"
          aria-invalid={Boolean(errors.sourceUrl)}
          {...register('sourceUrl')}
        />
        {errors.sourceUrl && (
          <p className="text-caption text-danger-text">
            {errors.sourceUrl.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          type="url"
          aria-invalid={Boolean(errors.imageUrl)}
          {...register('imageUrl')}
        />
        {errors.imageUrl && (
          <p className="text-caption text-danger-text">
            {errors.imageUrl.message}
          </p>
        )}
      </div>

      <footer className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Next'}
        </Button>
      </footer>
    </form>
  );
}
