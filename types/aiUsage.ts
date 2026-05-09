import { z } from 'zod';

export const AI_ENDPOINTS = [
  'suggest-avatars',
  'suggest-angles',
  'suggest-landing',
  'suggest-baselines',
  'viability-summary',
  'v2-suggestions',
] as const;
export const AiEndpointSchema = z.enum(AI_ENDPOINTS);
export type AiEndpoint = z.infer<typeof AiEndpointSchema>;

export const AI_USAGE_STATUSES = ['success', 'error'] as const;
export const AiUsageStatusSchema = z.enum(AI_USAGE_STATUSES);
export type AiUsageStatus = z.infer<typeof AiUsageStatusSchema>;

export const AiUsageSchema = z.object({
  id: z.string(),
  endpoint: AiEndpointSchema,
  productId: z.string().nullable(),
  hypothesisId: z.string().nullable(),
  status: AiUsageStatusSchema,
  errorType: z.string().nullable(),
  durationMs: z.number().int().nonnegative(),
  timestamp: z.date(),
});
export type AiUsage = z.infer<typeof AiUsageSchema>;
