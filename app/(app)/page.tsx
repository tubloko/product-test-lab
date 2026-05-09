'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/hooks/useProducts';
import { useStartWizard } from '@/hooks/useStartWizard';
import { EmptyState } from '@/components/EmptyState';
import { Pipeline } from '@/components/Pipeline';
import { ResumeWizardBanner } from '@/components/ResumeWizardBanner';
import { QuickAddDialog } from '@/components/forms/QuickAddDialog';

export default function DashboardPage() {
  const [showKilled, setShowKilled] = useState(false);
  const [showScaling, setShowScaling] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const { data: products, loading, error } = useProducts();
  const { start, loading: starting } = useStartWizard();

  const hasProducts = products.length > 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-display text-text">Products</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={start} disabled={starting}>
            <Plus className="size-4" />
            {starting ? 'Starting…' : 'Guided setup'}
          </Button>
          <Button onClick={() => setQuickAddOpen(true)}>
            <Plus className="size-4" />
            Quick add
          </Button>
        </div>
      </header>

      <ResumeWizardBanner />

      {hasProducts && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={showScaling ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowScaling((v) => !v)}
          >
            Show scaling
          </Button>
          <Button
            variant={showKilled ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowKilled((v) => !v)}
          >
            Show killed
          </Button>
        </div>
      )}

      {error ? (
        <p className="rounded-md border border-danger-border bg-danger-bg/10 p-4 text-caption text-danger-text">
          Couldn&apos;t load products: {error.message}
        </p>
      ) : loading && !hasProducts ? (
        <p className="text-body text-text-muted">Loading…</p>
      ) : !hasProducts ? (
        <EmptyState onAddProduct={() => setQuickAddOpen(true)} />
      ) : (
        <Pipeline
          products={products}
          showKilled={showKilled}
          showScaling={showScaling}
        />
      )}

      <QuickAddDialog open={quickAddOpen} onOpenChange={setQuickAddOpen} />
    </div>
  );
}
