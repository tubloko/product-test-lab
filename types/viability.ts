import { z } from 'zod';

export const VIABILITY_SATURATION = [
  'lt_1_month',
  '1_3_months',
  '3_6_months',
  '6_plus_months',
  'unsure',
] as const;
export const VIABILITY_COMPETITION = ['0_5', '5_20', '20_plus', 'unsure'] as const;
export const VIABILITY_BRAND_RISK = [
  'generic',
  'single_brand',
  'multi_brand',
  'unsure',
] as const;
export const VIABILITY_SOURCING = ['fast', 'slow', 'none', 'unsure'] as const;
export const VIABILITY_CREATIVE_AVAILABILITY = [
  'plenty',
  'some',
  'little',
  'none',
] as const;
export const VIABILITY_WOW_MOMENT = ['strong', 'sort_of', 'none'] as const;
export const VIABILITY_AFFORDABLE_CPA = ['yes', 'no', 'unsure'] as const;

export const VIABILITY_OVERALL = ['viable', 'risky', 'pass'] as const;
export const VIABILITY_FLAG_SEVERITY = ['low', 'medium', 'high'] as const;

export const ViabilityAnswersSchema = z.object({
  saturation: z.enum(VIABILITY_SATURATION),
  competition: z.enum(VIABILITY_COMPETITION),
  brandRisk: z.enum(VIABILITY_BRAND_RISK),
  sourcing: z.enum(VIABILITY_SOURCING),
  creativeAvailability: z.enum(VIABILITY_CREATIVE_AVAILABILITY),
  wowMoment: z.enum(VIABILITY_WOW_MOMENT),
  affordableCPA: z.enum(VIABILITY_AFFORDABLE_CPA),
  notes: z.string().max(2000).nullable(),
});
export type ViabilityAnswers = z.infer<typeof ViabilityAnswersSchema>;

export const ViabilityFlagSchema = z.object({
  category: z.string(),
  severity: z.enum(VIABILITY_FLAG_SEVERITY),
  message: z.string(),
});
export type ViabilityFlag = z.infer<typeof ViabilityFlagSchema>;

export const ViabilitySummarySchema = z
  .object({
    overall: z.enum(VIABILITY_OVERALL),
    flags: z.array(ViabilityFlagSchema),
    recommendation: z.string(),
  })
  .nullable();
export type ViabilitySummary = z.infer<typeof ViabilitySummarySchema>;

export const ViabilityInputSchema = z.object({
  answers: ViabilityAnswersSchema,
  summary: ViabilitySummarySchema,
  generatedAt: z.date().nullable(),
});
export type ViabilityInput = z.infer<typeof ViabilityInputSchema>;

export const ViabilitySchema = ViabilityInputSchema.extend({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Viability = z.infer<typeof ViabilitySchema>;
