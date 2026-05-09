'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { AvatarSuggestion } from '@/types/wizardSession';

interface AvatarSuggestionCardProps {
  avatar: AvatarSuggestion;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function AvatarSuggestionCard({
  avatar,
  selected,
  onToggle,
  disabled,
}: AvatarSuggestionCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!selected && disabled}
      aria-pressed={selected}
      className={cn(
        'block w-full text-left transition-all',
        !selected && disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <Card
        size="sm"
        className={cn(
          'gap-3 transition-colors',
          selected ? 'border-primary bg-elevated' : 'hover:bg-elevated/50',
        )}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-body">{avatar.name}</CardTitle>
            <span
              className={cn(
                'flex size-4 shrink-0 items-center justify-center rounded-sm border',
                selected ? 'border-primary bg-primary' : 'border-border',
              )}
              aria-hidden="true"
            >
              {selected && (
                <svg
                  viewBox="0 0 16 16"
                  className="size-3 text-primary-foreground"
                  fill="currentColor"
                >
                  <path d="M6.4 11.2 3.2 8l1.13-1.13L6.4 8.94l5.27-5.27L12.8 4.8z" />
                </svg>
              )}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-caption text-text-muted">{avatar.demographics}</p>
          <p className="text-body text-text">{avatar.painPoint}</p>
          <p className="text-caption text-text-muted">
            <span className="font-medium text-text-muted">Where/when:</span> {avatar.context}
          </p>
          <p className="text-caption italic text-text-subtle">{avatar.reasoning}</p>
        </CardContent>
      </Card>
    </button>
  );
}
