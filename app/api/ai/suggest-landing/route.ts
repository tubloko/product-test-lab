import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import {
  CLAUDE_MODEL,
  MAX_TOKENS,
  estimateCostUsd,
  extractText,
  getAnthropic,
} from '@/lib/claude/client';
import { parseAndValidate } from '@/lib/claude/parse';
import { addToMonthlySpend, isBudgetExceeded } from '@/lib/firebase/budget';
import { logAiUsage } from '@/lib/firebase/aiUsage';
import { SUGGEST_LANDING_SYSTEM, buildSuggestLandingUser } from '@/lib/claude/prompts';
import {
  SuggestLandingInputSchema,
  SuggestLandingOutputSchema,
} from '@/lib/claude/schemas';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ENDPOINT = 'suggest-landing' as const;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let uid: string;
  try {
    uid = (await adminAuth.verifyIdToken(token)).uid;
  } catch (err) {
    console.error(`[ai/${ENDPOINT}] token verification failed`, err);
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const parsed = SuggestLandingInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    console.error(`[ai/${ENDPOINT}] invalid body`, { uid, issues: parsed.error.issues });
    return NextResponse.json(
      { error: 'bad_request', message: 'Invalid request body.' },
      { status: 400 },
    );
  }
  const input = parsed.data;

  try {
    if (await isBudgetExceeded()) {
      return NextResponse.json(
        { error: 'budget_exceeded', message: 'AI is paused for the month.' },
        { status: 503 },
      );
    }
  } catch (err) {
    console.error(`[ai/${ENDPOINT}] budget check failed`, { uid, err });
    return NextResponse.json(
      { error: 'internal', message: 'AI temporarily unavailable.' },
      { status: 500 },
    );
  }

  const startedAt = Date.now();
  try {
    const response = await getAnthropic().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system: SUGGEST_LANDING_SYSTEM,
      messages: [{ role: 'user', content: buildSuggestLandingUser(input) }],
    });
    const inputTokens = response.usage?.input_tokens ?? 0;
    const outputTokens = response.usage?.output_tokens ?? 0;
    const text = extractText(response);
    const output = parseAndValidate(text, SuggestLandingOutputSchema);
    const durationMs = Date.now() - startedAt;

    addToMonthlySpend(estimateCostUsd(inputTokens, outputTokens)).catch((e) =>
      console.error(`[ai/${ENDPOINT}] addToMonthlySpend failed`, { uid, e }),
    );
    logAiUsage(uid, {
      endpoint: ENDPOINT,
      productId: null,
      hypothesisId: null,
      status: 'success',
      errorType: null,
      durationMs,
      inputTokens,
      outputTokens,
    }).catch((e) => console.error(`[ai/${ENDPOINT}] logAiUsage failed`, { uid, e }));

    return NextResponse.json(output);
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    const name = err instanceof Error ? err.name : '';
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = name === 'APIConnectionTimeoutError' || /timeout|aborted/i.test(message);
    console.error(`[ai/${ENDPOINT}] generation failed`, { uid, name, message, isTimeout });

    logAiUsage(uid, {
      endpoint: ENDPOINT,
      productId: null,
      hypothesisId: null,
      status: 'error',
      errorType: name || 'unknown',
      durationMs,
    }).catch((e) => console.error(`[ai/${ENDPOINT}] logAiUsage(error) failed`, { uid, e }));

    if (isTimeout) {
      return NextResponse.json(
        { error: 'timeout', message: 'AI is thinking longer than usual. Try again.' },
        { status: 504 },
      );
    }
    return NextResponse.json(
      {
        error: 'upstream',
        message: 'AI service temporarily unavailable. Try again in a moment.',
        detail: name ? `${name}: ${message.slice(0, 500)}` : message.slice(0, 500),
      },
      { status: 502 },
    );
  }
}
