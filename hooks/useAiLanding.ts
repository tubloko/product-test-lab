'use client';
import { useState } from 'react';
import { fetchAi, type AiError } from '@/lib/claude/clientFetch';
import {
  SuggestLandingOutputSchema,
  type SuggestLandingInput,
  type SuggestLandingOutput,
} from '@/lib/claude/schemas';

export function useAiLanding() {
  const [data, setData] = useState<SuggestLandingOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AiError | null>(null);

  const suggest = async (input: SuggestLandingInput): Promise<SuggestLandingOutput | null> => {
    setLoading(true);
    setError(null);
    try {
      const out = await fetchAi('suggest-landing', input, SuggestLandingOutputSchema);
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
