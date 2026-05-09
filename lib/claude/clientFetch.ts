import type { ZodSchema } from 'zod';
import { auth } from '@/lib/firebase/config';

export type AiErrorKind =
  | 'unauthorized'
  | 'bad_request'
  | 'budget_exceeded'
  | 'timeout'
  | 'upstream'
  | 'internal'
  | 'network';

export interface AiError {
  kind: AiErrorKind;
  message: string;
}

export async function fetchAi<T>(
  endpoint: string,
  payload: unknown,
  schema: ZodSchema<T>,
): Promise<T> {
  const user = auth.currentUser;
  if (!user) {
    throw { kind: 'unauthorized', message: 'Not signed in' } satisfies AiError;
  }
  const token = await user.getIdToken();

  let res: Response;
  try {
    res = await fetch(`/api/ai/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    throw {
      kind: 'network',
      message: e instanceof Error ? e.message : 'Network error',
    } satisfies AiError;
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as
      | { error?: AiErrorKind; message?: string }
      | null;
    const kind: AiErrorKind = body?.error ?? 'upstream';
    throw {
      kind,
      message: body?.message ?? `HTTP ${res.status}`,
    } satisfies AiError;
  }

  const json = await res.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw {
      kind: 'upstream',
      message: 'AI returned an unexpected shape',
    } satisfies AiError;
  }
  return parsed.data;
}
