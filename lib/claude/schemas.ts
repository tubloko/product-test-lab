import { z } from 'zod';
import {
  AngleSchema,
  AvatarSchema,
  HypothesisStatusSchema,
  HypothesisVerdictSchema,
  KPIsSchema,
  LandingMatchSchema,
  OfferSchema,
} from '@/types/hypothesis';
import {
  VIABILITY_FLAG_SEVERITY,
  VIABILITY_OVERALL,
  ViabilityAnswersSchema,
} from '@/types/viability';

const AvatarSuggestionSchema = z.object({
  name: z.string(),
  demographics: z.string(),
  painPoint: z.string(),
  context: z.string(),
  reasoning: z.string(),
});
export type AvatarSuggestion = z.infer<typeof AvatarSuggestionSchema>;

const AngleSuggestionSchema = z.object({
  type: z.enum([
    'pain',
    'money_saving',
    'convenience',
    'comparison',
    'lifestyle',
    'gift',
    'other',
  ]),
  hook: z.string(),
  valueProposition: z.string(),
  reasoning: z.string(),
});
export type AngleSuggestion = z.infer<typeof AngleSuggestionSchema>;

export const SuggestAvatarsInputSchema = z.object({
  productName: z.string().min(2),
  niche: z.string().nullable(),
  sellingPrice: z.number().nullable(),
  viabilitySummary: z.string().nullable(),
});
export type SuggestAvatarsInput = z.infer<typeof SuggestAvatarsInputSchema>;

export const SuggestAvatarsOutputSchema = z.object({
  avatars: z.array(AvatarSuggestionSchema).length(5),
});
export type SuggestAvatarsOutput = z.infer<typeof SuggestAvatarsOutputSchema>;

export const SuggestAnglesInputSchema = z.object({
  productName: z.string().min(2),
  niche: z.string().nullable(),
  avatar: AvatarSuggestionSchema,
});
export type SuggestAnglesInput = z.infer<typeof SuggestAnglesInputSchema>;

export const SuggestAnglesOutputSchema = z.object({
  angles: z.array(AngleSuggestionSchema).length(5),
});
export type SuggestAnglesOutput = z.infer<typeof SuggestAnglesOutputSchema>;

export const SuggestLandingInputSchema = z.object({
  productName: z.string().min(2),
  avatar: AvatarSuggestionSchema,
  angle: AngleSuggestionSchema,
  offerPrice: z.number().nullable(),
});
export type SuggestLandingInput = z.infer<typeof SuggestLandingInputSchema>;

export const SuggestLandingOutputSchema = z.object({
  heroMessage: z.string(),
  primaryBenefit: z.string(),
  proofElement: z.string(),
  cta: z.string(),
});
export type SuggestLandingOutput = z.infer<typeof SuggestLandingOutputSchema>;

export const SuggestBaselinesInputSchema = z.object({
  niche: z.string().nullable(),
  avatar: AvatarSuggestionSchema,
  angle: AngleSuggestionSchema,
  sellingPrice: z.number().nullable(),
});
export type SuggestBaselinesInput = z.infer<typeof SuggestBaselinesInputSchema>;

const RangeSchema = z.object({
  min: z.number(),
  max: z.number(),
  note: z.string(),
});

export const SuggestBaselinesOutputSchema = z.object({
  ctr: RangeSchema,
  cpc: RangeSchema,
  atc: RangeSchema,
  roas: RangeSchema,
});
export type SuggestBaselinesOutput = z.infer<typeof SuggestBaselinesOutputSchema>;

export const ViabilitySummaryInputSchema = z.object({
  productName: z.string().min(2),
  niche: z.string().nullable(),
  answers: ViabilityAnswersSchema,
});
export type ViabilitySummaryInput = z.infer<typeof ViabilitySummaryInputSchema>;

export const ViabilitySummaryOutputSchema = z.object({
  overall: z.enum(VIABILITY_OVERALL),
  flags: z.array(
    z.object({
      category: z.string(),
      severity: z.enum(VIABILITY_FLAG_SEVERITY),
      message: z.string(),
    }),
  ),
  recommendation: z.string(),
});
export type ViabilitySummaryOutput = z.infer<typeof ViabilitySummaryOutputSchema>;

const V2HypothesisInputSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  status: HypothesisStatusSchema,
  avatar: AvatarSchema,
  angle: AngleSchema,
  landingMatch: LandingMatchSchema,
  offer: OfferSchema,
  expectedKPIs: KPIsSchema,
  actualResults: z
    .object({
      ctr: z.number().nullable(),
      cpc: z.number().nullable(),
      atc: z.number().nullable(),
      roas: z.number().nullable(),
      verdict: HypothesisVerdictSchema.nullable(),
      learnings: z.string(),
    })
    .nullable(),
});

export const V2SuggestionsInputSchema = z.object({
  hypothesis: V2HypothesisInputSchema,
});
export type V2SuggestionsInput = z.infer<typeof V2SuggestionsInputSchema>;

export const V2SuggestionsOutputSchema = z.object({
  keep: z.array(z.string()),
  change: z.array(
    z.object({
      field: z.string(),
      currentValue: z.string(),
      proposedValue: z.string(),
      reasoning: z.string(),
    }),
  ),
  revisedExpectedKPIs: KPIsSchema.nullable(),
  recommendation: z.string(),
});
export type V2SuggestionsOutput = z.infer<typeof V2SuggestionsOutputSchema>;
