import fs from 'node:fs';
import { DIGEST_FILE } from '../lib/paths.mjs';
import { info } from '../lib/log.mjs';

function section(title, lines) {
  if (!lines.length) return '';
  return `\n### ${title}\n\n${lines.join('\n')}\n`;
}

export function buildDigest({ state, report }) {
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

  const counts = Object.values(state.tracked).reduce((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});

  const renderDraft = (item) => {
    const files = (item.draft?.files ?? []).map((f) => `\`${f}\``).join(', ');
    return [
      `- **${item.score?.value ?? '?'}** · ${item.company}${
        item.track === 'outreach' ? ' *(no posted role, cold approach)*' : ` — ${item.title}`
      }`,
      `  - ${item.score?.hook ?? ''}`,
      `  - angle: ${item.draft?.angle ?? ''}`,
      item.draft?.needsSampleApproval
        ? '  - **holds a DRAFT work sample. Read it before this goes out.**'
        : item.draft?.sample?.status === 'approved'
          ? `  - attach approved sample \`${item.draft.sample.sourceId}\``
          : '  - no sample attached',
      item.contacts?.length
        ? `  - write to: ${item.contacts.map((c) => `${c.name || '?'}${c.email ? ` <${c.email}>` : ''}`).join(', ')}`
        : '',
      `  - \`data/drafts/${item.draft?.dir}/\` → ${files}`,
      `  - once you send it: \`sent ${item.id}\``,
    ]
      .filter(Boolean)
      .join('\n');
  };

  const ready = report.drafted.filter((i) => !i.draft?.needsSampleApproval).map(renderDraft);
  const heldForApproval = report.drafted
    .filter((i) => i.draft?.needsSampleApproval)
    .map(renderDraft);

  const followups = report.touches.map(
    (t) =>
      `- **${t.item.company}** · touch ${t.touchNumber}${t.channel ? ` by ${t.channel}` : ''}\n  - \`data/drafts/${t.item.draft?.dir}/followup-${t.touchNumber}.md\`\n  - ${t.subject || t.body.slice(0, 80)}`,
  );

  const fromPosts = (report.discovered ?? []).map(
    (item) =>
      `- **${item.company}** · ${item.score?.value ?? '?'} · found in ${item.source.replace('search:', '')}\n  - signal: ${item.signal || 'not recorded'}\n  - ${item.url}`,
  );

  const waiting = Object.values(state.tracked)
    .filter((item) => item.status === 'drafted')
    .slice(0, 15)
    .map((item) => `- ${item.company}${item.title ? ` — ${item.title}` : ''} · \`sent ${item.id}\``);

  return [
    `## Job agent — ${stamp} UTC`,
    '',
    `${report.drafted.length} new drafts, ${report.touches.length} follow-ups, ${report.matched.length} newly tracked (${(report.discovered ?? []).length} found in posts), ${report.dismissed} ruled out.`,
    '',
    `Pipeline: ${
      Object.entries(counts)
        .map(([status, n]) => `${status} ${n}`)
        .join(' · ') || 'nothing tracked yet'
    } · ${Object.keys(state.dismissed ?? {}).length} ruled out all-time`,
    section('Found in posts, not on any job board', fromPosts),
    section('Ready to send', ready),
    section('Drafted, but the work sample needs your approval first', heldForApproval),
    section('Follow-ups drafted', followups),
    section('Drafted earlier, still not sent', waiting),
    section('Problems', report.problems.map((p) => `- ${p}`)),
    '',
    '---',
    '',
    'Tell it what happened by adding lines under `## Pending` in',
    '`automation/job-agent/data/commands.md`:',
    '',
    '```',
    'sent <id>          you sent it, starts the follow-up clock',
    'replied <id>       they answered, stops follow-ups',
    'rejected <id>',
    'skip <id>          changed your mind',
    'note <id> anything worth remembering',
    '```',
    '',
    'To add a job or company by hand, paste the URL under `## Pending` in',
    '`automation/job-agent/data/inbox.md`.',
    '',
    'Everything the agent has learned about companies, people and which pitches',
    'get answered is in `automation/job-agent/data/knowledge.md`.',
    '',
    'Work samples live in `automation/job-agent/samples/`. Nothing is attached',
    'unless you moved it into `samples/approved/` and set its status there.',
    '',
  ].join('\n');
}

export function writeDigest(body) {
  fs.writeFileSync(DIGEST_FILE, body);
  info(`digest written to ${DIGEST_FILE}`);
}
