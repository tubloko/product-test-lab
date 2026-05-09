'use client';
import { useState } from 'react';
import { fetchAi, type AiError } from '@/lib/claude/clientFetch';
import {
  SuggestAnglesOutputSchema,
  type SuggestAnglesInput,
  type SuggestAnglesOutput,
} from '@/lib/claude/schemas';

export function useAiAngles() {
  const [data, setData] = useState<SuggestAnglesOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AiError | null>(null);

  const suggest = async (input: SuggestAnglesInput): Promise<SuggestAnglesOutput | null> => {
    setLoading(true);
    setError(null);
    try {
      const out = await fetchAi('suggest-angles', input, SuggestAnglesOutputSchema);
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
