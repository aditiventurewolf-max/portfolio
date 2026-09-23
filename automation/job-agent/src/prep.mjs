/**
 * Stage one of a run, and the half that costs nothing.
 *
 * Everything deterministic happens here: fetch every source, drop what is
 * already decided, apply the free filters, work out which follow-ups are due,
 * and write a work order. No model is involved. The judgement is stage two,
 * done by the Claude Code session that runs this (see RUNBOOK.md), which is why
 * there is no API key anywhere in this project.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from './lib/config.mjs';
import { PROFILE, WORK, ORDER_FILE, BRIEF_FILE, RESULTS_FILE } from './lib/paths.mjs';
import { loadState, saveState, opportunityId, dismiss, isKnown } from './lib/store.mjs';
import { info, warn } from './lib/log.mjs';
import { discover, hydrate } from './sources/index.mjs';
import { prefilter } from './stages/filter.mjs';
import { dueTouches, feedbackSummary } from './stages/cadence.mjs';
import { applyCommands } from './stages/commands.mjs';
import { buildSearchPlan } from './sources/searchplan.mjs';
import { loadKnowledge, saveKnowledge, recordCompany, knowledgeBrief } from './lib/knowledge.mjs';

const config = loadConfig();
const state = loadState();

const commands = applyCommands(state, process.env.AGENT_COMMANDS ?? '');
if (commands.applied.length) info(`applied ${commands.applied.length} command(s)`);

const items = await discover(config);

// Collapse duplicates inside the run, then drop anything already decided on.
const unique = new Map();
for (const item of items) {
  if (!item.url) continue;
  if (item.type === 'posting' && !item.title) continue;
  const id = opportunityId(item);
  if (!unique.has(id)) unique.set(id, { ...item, id });
}

const fresh = [...unique.values()].filter((item) => !isKnown(state, item.id));
info(`${fresh.length} of ${unique.size} are new`);

// Free filters first.
const survivors = [];
for (const item of fresh) {
  const hydrated = !item.description && item.detailRef ? await hydrate(item) : item;
  const gate = prefilter(hydrated, config.targets);
  if (!gate.keep) {
    dismiss(state, hydrated, gate.reason);
    continue;
  }
  survivors.push(hydrated);
}
info(`${survivors.length} passed the free filter`);

/**
 * Deliberately small. The whole lesson from every job-search tool that works is
 * that ten researched approaches beat two hundred sprayed ones, and a run that
 * hands over eighty postings gets skimmed instead of read.
 *
 * Straight recency sorting does not work here. One big company with a five
 * hundred posting board and fresh timestamps takes every slot, and the run comes
 * back as eight roles at the same employer. So take a couple per company at a
 * time and go round, which spends the budget across the field instead.
 */
function pick(list, limit, maxPerCompany = 2) {
  const byCompany = new Map();
  for (const item of list) {
    const key = (item.company ?? '').toLowerCase() || item.source;
    if (!byCompany.has(key)) byCompany.set(key, []);
    byCompany.get(key).push(item);
  }

  for (const group of byCompany.values()) {
    group.sort((a, b) => Date.parse(b.postedAt ?? 0) - Date.parse(a.postedAt ?? 0) || 0);
  }

  // Companies with the freshest posting go first, then round-robin.
  const queues = [...byCompany.values()].sort(
    (a, b) => Date.parse(b[0].postedAt ?? 0) - Date.parse(a[0].postedAt ?? 0) || 0,
  );

  const picked = [];
  for (let round = 0; round < maxPerCompany && picked.length < limit; round += 1) {
    for (const queue of queues) {
      if (picked.length >= limit) break;
      const next = queue[round];
      if (next) picked.push(next);
    }
  }
  return picked;
}

const inboxItems = survivors.filter((i) => i.source === 'inbox');
const postings = pick(
  survivors.filter((i) => i.type === 'posting' && i.source !== 'inbox'),
  config.targets.postingsPerRun,
);
const companies = pick(
  survivors.filter((i) => i.type === 'company'),
  config.targets.companiesPerRun,
);

const toJudge = [...inboxItems, ...postings, ...companies];
const touches = dueTouches(state, config);
const feedback = feedbackSummary(state);
const searchPlan = buildSearchPlan(config);

// Everything discovered goes into the knowledge base, whether or not it is
// pursued today. A company ruled out this month may be the right one next
// quarter, and the research is only cheap the first time.
const kb = loadKnowledge();
for (const item of [...companies, ...postings]) {
  recordCompany(kb, {
    name: item.company,
    url: item.url,
    // First real sentence, not the "About <Company>" heading that boards open with.
    whatTheyDo:
      (item.description ?? '')
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line.length > 40 && !/^about\b/i.test(line))
        ?.slice(0, 200) ?? '',
    stage: item.extra?.batch ?? '',
    teamSize: item.extra?.teamSize ?? '',
    source: item.source,
  });
}
saveKnowledge(kb);

// The order is the machine-readable half; the brief is what gets read.
fs.mkdirSync(WORK, { recursive: true });
fs.rmSync(RESULTS_FILE, { force: true });

fs.writeFileSync(
  ORDER_FILE,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      judge: toJudge.map((item) => ({
        id: item.id,
        type: item.type,
        track: item.type === 'company' ? 'outreach' : 'application',
        source: item.source,
        company: item.company,
        title: item.title,
        location: item.location,
        url: item.url,
        needsExtraction: Boolean(item.needsExtraction),
      })),
      touches: touches.map((t) => ({
        id: t.id,
        track: t.item.track,
        touchNumber: t.touchNumber,
        totalTouches: t.totalTouches,
      })),
      searchPlan,
    },
    null,
    2,
  )}\n`,
);

function block(item) {
  const label = item.type === 'company' ? 'COMPANY (no posted role)' : 'POSTING';
  return [
    `### \`${item.id}\` — ${item.company || '(company not yet known)'}`,
    '',
    `- Kind: ${label}`,
    `- Title: ${item.title}`,
    `- Location: ${item.location || 'not stated'}`,
    `- URL: ${item.url}`,
    `- Found via: ${item.source}`,
    item.needsExtraction
      ? '- **This came from the inbox as a raw web page. Work out from the text below whether it is a single job posting, and if it is, pull out the company, title and location.**'
      : '',
    '',
    '```',
    (item.description ?? '').slice(0, 5000),
    '```',
    '',
  ]
    .filter(Boolean)
    .join('\n');
}

function touchBlock(t) {
  const item = t.item;
  const history =
    (item.touches ?? [])
      .map((x) => `  - touch ${x.n} on ${String(x.at).slice(0, 10)}: ${x.subject ?? '(no subject recorded)'}`)
      .join('\n') || '  - none yet, this is the first nudge';
  const angles = item.draft?.followupAngles ?? [];
  return [
    `### \`${item.id}\` — ${item.company}`,
    '',
    `- ${item.track === 'outreach' ? 'Cold outreach' : 'Application'} for: ${item.title}`,
    `- Sent ${t.daysSinceSent} days ago. This is touch ${t.touchNumber} of ${t.totalTouches}.`,
    `- URL: ${item.url}`,
    '- History:',
    history,
    `- Angle planned for this touch: ${angles[t.touchNumber - 1] ?? '(none recorded, pick the most useful concrete thing)'}`,
    item.contacts?.length
      ? `- Contacts on file: ${item.contacts.map((c) => `${c.name} (${c.role})`).join(', ')}`
      : '',
    '',
  ]
    .filter(Boolean)
    .join('\n');
}

const feedbackLines = feedback.sent
  ? [
      `Sent so far: ${feedback.sent}. Replies: ${feedback.replied}.`,
      ...Object.entries(feedback.byTrack).map(
        ([track, b]) => `- ${track}: ${b.replied}/${b.sent} replied`,
      ),
      feedback.wins.length
        ? `\nAngles that got a reply:\n${feedback.wins.map((w) => `- ${w.company} (${w.track}, ${w.touches} touches): ${w.angle || 'angle not recorded'}`).join('\n')}`
        : '',
      feedback.silent.length
        ? `\nAngles that went silent after two or more touches:\n${feedback.silent.map((w) => `- ${w.company} (${w.track}): ${w.angle || 'angle not recorded'}`).join('\n')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n')
  : 'Nothing sent yet, so there is no reply data to learn from. First run.';

const searchLines = searchPlan.length
  ? [
      'Run each of these with web search. They are aimed at posts, not job boards,',
      'because hiring intent shows up in a post first and often only there. The',
      'set rotates daily, so a week covers the whole space.',
      '',
      ...searchPlan.map(
        (q, i) => `${i + 1}. \`${q.query}\`\n   - platform: ${q.platform}\n   - looking for: ${q.lookingFor}`,
      ),
    ].join('\n')
  : 'Social search is switched off in config.json.';

const brief = [
  '# Work order',
  '',
  `Generated ${new Date().toISOString()}. Follow `,
  '`automation/job-agent/RUNBOOK.md` for what to do with this.',
  '',
  `**${toJudge.length} to judge** (${inboxItems.length} from the inbox, ${postings.length} postings, ${companies.length} companies) · **${touches.length} follow-ups due**`,
  '',
  '## What has worked so far',
  '',
  feedbackLines,
  '',
  '## What is already known',
  '',
  knowledgeBrief(kb),
  '',
  '## Searches to run for posts (LinkedIn, X, Instagram, YC, web)',
  '',
  searchLines,
  '',
  toJudge.length ? '## Judge these' : '## Nothing new to judge',
  '',
  ...toJudge.map(block),
  touches.length ? '## Follow-ups due' : '## No follow-ups due',
  '',
  ...touches.map(touchBlock),
].join('\n');

fs.writeFileSync(BRIEF_FILE, brief);

state.runs.push({
  at: new Date().toISOString(),
  stage: 'prep',
  discovered: items.length,
  fresh: fresh.length,
  filtered: survivors.length,
  queued: toJudge.length,
  touchesDue: touches.length,
  searches: searchPlan.length,
});
saveState(state);

info(
  `work order: ${toJudge.length} to judge, ${touches.length} follow-ups due, ${searchPlan.length} searches to run`,
);
info(`brief written to ${path.relative(process.cwd(), BRIEF_FILE)}`);
if (!toJudge.length && !touches.length && !searchPlan.length) {
  warn('nothing to do this run');
}
