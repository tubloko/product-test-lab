import { z } from 'zod';
import {
  AngleSchema,
  AvatarSchema,
  KPIsSchema,
  LandingMatchSchema,
  OfferSchema,
} from './hypothesis';
import { ViabilityAnswersSchema, ViabilitySummarySchema } from './viability';

export const WIZARD_SESSION_STATUSES = [
  'in_progress',
  'completed',
  'abandoned',
] as const;
export const WizardSessionStatusSchema = z.enum(WIZARD_SESSION_STATUSES);
export type WizardSessionStatus = z.infer<typeof WizardSessionStatusSchema>;

export const AvatarSuggestionSchema = AvatarSchema.extend({
  reasoning: z.string(),
});
export type AvatarSuggestion = z.infer<typeof AvatarSuggestionSchema>;

export const AngleSuggestionSchema = AngleSchema.extend({
  reasoning: z.string(),
});
export type AngleSuggestion = z.infer<typeof AngleSuggestionSchema>;

export const WizardProductBasicsSchema = z.object({
  name: z.string(),
  sourceUrl: z.string().nullable(),
  imageUrl: z.string().nullable(),
});
export type WizardProductBasics = z.infer<typeof WizardProductBasicsSchema>;

export const WizardContextSchema = z.object({
  niche: z.string().nullable(),
  sellingPrice: z.number().nullable(),
  supplierCost: z.number().nullable(),
});
export type WizardContext = z.infer<typeof WizardContextSchema>;

export const WizardViabilitySliceSchema = z.object({
  answers: ViabilityAnswersSchema,
  summary: ViabilitySummarySchema,
});
export type WizardViabilitySlice = z.infer<typeof WizardViabilitySliceSchema>;

export const WizardSessionInputSchema = z.object({
  productId: z.string(),
  currentStep: z.number().int().min(1).max(9),
  status: WizardSessionStatusSchema,
  productBasics: WizardProductBasicsSchema.nullable(),
  context: WizardContextSchema.nullable(),
  viability: WizardViabilitySliceSchema.nullable(),
  selectedAvatars: z.array(AvatarSuggestionSchema).nullable(),
  selectedAngles: z.record(z.string(), AngleSuggestionSchema).nullable(),
  landingMatches: z.record(z.string(), LandingMatchSchema).nullable(),
  offers: z.record(z.string(), OfferSchema).nullable(),
  expectedKPIs: z.record(z.string(), KPIsSchema).nullable(),
});
export type WizardSessionInput = z.infer<typeof WizardSessionInputSchema>;

export const WizardSessionSchema = WizardSessionInputSchema.extend({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().nullable(),
});
export type WizardSession = z.infer<typeof WizardSessionSchema>;
