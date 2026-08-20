import fs from 'node:fs';
import path from 'node:path';
import { ask } from '../lib/claude.mjs';
import { DRAFTS } from '../lib/paths.mjs';
import { daysSince } from '../lib/store.mjs';
import { info } from '../lib/log.mjs';

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['subject', 'body', 'linkedinDm'],
  properties: {
    subject: { type: 'string', description: 'Email subject. Plain, no "Following up".' },
    body: { type: 'string', description: 'Under 90 words, in her voice, one clear ask.' },
    linkedinDm: { type: 'string', description: 'Under 45 words, same point, more casual.' },
  },
};

/**
 * Which applications are due a nudge. Cadence is measured from the last touch,
 * or from the application date for the first one.
 */
export function dueFollowups(state, config) {
  const { cadenceDays, maxTouches, stopOnStatus } = config.followup;
  const stop = new Set(stopOnStatus);
  const due = [];

  for (const job of Object.values(state.jobs)) {
    if (job.status !== 'applied' || stop.has(job.status)) continue;
    if (!job.appliedAt) continue;

    const touches = job.touches ?? [];
    if (touches.length >= maxTouches) continue;

    const next = touches.length; // 0-indexed into cadenceDays
    const threshold = cadenceDays[next];
    if (threshold === undefined) continue;

    const since = touches.length
      ? daysSince(touches[touches.length - 1].at)
      : daysSince(job.appliedAt);
    const gap = touches.length ? threshold - cadenceDays[next - 1] : threshold;

    if (since >= gap) {
      due.push({ job, touchNumber: next + 1, daysSinceApplied: Math.floor(daysSince(job.appliedAt)) });
    }
  }
  return due;
}

export async function writeFollowup({ job, touchNumber, daysSinceApplied }, { config, resume, voice }) {
  const angles = job.drafts?.followupAngles ?? [];
  const angle = angles[touchNumber - 1] ?? angles[angles.length - 1] ?? '';
  const history = (job.touches ?? [])
    .map((t) => `Touch ${t.n} on ${t.at.slice(0, 10)}: ${t.subject ?? '(no subject recorded)'}`)
    .join('\n') || 'none yet';

  const result = await ask({
    label: `followup ${touchNumber} for ${job.company}`,
    maxTokens: 3000,
    schema: SCHEMA,
    system: [
      'You write follow-up messages after a job application, as Aditi Agarwal.',
      '',
      voice,
      '',
      'A follow-up earns its place by adding something. Never write a message whose',
      'only content is that time has passed. Each one is shorter than the last.',
      'Never sound wounded, never apologise for following up, never ask twice for',
      'the same thing. If there is genuinely nothing to add, say the one useful',
      'thing and close.',
    ].join('\n'),
    prompt: [
      `This is follow-up number ${touchNumber}, ${daysSinceApplied} days after applying.`,
      `Role: ${job.title} at ${job.company}`,
      `Posting: ${job.url}`,
      '',
      '# Previous touches',
      history,
      '',
      '# The angle planned for this touch',
      angle || 'no angle recorded, pick the most useful concrete thing from her resume',
      '',
      '# Her resume, for the specifics',
      resume,
    ].join('\n'),
  });

  if (!result) return null;

  const dir = path.join(DRAFTS, job.drafts?.dir ?? `unfiled-${job.id}`);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `followup-${touchNumber}.md`);
  fs.writeFileSync(
    file,
    [
      `# Follow-up ${touchNumber} — ${job.title} at ${job.company}`,
      '',
      `Applied ${daysSinceApplied} days ago. Job id \`${job.id}\`.`,
      '',
      '## Email',
      '',
      `**Subject:** ${result.subject}`,
      '',
      result.body,
      '',
      '## LinkedIn DM version',
      '',
      result.linkedinDm,
      '',
    ].join('\n'),
  );

  info(`  follow-up ${touchNumber} drafted for ${job.company}`);
  return { ...result, file: path.relative(DRAFTS, file) };
}
