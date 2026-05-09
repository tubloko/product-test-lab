import type { ZodSchema } from 'zod';

export function stripFences(text: string): string {
  return text
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

export function parseAndValidate<T>(text: string, schema: ZodSchema<T>): T {
  const cleaned = stripFences(text);
  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch {
    throw new Error(`Claude returned invalid JSON: ${cleaned.slice(0, 200)}`);
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    throw new Error(`Claude output failed schema: ${result.error.message}`);
  }
  return result.data;
}
