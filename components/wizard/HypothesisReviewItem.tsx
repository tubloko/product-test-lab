'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { AngleSuggestion, AvatarSuggestion } from '@/types/wizardSession';
import type { KPIs, LandingMatch, Offer } from '@/types/hypothesis';

interface HypothesisReviewItemProps {
  index: number;
  avatar: AvatarSuggestion;
  angle: AngleSuggestion;
  landingMatch: LandingMatch | undefined;
  offer: Offer | undefined;
  expectedKPIs: KPIs | undefined;
  status: 'draft' | 'ready_to_test';
  onStatusChange: (next: 'draft' | 'ready_to_test') => void;
  trinityValid: boolean;
}

export function HypothesisReviewItem({
  index,
  avatar,
  angle,
  landingMatch,
  offer,
  expectedKPIs,
  status,
  onStatusChange,
  trinityValid,
}: HypothesisReviewItemProps) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <CardHeader>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-start justify-between gap-3 text-left"
        >
          <div className="space-y-1">
            <p className="text-caption uppercase tracking-wide text-text-muted">
              Hypothesis {index + 1}
            </p>
            <p className="text-body font-medium text-text">
              {avatar.name} · {angle.hook.slice(0, 80)}
              {angle.hook.length > 80 ? '…' : ''}
            </p>
          </div>
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
      </CardHeader>
      {open && (
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <p className="text-caption text-text-muted">Pain</p>
            <p className="text-body text-text">{avatar.painPoint}</p>
          </div>
          <div className="space-y-1">
            <p className="text-caption text-text-muted">Hook</p>
            <p className="text-body text-text">{angle.hook}</p>
          </div>
          <div className="space-y-1">
            <p className="text-caption text-text-muted">Hero</p>
            <p className="text-body text-text">{landingMatch?.heroMessage ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-caption text-text-muted">Offer</p>
            <p className="text-body text-text">
              ${offer?.price ?? '—'} · {offer?.structure || '—'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-caption text-text-muted">Expected KPIs</p>
            <p className="text-body text-text">
              CTR {expectedKPIs?.ctr ?? '—'} · CPC ${expectedKPIs?.cpc ?? '—'} · ATC{' '}
              {expectedKPIs?.atc ?? '—'} · ROAS {expectedKPIs?.roas ?? '—'}
            </p>
          </div>
        </CardContent>
      )}
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={status === 'draft' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => onStatusChange('draft')}
          >
            Save as draft
          </Button>
          <Button
            variant={status === 'ready_to_test' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => onStatusChange('ready_to_test')}
            disabled={!trinityValid}
            title={
              !trinityValid
                ? 'Trinity incomplete: needs avatar pain, hook, and hero'
                : undefined
            }
          >
            Mark ready to test
          </Button>
          {status === 'ready_to_test' && trinityValid && (
            <Badge variant="default">Trinity ✓</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
