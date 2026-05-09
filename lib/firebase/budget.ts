import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from './admin';

export const MONTHLY_BUDGET_USD = 100;

export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

function budgetRef(monthKey: string) {
  return adminDb.doc(`system/budget/months/${monthKey}`);
}

export async function isBudgetExceeded(): Promise<boolean> {
  const ref = budgetRef(currentMonthKey());
  const snap = await ref.get();
  if (!snap.exists) return false;
  const data = snap.data() as { spentUsd?: number } | undefined;
  return (data?.spentUsd ?? 0) >= MONTHLY_BUDGET_USD;
}

export async function addToMonthlySpend(costUsd: number): Promise<void> {
  if (costUsd <= 0) return;
  const ref = budgetRef(currentMonthKey());
  await ref.set({ spentUsd: FieldValue.increment(costUsd) }, { merge: true });
}
