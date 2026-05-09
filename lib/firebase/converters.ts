import { Timestamp } from 'firebase/firestore';
import { UserSchema, type User } from '@/types/user';
import { ProductSchema, type Product } from '@/types/product';
import { HypothesisSchema, type Hypothesis } from '@/types/hypothesis';
import { ViabilitySchema, type Viability } from '@/types/viability';
import { WizardSessionSchema, type WizardSession } from '@/types/wizardSession';
import { AiUsageSchema, type AiUsage } from '@/types/aiUsage';

export function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date(0);
}

export function toNullableDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  return toDate(value);
}

export function toUser(raw: { id: string } & Record<string, unknown>): User {
  return UserSchema.parse({
    id: raw.id,
    email: raw.email,
    displayName: raw.displayName,
    createdAt: toDate(raw.createdAt),
    lastActiveAt: toDate(raw.lastActiveAt),
    source: raw.source,
  });
}

export function toProduct(raw: { id: string } & Record<string, unknown>): Product {
  return ProductSchema.parse({
    ...raw,
    createdAt: toDate(raw.createdAt),
    updatedAt: toDate(raw.updatedAt),
  });
}

export function toHypothesis(
  raw: { id: string } & Record<string, unknown>,
): Hypothesis {
  const actualResults = raw.actualResults as Record<string, unknown> | null | undefined;
  return HypothesisSchema.parse({
    ...raw,
    actualResults: actualResults
      ? { ...actualResults, testEndedAt: toNullableDate(actualResults.testEndedAt) }
      : null,
    createdAt: toDate(raw.createdAt),
    updatedAt: toDate(raw.updatedAt),
  });
}

export function toViability(
  raw: { id: string } & Record<string, unknown>,
): Viability {
  return ViabilitySchema.parse({
    ...raw,
    generatedAt: toNullableDate(raw.generatedAt),
    createdAt: toDate(raw.createdAt),
    updatedAt: toDate(raw.updatedAt),
  });
}

export function toWizardSession(
  raw: { id: string } & Record<string, unknown>,
): WizardSession {
  return WizardSessionSchema.parse({
    ...raw,
    createdAt: toDate(raw.createdAt),
    updatedAt: toDate(raw.updatedAt),
    completedAt: toNullableDate(raw.completedAt),
  });
}

export function toAiUsage(raw: { id: string } & Record<string, unknown>): AiUsage {
  return AiUsageSchema.parse({
    ...raw,
    timestamp: toDate(raw.timestamp),
  });
}
