'use client';

import Image from 'next/image';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { StatusMenu } from './StatusMenu';
import { useProductMutations } from '@/hooks/useProductMutations';
import type { Product, ProductStatus } from '@/types/product';

interface ProductCardProps {
  product: Product;
}

function ImageThumb({ product }: { product: Product }) {
  const initial = product.name.trim().charAt(0).toUpperCase() || '?';
  if (product.imageUrl) {
    return (
      <Image
        src={product.imageUrl}
        alt=""
        width={80}
        height={80}
        unoptimized
        className="size-20 shrink-0 rounded-md object-cover"
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className="flex size-20 shrink-0 items-center justify-center rounded-md bg-elevated text-heading text-text-muted"
    >
      {initial}
    </div>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const { updateProduct } = useProductMutations();

  const handleStatusChange = async (next: ProductStatus) => {
    if (next === product.status) return;
    try {
      await updateProduct(product.id, { status: next });
    } catch (e) {
      console.error('[product-card] status update failed', e);
      toast.error('Could not update status');
    }
  };

  return (
    <Card size="sm" className="gap-3">
      <div className="flex items-start gap-3">
        <ImageThumb product={product} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-body font-medium text-text">{product.name}</p>
          {product.niche && (
            <p className="truncate text-caption text-text-muted">{product.niche}</p>
          )}
          <div className="mt-1">
            <StatusMenu status={product.status} onChange={handleStatusChange} />
          </div>
        </div>
      </div>
    </Card>
  );
}
