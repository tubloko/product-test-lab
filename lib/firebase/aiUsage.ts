import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from './admin';
import type { AiEndpoint } from '@/types/aiUsage';

export interface AiUsageInput {
  endpoint: AiEndpoint;
  productId: string | null;
  hypothesisId: string | null;
  status: 'success' | 'error';
  errorType: string | null;
  durationMs: number;
  inputTokens?: number;
  outputTokens?: number;
}

export async function logAiUsage(uid: string, input: AiUsageInput): Promise<void> {
  await adminDb.collection(`users/${uid}/aiUsage`).add({
    ...input,
    timestamp: FieldValue.serverTimestamp(),
  });
}
