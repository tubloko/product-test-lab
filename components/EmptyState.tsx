'use client';

import { Lightbulb, Target, LineChart, Plus } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onAddProduct: () => void;
}

const STEPS = [
  {
    icon: Lightbulb,
    title: 'Add product ideas',
    body: 'Save products you want to test.',
  },
  {
    icon: Target,
    title: 'Build hypotheses',
    body: 'Define WHO buys, WHY, and HOW.',
  },
  {
    icon: LineChart,
    title: 'Test and learn',
    body: 'Track results, save what works.',
  },
] as const;

export function EmptyState({ onAddProduct }: EmptyStateProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 py-12 text-center">
      <div className="space-y-2">
        <h2 className="text-display text-text">Welcome to ProductTestLab</h2>
        <p className="text-body text-text-muted">
          A strategy workspace for dropshippers — capture ideas, build hypotheses, test what works.
        </p>
      </div>

      <div className="grid w-full gap-4 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, body }) => (
          <Card key={title} size="sm" className="text-left">
            <CardHeader>
              <div className="flex size-9 items-center justify-center rounded-full bg-elevated text-primary">
                <Icon className="size-5" />
              </div>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-body text-text-muted">{body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button size="lg" onClick={onAddProduct}>
        <Plus className="size-4" />
        Add my first product
      </Button>
    </div>
  );
}
