'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AngleSuggestion } from '@/types/wizardSession';

interface AngleSuggestionCardProps {
  angle: AngleSuggestion;
  selected: boolean;
  onSelect: () => void;
}

const TYPE_LABEL: Record<AngleSuggestion['type'], string> = {
  pain: 'Pain',
  money_saving: 'Money-saving',
  convenience: 'Convenience',
  comparison: 'Comparison',
  lifestyle: 'Lifestyle',
  gift: 'Gift',
  other: 'Other',
};

export function AngleSuggestionCard({ angle, selected, onSelect }: AngleSuggestionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="block w-full text-left"
    >
      <Card
        size="sm"
        className={cn(
          'gap-3 transition-colors',
          selected ? 'border-primary bg-elevated' : 'hover:bg-elevated/50',
        )}
      >
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary">{TYPE_LABEL[angle.type]}</Badge>
            <span
              className={cn(
                'size-4 rounded-full border',
                selected ? 'border-primary bg-primary' : 'border-border',
              )}
              aria-hidden="true"
            />
          </div>
          <CardTitle className="pt-1 text-body">{angle.hook}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-caption text-text-muted">{angle.valueProposition}</p>
          <p className="text-caption italic text-text-subtle">{angle.reasoning}</p>
        </CardContent>
      </Card>
    </button>
  );
}
