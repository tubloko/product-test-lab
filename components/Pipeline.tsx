'use client';

import { useState } from 'react';
import { ProductCard } from './ProductCard';
import { PRODUCT_STATUS_LABELS } from './StatusMenu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Product, ProductStatus } from '@/types/product';

interface PipelineProps {
  products: Product[];
  showKilled: boolean;
  showScaling: boolean;
}

const DEFAULT_COLUMNS: ProductStatus[] = [
  'idea',
  'researching',
  'brief_ready',
  'testing',
  'tested',
];

function buildColumns(showKilled: boolean, showScaling: boolean): ProductStatus[] {
  const cols: ProductStatus[] = [...DEFAULT_COLUMNS];
  if (showScaling) cols.push('scaling');
  if (showKilled) cols.push('killed');
  return cols;
}

function groupByStatus(products: Product[]): Record<ProductStatus, Product[]> {
  const out = {
    idea: [],
    researching: [],
    brief_ready: [],
    testing: [],
    tested: [],
    killed: [],
    scaling: [],
  } as Record<ProductStatus, Product[]>;
  for (const p of products) out[p.status].push(p);
  return out;
}

function ColumnHeader({ status, count }: { status: ProductStatus; count: number }) {
  return (
    <div className="flex items-center justify-between px-1">
      <span className="text-caption font-medium uppercase tracking-wide text-text-muted">
        {PRODUCT_STATUS_LABELS[status]}
      </span>
      <span className="text-caption text-text-subtle">{count}</span>
    </div>
  );
}

function Column({ status, products }: { status: ProductStatus; products: Product[] }) {
  return (
    <div className="flex w-full shrink-0 flex-col gap-3 md:w-[280px]">
      <ColumnHeader status={status} count={products.length} />
      {products.length === 0 ? (
        <div className="rounded-md border border-dashed border-border-subtle p-3 text-center text-caption text-text-subtle">
          Empty
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Pipeline({ products, showKilled, showScaling }: PipelineProps) {
  const columns = buildColumns(showKilled, showScaling);
  const grouped = groupByStatus(products);
  const [activeStatus, setActiveStatus] = useState<ProductStatus>('idea');

  const mobileStatus = columns.includes(activeStatus) ? activeStatus : columns[0]!;

  return (
    <>
      <div className="hidden gap-4 overflow-x-auto pb-2 md:flex">
        {columns.map((status) => (
          <Column key={status} status={status} products={grouped[status]} />
        ))}
      </div>

      <div className="flex flex-col gap-4 md:hidden">
        <div className="flex flex-wrap gap-2">
          {columns.map((status) => {
            const isActive = status === mobileStatus;
            return (
              <Button
                key={status}
                size="sm"
                variant={isActive ? 'secondary' : 'outline'}
                onClick={() => setActiveStatus(status)}
                className={cn('gap-1.5', isActive && 'border-primary')}
              >
                {PRODUCT_STATUS_LABELS[status]}
                <span className="text-caption text-text-subtle">{grouped[status].length}</span>
              </Button>
            );
          })}
        </div>
        <Column status={mobileStatus} products={grouped[mobileStatus]} />
      </div>
    </>
  );
}
