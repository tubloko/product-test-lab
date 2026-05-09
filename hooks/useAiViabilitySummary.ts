'use client';
import { useState } from 'react';
import { fetchAi, type AiError } from '@/lib/claude/clientFetch';
import {
  ViabilitySummaryOutputSchema,
  type ViabilitySummaryInput,
  type ViabilitySummaryOutput,
} from '@/lib/claude/schemas';

export function useAiViabilitySummary() {
  const [data, setData] = useState<ViabilitySummaryOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AiError | null>(null);

  const suggest = async (
    input: ViabilitySummaryInput,
  ): Promise<ViabilitySummaryOutput | null> => {
    setLoading(true);
    setError(null);
    try {
      const out = await fetchAi('viability-summary', input, ViabilitySummaryOutputSchema);
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
