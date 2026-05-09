'use client';
import { useState } from 'react';
import { fetchAi, type AiError } from '@/lib/claude/clientFetch';
import {
  SuggestAvatarsOutputSchema,
  type SuggestAvatarsInput,
  type SuggestAvatarsOutput,
} from '@/lib/claude/schemas';

export function useAiAvatars() {
  const [data, setData] = useState<SuggestAvatarsOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AiError | null>(null);

  const suggest = async (input: SuggestAvatarsInput): Promise<SuggestAvatarsOutput | null> => {
    setLoading(true);
    setError(null);
    try {
      const out = await fetchAi('suggest-avatars', input, SuggestAvatarsOutputSchema);
      setData(out);
      return out;
    } catch (e) {
      setError(e as AiError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
  };

  return { data, loading, error, suggest, reset };
}
