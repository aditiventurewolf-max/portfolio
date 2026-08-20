import fs from 'node:fs';
import path from 'node:path';
import { ask } from '../lib/claude.mjs';
import { DRAFTS } from '../lib/paths.mjs';
import { info } from '../lib/log.mjs';

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['coverLetter', 'resumeBullets', 'outreachNote', 'screeningAnswers', 'followupAngles'],
  properties: {
    coverLetter: {
      type: 'string',
      description: '150-220 words, three short paragraphs at most, in her voice.',
    },
    resumeBullets: {
      type: 'array',
      minItems: 3,
      maxItems: 6,
      items: { type: 'string' },
      description:
        'Bullets rewritten from her real resume, reordered and reworded for this ' +
        'specific posting. Facts must already exist in the resume.',
    },
    outreachNote: {
      type: 'string',
      description: 'Under 60 words. A LinkedIn connection note to someone on the team.',
    },
    screeningAnswers: {
      type: 'array',
      maxItems: 4,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['question', 'answer'],
        properties: {
          question: { type: 'string' },
          answer: { type: 'string' },
        },
      },
      description:
        'Likely application-form questions for this posting, with her answers. ' +
        'Skip generic ones like notice period.',
    },
    followupAngles: {
      type: 'array',
      minItems: 2,
      maxItems: 3,
      items: { type: 'string' },
      description:
        'One specific thing to say in each later follow-up, so touch two and ' +
        'three add something instead of nudging.',
    },
  },
};

function slug(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

export async function tailorJob(job, { config, resume, voice }) {
  const result = await ask({
    label: `tailor ${job.company} / ${job.title}`,
    maxTokens: 8000,
    schema: SCHEMA,
    system: [
      'You write job applications as Aditi Agarwal, in her own voice.',
      'The voice rules below are absolute. A letter that breaks them is worse than',
      'no letter, because it sounds like every other applicant.',
      '',
      voice,
      '',
      'Only use facts from her resume. If the posting asks for something she does',
      'not have, do not claim it and do not apologise for it. Write around it by',
      'showing the closest real thing she has built.',
    ].join('\n'),
    prompt: [
      '# Her resume',
      resume,
      '',
      '# The posting',
      `Company: ${job.company}`,
      `Title: ${job.title}`,
      `Location: ${job.location || 'not stated'}`,
      `URL: ${job.url}`,
      '',
      job.description,
      '',
      '# The strongest overlap, found during screening',
      job.score?.hook ?? '',
      '',
      '# Known gaps to write around, not to hide',
      (job.score?.redFlags ?? []).join('; ') || 'none noted',
    ].join('\n'),
  });

  if (!result) return null;

  const dir = path.join(DRAFTS, `${slug(job.company)}-${slug(job.title)}-${job.id}`);
  fs.mkdirSync(dir, { recursive: true });

  const front = [
    `# ${job.title} at ${job.company}`,
    '',
    `- Score: ${job.score?.value ?? '?'} (${job.score?.verdict ?? '?'})`,
    `- Location: ${job.location || 'not stated'}`,
    `- Posting: ${job.url}`,
    `- Job id: \`${job.id}\``,
    '',
    '',
  ].join('\n');

  fs.writeFileSync(
    path.join(dir, 'cover-letter.md'),
    `${front}## Cover letter\n\n${result.coverLetter}\n`,
  );
  fs.writeFileSync(
    path.join(dir, 'resume-bullets.md'),
    `${front}## Bullets tuned for this role\n\n${result.resumeBullets
      .map((b) => `- ${b}`)
      .join('\n')}\n`,
  );
  fs.writeFileSync(
    path.join(dir, 'outreach.md'),
    [
      front,
      '## LinkedIn note',
      '',
      result.outreachNote,
      '',
      '## Likely form questions',
      '',
      ...result.screeningAnswers.map((qa) => `**${qa.question}**\n\n${qa.answer}\n`),
      '## Follow-up angles',
      '',
      ...result.followupAngles.map((angle, i) => `${i + 1}. ${angle}`),
      '',
    ].join('\n'),
  );

  info(`  drafted ${path.relative(DRAFTS, dir)}`);
  return { dir: path.relative(DRAFTS, dir), followupAngles: result.followupAngles };
}
