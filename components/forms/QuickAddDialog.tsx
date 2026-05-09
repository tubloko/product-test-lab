'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProductMutations } from '@/hooks/useProductMutations';
import { ProductInputSchema } from '@/types/product';

interface QuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuickAddSchema = ProductInputSchema.pick({ name: true });
type QuickAddValues = z.infer<typeof QuickAddSchema>;

export function QuickAddDialog({ open, onOpenChange }: QuickAddDialogProps) {
  const { createProduct } = useProductMutations();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuickAddValues>({
    resolver: zodResolver(QuickAddSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (!open) reset({ name: '' });
  }, [open, reset]);

  const onSubmit = async (values: QuickAddValues) => {
    try {
      await createProduct({
        name: values.name,
        source: 'manual',
        status: 'idea',
      });
      reset({ name: '' });
      onOpenChange(false);
    } catch (e) {
      console.error('[quick-add] create failed', e);
      toast.error('Could not create product');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add product</DialogTitle>
          <DialogDescription>
            Enter a name to capture the idea. You can add details later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="name">Product name</Label>
            <Input
              id="name"
              autoFocus
              autoComplete="off"
              placeholder="e.g. Linen Tote"
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-caption text-danger-text">{errors.name.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
