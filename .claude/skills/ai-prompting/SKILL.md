# AI prompting

## When to use

Activate this skill any time you build, modify, or call into an Anthropic-backed endpoint in ProductTestLab — request setup, prompt structure, JSON parsing, error mapping, auth, quotas, logging.

## Reference: AdTestLab patterns

### AI provider

- **`@anthropic-ai/sdk` ^0.92.0** (declared in `ad-test-lab/package.json`). Anthropic is the only AI provider in the project.
- Active model: **`claude-sonnet-4-5`** (string literal, see `lib/claude/client.ts`). Pricing constants for cost estimation are colocated.

### API call location

- **Next.js route handler**, Node runtime: `app/api/diagnose/route.ts`. There is one Anthropic-backed endpoint (`POST /api/diagnose`); the other API route (`/api/feedback`) doesn't call Claude.
- **Not** an Edge function. The handler explicitly opts into Node:
  ```ts
  export const runtime = 'nodejs';
  export const maxDuration = 60; // Vercel Pro ceiling for Hobby + headroom for slow Claude calls
  ```
- **No Cloud Functions** for AI. All AI work happens server-side inside Next.js.

### API key storage

- Env var: **`ANTHROPIC_API_KEY`** (no `NEXT_PUBLIC_` prefix → server-only).
- Loaded in `lib/claude/client.ts`. The module throws on import if the key is missing, so misconfigured deploys fail fast at boot rather than first request:
  ```ts
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }
  ```
- Client-side protection: every Claude wrapper file starts with `import 'server-only'`, which makes Next.js error if the bundle ever pulls them into a client chunk.

### Anthropic client setup

```ts
// lib/claude/client.ts
import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  // Stay below the route's maxDuration so the SDK aborts cleanly before
  // Vercel kills the function (which would 504 with no error body).
  timeout: 50_000,
});

export const CLAUDE_MODEL = 'claude-sonnet-4-5';
export const MAX_TOKENS = 1000;
export const INPUT_COST_PER_TOKEN = 3 / 1_000_000;
export const OUTPUT_COST_PER_TOKEN = 15 / 1_000_000;
export function estimateCostUsd(i: number, o: number) {
  return i * INPUT_COST_PER_TOKEN + o * OUTPUT_COST_PER_TOKEN;
}
```

### Request structure

- **`anthropic.messages.create`** (non-streaming).
- **System prompt**: passed as the top-level `system` string, not a message — long, declarative, contains the entire diagnostic framework. Lives as `SYSTEM_PROMPT` in `lib/claude/prompts.ts`.
- **Messages array**: a single `{ role: 'user', content: <string> }`. The user content is built by `buildDiagnosisPrompt(ctx)` which formats the campaign data into a stable text block (TOTALS / FUNNEL / KEY METRICS sections, etc.). No assistant messages, no multi-turn.
- **`max_tokens: 1000`** — sized for the bounded JSON output schema (4 short fields).
- **No `tools`, no `tool_choice`** — structured output is requested via the system prompt instruction (see "Structured output" below), not tool use.

```ts
// lib/claude/diagnose.ts (excerpt)
const response = await anthropic.messages.create({
  model: CLAUDE_MODEL,
  max_tokens: MAX_TOKENS,
  system: SYSTEM_PROMPT,
  messages: [{ role: 'user', content: userPrompt }],
});
```

### Response handling

- **Non-streaming.** The handler awaits the full response, then extracts the first `text` content block:
  ```ts
  function extractText(response: Anthropic.Message): string {
    const block = response.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') throw new Error('No text block in Claude response');
    return block.text;
  }
  ```
- **Token usage** is read from `response.usage.input_tokens` / `output_tokens`, used both for cost tracking (`estimateCostUsd`) and for an INFO log (`console.log('[diagnose] claude response time', { durationMs, inputTokens, outputTokens })`).

### Structured output

- **JSON via system-prompt instruction**, not tool use, not the `response_format` parameter (which Anthropic doesn't support the same way OpenAI does).
- The end of `SYSTEM_PROMPT` declares the schema and forbids preamble:
  ```
  OUTPUT FORMAT:
  Respond with ONLY valid JSON matching this schema. No markdown fences, no preamble, no explanation outside JSON:
  {
    "summary": string,
    "primaryIssue": string,
    "recommendedAction": string,
    "confidence": "low" | "medium" | "high"
  }
  ```
- Despite "no markdown fences", Claude still occasionally wraps output in ```json fences, so the parser strips them defensively (see below).

### JSON parsing

```ts
// lib/claude/parse.ts
export function stripFences(text: string): string {
  return text
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

export function parseAndValidate(text: string): DiagnosisOutput {
  const cleaned = stripFences(text);
  let json: unknown;
  try { json = JSON.parse(cleaned); }
  catch { throw new Error(`Claude returned invalid JSON: ${cleaned.slice(0, 200)}`); }
  const result = DiagnosisOutputSchema.safeParse(json);
  if (!result.success) throw new Error(`Claude output failed schema: ${result.error.message}`);
  return result.data;
}
```

```ts
// lib/claude/schema.ts
export const DiagnosisOutputSchema = z.object({
  summary: z.string().min(30).max(1500),
  primaryIssue: z.string().min(5).max(400),
  recommendedAction: z.string().min(10).max(1000),
  confidence: z.enum(['low', 'medium', 'high']),
});
```

- **Two-step validation**: strip fences → `JSON.parse` → `zod.safeParse`. Each step throws a distinct error message so logs distinguish "bad JSON" from "schema violation."
- **No retry** on parse failure. The route handler logs the raw model output (truncated to 1500 chars) and returns 502 to the client, which surfaces a "AI service temporarily unavailable. Try again in a moment." toast.
- **Bounds chosen for permissiveness**: lower bounds were tightened only enough to reject obviously empty responses — earlier tighter bounds caused 502s on otherwise-valid orientation-mode answers.

### Caching

`POST /api/diagnose` is cache-aware. Inputs that determine the answer are SHA-256 hashed via `stableStringify` (sorted keys, undefined-skipped) in `lib/utils/hash.ts`. Same hash → return the existing diagnosis doc; new hash → call Claude. The user can pass `force: true` in the body to bypass the cache. Cached diagnosis docs live at `users/{uid}/products/{pid}/campaigns/{cid}/diagnoses/{auto}` and are written by the Admin SDK (see `lib/firebase/diagnoses.ts`).

### Error handling

The route handler maps every failure mode to a typed JSON response. The mapping is meant to flow directly into a user-facing toast on the client (`hooks/useDiagnose.ts` switches on `res.status`).

| Trigger | Status | `error` kind | Notes |
|---|---|---|---|
| Missing/invalid bearer token | 401 | `unauthorized` | `adminAuth.verifyIdToken` failed |
| Body fails Zod | 400 | `bad_request` | issues logged |
| Monthly Anthropic budget cap hit | 503 | `budget_exceeded` | spend tracked in `system/budget/months/{YYYY-MM}` |
| Per-user daily quota (5 / day) | 429 | `daily_limit` | `users/{uid}.diagnosesUsedToday` via Firestore tx |
| Anthropic SDK timeout (50s) | 504 | `timeout` | refunds the daily-quota credit before returning |
| Other Anthropic error | 502 | `upstream` | `detail` includes truncated `name: message` for the founder reading Vercel logs |
| Cache write fails after generation | 500 | `internal` | diagnosis was generated but couldn't be saved |

```ts
// app/api/diagnose/route.ts (excerpt — error path)
const isTimeout = name === 'APIConnectionTimeoutError' || /timeout|aborted/i.test(message);
console.error('[diagnose] generation failed', { uid, productId, campaignId, name, message, isTimeout });
try { await decrementUsage(uid); } catch (e) { console.error('[diagnose] decrement after failure also failed', { uid, e }); }
if (isTimeout) {
  return NextResponse.json({ error: 'timeout', message: 'AI is thinking longer than usual. Try again — second attempt is often faster.' }, { status: 504 });
}
return NextResponse.json({ error: 'upstream', message: 'AI service temporarily unavailable. Try again in a moment.', detail: name ? `${name}: ${message.slice(0, 500)}` : message.slice(0, 500) }, { status: 502 });
```

### Auth on AI endpoints

Every AI-backed route handler does its own per-request token verification. There is **no shared middleware**.

```ts
const authHeader = req.headers.get('authorization') ?? '';
const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';
if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

let uid: string;
try {
  const decoded = await adminAuth.verifyIdToken(token);
  uid = decoded.uid;
} catch (err) {
  console.error('[diagnose] token verification failed', err);
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}
```

Client side (in `hooks/useDiagnose.ts`):

```ts
const token = await user.getIdToken();
const res = await fetch('/api/diagnose', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(payload),
});
```

### Logging

- **No external logging service** (no Sentry, no LogRocket, no Datadog). Everything goes to `console.log` / `console.error` and is read in Vercel's function logs.
- **Convention**: prefix every log line with a bracketed scope tag and pass structured context as a second argument:
  ```ts
  console.error('[diagnose] generation failed', { uid, productId, campaignId, name, message, isTimeout });
  console.log('[diagnose] claude response time', { durationMs, inputTokens, outputTokens });
  ```
- **No per-call AI log written to Firestore.** Only **two** AI-related Firestore writes happen per call:
  - the **cached diagnosis** (under `users/{uid}/products/{pid}/campaigns/{cid}/diagnoses`),
  - the **monthly cost increment** in `system/budget/months/{YYYY-MM}.spentUsd`.
  Both are useful for billing/cache, not for audit logging. Adding a separate "AI calls" collection would require a decision (see Open Questions).

### Cost & quota guards (briefly)

- `lib/claude/client.ts` defines `estimateCostUsd(input, output)` from per-token constants.
- `lib/firebase/budget.ts` increments `system/budget/months/{YYYY-MM}.spentUsd` by `costUsd` after every successful call. `isBudgetExceeded()` short-circuits new calls when the monthly cap (`$18` USD, set ~10% below the Anthropic console limit) is hit.
- `lib/firebase/usage.ts` runs a Firestore transaction to enforce a per-user daily limit (`DAILY_DIAGNOSIS_LIMIT = 5`). The route handler increments before generation and decrements (refunds) on upstream failure.

### Complete endpoint example

The reference implementation is `app/api/diagnose/route.ts`. Request lifecycle in order:

1. Verify Firebase ID token (`adminAuth.verifyIdToken`) → `uid`.
2. Parse + Zod-validate body.
3. SHA-256 hash inputs → cache lookup (`getCachedDiagnosis`); return early if hit and `!force`.
4. Check global monthly budget (`isBudgetExceeded`).
5. Increment per-user daily quota (`checkAndIncrementUsage`); 429 if exceeded.
6. Build prompt → `anthropic.messages.create` → extract text → `parseAndValidate`.
7. On failure: refund quota, classify as timeout vs upstream, return 504/502 with friendly message + truncated `detail`.
8. On success: increment monthly spend, write cached diagnosis (Admin SDK), return `{ diagnosis, cached: false }`.

```ts
// app/api/diagnose/route.ts (skeleton)
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // 1. Auth
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  let uid: string;
  try { uid = (await adminAuth.verifyIdToken(token)).uid; }
  catch (err) {
    console.error('[diagnose] token verification failed', err);
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // 2. Validate body
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    console.error('[diagnose] invalid body', { uid, issues: parsed.error.issues });
    return NextResponse.json({ error: 'bad_request', message: 'Invalid request body.' }, { status: 400 });
  }
  const body = parsed.data;

  // 3. Cache
  const inputHash = hashInput({ input: body.input, dateRange: body.dateRange, adsetBreakdown: body.adsetBreakdown ?? null });
  if (!body.force) {
    const cached = await getCachedDiagnosis(uid, body.productId, body.campaignId, inputHash);
    if (cached) return NextResponse.json({ diagnosis: cached, cached: true });
  }

  // 4. Budget cap
  if (await isBudgetExceeded()) {
    return NextResponse.json({ error: 'budget_exceeded', message: 'AI diagnosis is paused for the month.' }, { status: 503 });
  }

  // 5. Per-user daily quota
  const usage = await checkAndIncrementUsage(uid);
  if (!usage.allowed) {
    return NextResponse.json({ error: 'daily_limit', message: `Daily limit reached (${usage.used}/${usage.limit}).`, used: usage.used, limit: usage.limit }, { status: 429 });
  }

  // 6. Generate
  let generation;
  try {
    generation = await generateDiagnosis({ /* …prompt context… */ });
  } catch (err) {
    const name = err instanceof Error ? err.name : '';
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = name === 'APIConnectionTimeoutError' || /timeout|aborted/i.test(message);
    console.error('[diagnose] generation failed', { uid, name, message, isTimeout });
    await decrementUsage(uid).catch(() => {});
    if (isTimeout) return NextResponse.json({ error: 'timeout', message: 'AI took too long. Try again.' }, { status: 504 });
    return NextResponse.json({ error: 'upstream', message: 'AI service temporarily unavailable.', detail: `${name}: ${message.slice(0, 500)}` }, { status: 502 });
  }

  // 7. Track spend + cache + return
  await addToMonthlySpend(generation.usage.costUsd).catch((e) => console.error('[diagnose] addToMonthlySpend failed', { uid, e }));
  const cached = await cacheDiagnosis(uid, { /* …fields… */ });
  return NextResponse.json({ diagnosis: cached, cached: false });
}
```

`generateDiagnosis` itself (in `lib/claude/diagnose.ts`):

```ts
export async function generateDiagnosis(ctx: PromptContext): Promise<DiagnoseResult> {
  const userPrompt = buildDiagnosisPrompt(ctx);
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });
  const inputTokens = response.usage?.input_tokens ?? 0;
  const outputTokens = response.usage?.output_tokens ?? 0;
  const text = extractText(response);
  let output: DiagnosisOutput;
  try { output = parseAndValidate(text); }
  catch (err) {
    console.error('[diagnose] claude output parse/validate failed', {
      rawText: text.slice(0, 1500),
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
  return { output, usage: { inputTokens, outputTokens, costUsd: estimateCostUsd(inputTokens, outputTokens) } };
}
```

## Common pitfalls

- **Don't stream from this codebase's pattern.** AdTestLab is fully non-streaming — `messages.create`, await, parse. ProductTestLab's "performative AI loading" UX is a *client-side* animation overlay; the request itself stays non-streaming for now (matches the Wizard spec).
- **Don't trust the model to skip the markdown fence.** Always run output through `stripFences` before `JSON.parse`, even when the system prompt explicitly forbids fences.
- **Don't tighten the Zod output schema bounds aggressively.** Lower bounds caused 502s on legitimate orientation-mode answers in AdTestLab — keep `summary.min(30)` / `primaryIssue.min(5)` / `recommendedAction.min(10)` as the floor.
- **Don't forget the timeout config.** The SDK's `timeout: 50_000` must stay below the route's `maxDuration` (60s) so the SDK aborts cleanly with a typed error rather than the platform 504-ing out.
- **Don't increment quota before validation.** Auth → validate body → cache lookup → budget → quota → generate → spend → cache. Refund the quota credit on upstream failures so users aren't punished for Anthropic outages.
- **Don't import `lib/claude/*` from a client component.** Every file in there starts with `import 'server-only'`. Surface AI calls through a `fetch('/api/...')` wrapped in a custom hook (see `hooks/useDiagnose.ts`).

## Open questions / gaps

- **No retry-on-bad-JSON loop.** AdTestLab logs the raw output and returns 502; the user retries manually. ProductTestLab's spec Part 8.3 calls out "AI JSON parsing reliability" as a risk — **decision needed**: add an automatic single retry with a stricter "JSON only" reminder, or stick with manual retry.
- **No per-call audit log.** Only cost (per month) and cached output (per request) are persisted. Spec Part 8 implies multiple AI features (Wizard, Viability, Hypothesis editor) — if cross-feature observability matters, **decision needed** about adding a `users/{uid}/aiCalls/{id}` log.
- **No tool use, no `response_format` parameter, no structured-output Anthropic features.** Plain JSON-via-prompt is the only pattern. ProductTestLab can adopt newer Anthropic features (e.g. native structured outputs, streaming) but the AdTestLab pattern is to keep it simple — **requires decision** per feature.
- **No prompt-caching usage** (Anthropic's `cache_control`). The system prompt is large and reused — there's likely a real cost win here. **Requires decision** for ProductTestLab where prompts may be similarly stable.
- **No external observability** (Sentry, LogRocket, etc.). All logs go to Vercel function logs only. **Requires decision** if alerting on AI errors becomes important.
- **Quota knobs are hard-coded** (`DAILY_DIAGNOSIS_LIMIT = 5`, `MONTHLY_BUDGET_USD = 18`). Fine for MVP; ProductTestLab may want to externalize these into the user doc / a config collection — **requires decision**.
