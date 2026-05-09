import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (_client) return _client;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }
  _client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: 50_000,
  });
  return _client;
}

export const CLAUDE_MODEL = 'claude-sonnet-4-5';
export const MAX_TOKENS = 2000;

export const INPUT_COST_PER_TOKEN = 3 / 1_000_000;
export const OUTPUT_COST_PER_TOKEN = 15 / 1_000_000;

export function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  return inputTokens * INPUT_COST_PER_TOKEN + outputTokens * OUTPUT_COST_PER_TOKEN;
}

export interface ClaudeUsage {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export function extractText(response: Anthropic.Message): string {
  const block = response.content.find((b) => b.type === 'text');
  if (!block || block.type !== 'text') {
    throw new Error('No text block in Claude response');
  }
  return block.text;
}
