import fs from 'node:fs';
import { DIGEST_FILE } from '../lib/paths.mjs';
import { info, warn } from '../lib/log.mjs';

const ISSUE_TITLE = 'Job agent — control panel';

function section(title, lines) {
  if (!lines.length) return '';
  return `\n### ${title}\n\n${lines.join('\n')}\n`;
}

export function buildDigest({ state, report, usage }) {
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const counts = Object.values(state.jobs).reduce((acc, job) => {
    acc[job.status] = (acc[job.status] ?? 0) + 1;
    return acc;
  }, {});
  const dismissedCount = Object.keys(state.dismissed ?? {}).length;

  const matched = report.matched.map(
    (job) =>
      `- **${job.score.value}** · [${job.title} — ${job.company}](${job.url}) · ${
        job.location || 'location not stated'
      }\n  - ${job.score.hook}\n  - draft: \`${job.drafts?.dir ?? 'not drafted this run'}\`\n  - mark applied with: \`applied ${job.id}\``,
  );

  const nearMisses = report.nearMisses.map(
    (job) =>
      `- ${job.score.value} · [${job.title} — ${job.company}](${job.url}) · ${
        (job.score.redFlags ?? []).join('; ') || 'below threshold'
      }`,
  );

  const followups = report.followups.map(
    (item) =>
      `- **${item.job.title} — ${item.job.company}** · touch ${item.touchNumber}, day ${item.daysSinceApplied}\n  - \`${item.file}\`\n  - subject: ${item.subject}`,
  );

  const problems = report.problems.map((line) => `- ${line}`);

  const body = [
    `## Job agent run — ${stamp} UTC`,
    '',
    `Scanned **${report.scanned}** postings, **${report.newJobs}** new, scored **${report.scored}**, drafted **${report.drafted}**, follow-ups **${report.followups.length}**.`,
    '',
    `Pipeline: ${Object.entries(counts)
      .map(([status, n]) => `${status} ${n}`)
      .join(' · ') || 'nothing tracked yet'} · ${dismissedCount} ruled out`,
    section('Worth applying', matched),
    section('Follow-ups due', followups),
    section('Near misses, for a second opinion', nearMisses),
    section('Problems', problems),
    '',
    '---',
    '',
    'To update state, add lines to `automation/job-agent/data/commands.md` (or run the',
    'workflow manually and paste them into the `commands` input):',
    '',
    '```',
    'applied <job-id>',
    'replied <job-id>',
    'rejected <job-id>',
    'note <job-id> anything worth remembering',
    '```',
    '',
    'To add a job by hand, paste the URL into `automation/job-agent/data/inbox.md`.',
    '',
    usage.calls
      ? `_${usage.calls} Claude calls, ${usage.inputTokens} in / ${usage.outputTokens} out._`
      : '_No Claude calls this run._',
    '',
  ].join('\n');

  return body;
}

export function writeDigest(body) {
  fs.writeFileSync(DIGEST_FILE, body);
  info(`digest written to ${DIGEST_FILE}`);
}

async function gh(path, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'content-type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    warn(`github ${path} -> ${res.status} ${await res.text()}`);
    return null;
  }
  return res.json();
}

/**
 * Post the digest as a comment on a single long-lived issue, so the run shows up
 * as a phone notification instead of something to remember to go and read.
 */
export async function postDigestIssue(body) {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!process.env.GITHUB_TOKEN || !repo || process.env.DIGEST_ISSUE === 'false') {
    return;
  }

  const open = await gh(`/repos/${repo}/issues?state=open&per_page=100`);
  let issue = (open ?? []).find((item) => item.title === ISSUE_TITLE && !item.pull_request);

  if (!issue) {
    issue = await gh(`/repos/${repo}/issues`, {
      method: 'POST',
      body: JSON.stringify({
        title: ISSUE_TITLE,
        body:
          'Every run of the job agent comments here. Reply on this issue is not read ' +
          'by the agent, use `automation/job-agent/data/commands.md` for state changes.',
      }),
    });
    if (!issue) return;
    info(`opened control panel issue #${issue.number}`);
  }

  const posted = await gh(`/repos/${repo}/issues/${issue.number}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
  if (posted) info(`digest posted to issue #${issue.number}`);
}
