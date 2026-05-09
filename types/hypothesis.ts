import { z } from 'zod';

export const ANGLE_TYPES = [
  'pain',
  'money_saving',
  'convenience',
  'comparison',
  'lifestyle',
  'gift',
  'other',
] as const;
export const AngleTypeSchema = z.enum(ANGLE_TYPES);
export type AngleType = z.infer<typeof AngleTypeSchema>;

export const HYPOTHESIS_STATUSES = [
  'draft',
  'ready_to_test',
  'testing',
  'tested',
] as const;
export const HypothesisStatusSchema = z.enum(HYPOTHESIS_STATUSES);
export type HypothesisStatus = z.infer<typeof HypothesisStatusSchema>;

export const HYPOTHESIS_VERDICTS = ['kill', 'fix', 'continue', 'scale'] as const;
export const HypothesisVerdictSchema = z.enum(HYPOTHESIS_VERDICTS);
export type HypothesisVerdict = z.infer<typeof HypothesisVerdictSchema>;

export const HYPOTHESIS_CREATED_FROM = [
  'wizard',
  'manual',
  'v2_from_learnings',
] as const;
export const HypothesisCreatedFromSchema = z.enum(HYPOTHESIS_CREATED_FROM);
export type HypothesisCreatedFrom = z.infer<typeof HypothesisCreatedFromSchema>;

export const AvatarSchema = z.object({
  name: z.string().max(120),
  demographics: z.string().max(500),
  painPoint: z.string().max(800),
  context: z.string().max(800),
});
export type Avatar = z.infer<typeof AvatarSchema>;

export const AngleSchema = z.object({
  type: AngleTypeSchema,
  hook: z.string().max(500),
  valueProposition: z.string().max(1000),
});
export type Angle = z.infer<typeof AngleSchema>;

export const LandingMatchSchema = z.object({
  heroMessage: z.string().max(300),
  primaryBenefit: z.string().max(500),
  proofElement: z.string().max(300),
  cta: z.string().max(120),
});
export type LandingMatch = z.infer<typeof LandingMatchSchema>;

export const OfferSchema = z.object({
  price: z.number().nonnegative(),
  structure: z.string().max(500),
  urgency: z.string().max(500).nullable(),
});
export type Offer = z.infer<typeof OfferSchema>;

export const KPIsSchema = z.object({
  ctr: z.number().nullable(),
  cpc: z.number().nullable(),
  atc: z.number().nullable(),
  roas: z.number().nullable(),
});
export type KPIs = z.infer<typeof KPIsSchema>;

export const ActualResultsSchema = z
  .object({
    ctr: z.number().nullable(),
    cpc: z.number().nullable(),
    atc: z.number().nullable(),
    roas: z.number().nullable(),
    verdict: HypothesisVerdictSchema.nullable(),
    learnings: z.string().max(20_000),
    testEndedAt: z.date().nullable(),
  })
  .nullable();
export type ActualResults = z.infer<typeof ActualResultsSchema>;

const HypothesisBaseShape = {
  version: z.number().int().positive(),
  parentHypothesisId: z.string().nullable(),
  avatar: AvatarSchema,
  angle: AngleSchema,
  landingMatch: LandingMatchSchema,
  offer: OfferSchema,
  expectedKPIs: KPIsSchema,
  actualResults: ActualResultsSchema,
  status: HypothesisStatusSchema.default('draft'),
  linkedAdTestLabId: z.string().nullable(),
  createdFrom: HypothesisCreatedFromSchema,
};

export const HypothesisInputBaseSchema = z.object(HypothesisBaseShape);

export const HypothesisInputSchema = HypothesisInputBaseSchema
  .superRefine((data, ctx) => {
    const trinityRequired =
      data.status === 'ready_to_test' ||
      data.status === 'testing' ||
      data.status === 'tested';
    if (!trinityRequired) return;
    const checks: { path: (string | number)[]; field: string }[] = [
      { path: ['avatar', 'painPoint'], field: data.avatar.painPoint },
      { path: ['angle', 'hook'], field: data.angle.hook },
      { path: ['landingMatch', 'heroMessage'], field: data.landingMatch.heroMessage },
    ];
    for (const c of checks) {
      if (!c.field?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: c.path,
          message: `Required for status='${data.status}' (Trinity)`,
        });
      }
    }
  });
export type HypothesisInput = z.infer<typeof HypothesisInputSchema>;

export const HypothesisSchema = z.object({
  id: z.string(),
  ...HypothesisBaseShape,
  status: HypothesisStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Hypothesis = z.infer<typeof HypothesisSchema>;
