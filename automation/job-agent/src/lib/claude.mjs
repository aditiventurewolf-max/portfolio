import Anthropic from '@anthropic-ai/sdk';
import { loadConfig } from './config.mjs';
import { info, warn } from './log.mjs';

const config = loadConfig();

/** No key means every LLM stage no-ops. Discovery still runs, so CI stays useful. */
export const LLM_ENABLED = Boolean(
  process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN,
);

const client = LLM_ENABLED ? new Anthropic({ maxRetries: 4 }) : null;

const usage = { calls: 0, inputTokens: 0, outputTokens: 0 };

export function usageReport() {
  return { ...usage };
}

function extractText(message) {
  return message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();
}

function parseJson(text) {
  // json_schema output should already be bare JSON, but stay tolerant.
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();
  return JSON.parse(cleaned);
}

/**
 * One structured-output request. Returns the parsed object, or null when the
 * LLM is disabled or the model refused.
 */
export async function ask({
  system,
  prompt,
  schema,
  effort = config.model.effort,
  maxTokens = 8000,
  label = 'request',
}) {
  if (!client) {
    info(`[dry-run] skipped Claude ${label}`);
    return null;
  }

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const message = await client.messages.create({
        model: config.model.id,
        max_tokens: maxTokens,
        thinking: { type: 'adaptive' },
        output_config: {
          effort,
          format: { type: 'json_schema', schema },
        },
        system,
        messages: [{ role: 'user', content: prompt }],
      });

      usage.calls += 1;
      usage.inputTokens += message.usage?.input_tokens ?? 0;
      usage.outputTokens += message.usage?.output_tokens ?? 0;

      if (message.stop_reason === 'refusal') {
        warn(`Claude declined ${label}: ${message.stop_details?.category ?? 'unknown'}`);
        return null;
      }
      if (message.stop_reason === 'max_tokens') {
        warn(`${label} hit max_tokens, output likely truncated`);
      }

      return parseJson(extractText(message));
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) {
        warn('ANTHROPIC_API_KEY rejected, skipping all LLM stages');
        return null;
      }
      if (err instanceof Anthropic.BadRequestError) {
        warn(`${label} rejected: ${err.message}`);
        return null;
      }
      if (err instanceof Anthropic.APIError) {
        warn(`${label} API error ${err.status}: ${err.message}`);
        if (attempt === 2) return null;
        continue;
      }
      // A JSON parse failure lands here. One retry, then give up on this item.
      warn(`${label} unparseable response: ${err.message}`);
      if (attempt === 2) return null;
    }
  }
  return null;
}
