'use client';
import { useState } from 'react';
import { fetchAi, type AiError } from '@/lib/claude/clientFetch';
import {
  SuggestBaselinesOutputSchema,
  type SuggestBaselinesInput,
  type SuggestBaselinesOutput,
} from '@/lib/claude/schemas';

export function useAiBaselines() {
  const [data, setData] = useState<SuggestBaselinesOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AiError | null>(null);

  const suggest = async (input: SuggestBaselinesInput): Promise<SuggestBaselinesOutput | null> => {
    setLoading(true);
    setError(null);
    try {
      const out = await fetchAi('suggest-baselines', input, SuggestBaselinesOutputSchema);
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
