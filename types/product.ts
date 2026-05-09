import { z } from 'zod';

export const PRODUCT_STATUSES = [
  'idea',
  'researching',
  'brief_ready',
  'testing',
  'tested',
  'killed',
  'scaling',
] as const;
export const ProductStatusSchema = z.enum(PRODUCT_STATUSES);
export type ProductStatus = z.infer<typeof ProductStatusSchema>;

export const PRODUCT_SOURCES = ['manual', 'wizard', 'extension', 'api'] as const;
export const ProductSourceSchema = z.enum(PRODUCT_SOURCES);
export type ProductSource = z.infer<typeof ProductSourceSchema>;

export const ProductInputSchema = z.object({
  name: z.string().min(2).max(200),
  sourceUrl: z.string().url().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  niche: z.string().max(120).nullable().optional(),
  sellingPrice: z.number().nonnegative().nullable().optional(),
  supplierCost: z.number().nonnegative().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  status: ProductStatusSchema.default('idea'),
  source: ProductSourceSchema.default('manual'),
  killedReason: z.string().max(500).nullable().optional(),
});
export type ProductInput = z.infer<typeof ProductInputSchema>;

export const ProductSchema = ProductInputSchema.extend({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Product = z.infer<typeof ProductSchema>;
