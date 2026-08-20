import { ask } from '../lib/claude.mjs';
import { info } from '../lib/log.mjs';

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['score', 'verdict', 'reasons', 'redFlags', 'hook'],
  properties: {
    score: {
      type: 'integer',
      minimum: 0,
      maximum: 100,
      description: 'How well this role fits the candidate. Be strict, 70+ means worth applying.',
    },
    verdict: { type: 'string', enum: ['apply', 'maybe', 'skip'] },
    reasons: {
      type: 'array',
      maxItems: 4,
      items: { type: 'string' },
      description: 'Short concrete reasons for the score.',
    },
    redFlags: {
      type: 'array',
      maxItems: 4,
      items: { type: 'string' },
      description: 'Anything in the posting that conflicts with what she wants.',
    },
    hook: {
      type: 'string',
      description:
        'The single most specific overlap between her actual work and this role, ' +
        'in one sentence. This becomes the opening of the cover letter.',
    },
  },
};

/**
 * Cheap local filter, so obviously-wrong postings never reach the model. A large
 * board dump is mostly roles in other functions entirely, and paying Claude to
 * read each one is the fastest way to make this expensive and slow.
 */
const patterns = new Map();

/**
 * Word-boundary match, so "ai" does not hit "said" and "lead" does not hit
 * "leadership". Compiled once per keyword and reused across a run.
 */
function hasWord(text, keyword) {
  let re = patterns.get(keyword);
  if (!re) {
    const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    re = new RegExp(`\\b${escaped}\\b`, 'i');
    patterns.set(keyword, re);
  }
  return re.test(text);
}

export function prefilter(job, targets) {
  const title = job.title ?? '';

  const bad = (targets.excludeTitleKeywords ?? []).find((word) => hasWord(title, word));
  if (bad) return { keep: false, reason: `title has "${bad.trim()}"` };

  const wanted = targets.includeTitleKeywords ?? [];
  if (wanted.length && !wanted.some((word) => hasWord(title, word))) {
    return { keep: false, reason: 'title outside target functions' };
  }

  if (!job.description || job.description.length < 200) {
    return { keep: false, reason: 'no usable description' };
  }
  return { keep: true };
}

export async function scoreJob(job, { config, resume }) {
  const { targets, profile } = config;

  const result = await ask({
    label: `score ${job.company} / ${job.title}`,
    effort: config.model.scoringEffort ?? 'medium',
    maxTokens: 4000,
    schema: SCHEMA,
    system: [
      'You screen job postings for one specific candidate.',
      'You are the filter that protects her time, so be genuinely strict.',
      'A role scores high only when the posting matches what she has actually done',
      'and what she says she wants. Seniority mismatch, wrong function, or a',
      'dealbreaker means a low score no matter how appealing the company is.',
      'Judge only from the posting text and her resume. Never assume experience',
      'that is not written down.',
    ].join(' '),
    prompt: [
      '# Her resume',
      resume,
      '',
      '# What she is looking for',
      `Target roles: ${targets.roles.join('; ')}`,
      `Interested in: ${targets.interestedIn.join('; ')}`,
      `Nice to have: ${(targets.niceToHave ?? []).join('; ')}`,
      `Deal breakers: ${targets.dealBreakers.join('; ')}`,
      `Based in ${profile.location}, open to: ${profile.openTo.join(', ')}`,
      `Work authorisation: ${profile.workAuth}`,
      '',
      '# The posting',
      `Company: ${job.company}`,
      `Title: ${job.title}`,
      `Location: ${job.location || 'not stated'}`,
      `Source: ${job.source}`,
      `URL: ${job.url}`,
      '',
      job.description,
    ].join('\n'),
  });

  if (result) {
    info(`  scored ${result.score} (${result.verdict}) ${job.company} / ${job.title}`);
  }
  return result;
}
