'use client';

import { useCallback } from 'react';
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/lib/firebase/products';
import { useUser } from './useUser';
import type { ProductInput } from '@/types/product';

interface ProductMutations {
  createProduct: (input: ProductInput) => Promise<string>;
  updateProduct: (productId: string, input: Partial<ProductInput>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
}

export function useProductMutations(): ProductMutations {
  const { data: user } = useUser();

  const create = useCallback(
    async (input: ProductInput) => {
      if (!user) throw new Error('Not authenticated');
      return createProduct(user.uid, input);
    },
    [user],
  );

  const update = useCallback(
    async (productId: string, input: Partial<ProductInput>) => {
      if (!user) throw new Error('Not authenticated');
      await updateProduct(user.uid, productId, input);
    },
    [user],
  );

  const remove = useCallback(
    async (productId: string) => {
      if (!user) throw new Error('Not authenticated');
      await deleteProduct(user.uid, productId);
    },
    [user],
  );

  return {
    createProduct: create,
    updateProduct: update,
    deleteProduct: remove,
  };
}
