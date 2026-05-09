'use client';
import { useState } from 'react';
import { fetchAi, type AiError } from '@/lib/claude/clientFetch';
import {
  V2SuggestionsOutputSchema,
  type V2SuggestionsInput,
  type V2SuggestionsOutput,
} from '@/lib/claude/schemas';

export function useAiV2Suggestions() {
  const [data, setData] = useState<V2SuggestionsOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AiError | null>(null);

  const suggest = async (input: V2SuggestionsInput): Promise<V2SuggestionsOutput | null> => {
    setLoading(true);
    setError(null);
    try {
      const out = await fetchAi('v2-suggestions', input, V2SuggestionsOutputSchema);
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
