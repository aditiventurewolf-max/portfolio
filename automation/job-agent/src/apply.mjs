/**
 * Stage three: take the judgement the session wrote into work/results.json,
 * validate it, and turn it into state and draft files.
 *
 * This runs after the thinking, and it is strict on purpose. A malformed result
 * is reported and skipped rather than half-written, so a bad run cannot corrupt
 * the pipeline.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from './lib/config.mjs';
import { DRAFTS, ORDER_FILE, RESULTS_FILE, WORK } from './lib/paths.mjs';
import { loadState, saveState, dismiss, opportunityId, isKnown } from './lib/store.mjs';
import {
  loadKnowledge,
  saveKnowledge,
  recordCompany,
  recordPerson,
  recordAngle,
  recordLesson,
} from './lib/knowledge.mjs';
import { info, warn, error } from './lib/log.mjs';
import { archiveUrls } from './sources/inbox.mjs';
import { writeDigest, buildDigest } from './stages/digest.mjs';

const config = loadConfig();
const state = loadState();

if (!fs.existsSync(RESULTS_FILE)) {
  error(`no results at ${RESULTS_FILE}. Run prep, do the judging, then run apply.`);
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
const order = fs.existsSync(ORDER_FILE) ? JSON.parse(fs.readFileSync(ORDER_FILE, 'utf8')) : {};
const ordered = new Map((order.judge ?? []).map((entry) => [entry.id, entry]));

const kb = loadKnowledge();
const report = {
  matched: [],
  dismissed: 0,
  drafted: [],
  touches: [],
  discovered: [],
  problems: [],
};

// The session finds opportunities that no API exposes, so it needs a way to hand
// them back. It refers to them by a `ref` of its own choosing, since only this
// script can mint the stable id.
const refToId = new Map();

function slug(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

function hasFields(object, fields, label) {
  const missing = fields.filter((field) => object[field] === undefined || object[field] === '');
  if (missing.length) {
    report.problems.push(`${label}: missing ${missing.join(', ')}`);
    return false;
  }
  return true;
}

// ---- 1. scores ------------------------------------------------------------

for (const judged of results.judged ?? []) {
  if (!hasFields(judged, ['id', 'score', 'verdict'], 'judged entry')) continue;

  const source = ordered.get(judged.id);
  if (!source) {
    report.problems.push(`judged id ${judged.id} was not in this run's order, ignored`);
    continue;
  }

  const item = {
    ...source,
    company: judged.company || source.company,
    title: judged.title || source.title,
    location: judged.location || source.location,
  };

  if (judged.isJobPosting === false) {
    dismiss(state, item, 'inbox link was not a single job posting');
    report.dismissed += 1;
    continue;
  }

  const passed = judged.score >= config.targets.minScore && judged.verdict !== 'skip';
  if (!passed) {
    dismiss(state, item, `scored ${judged.score}`, judged.score);
    report.dismissed += 1;
    continue;
  }

  state.tracked[item.id] = {
    id: item.id,
    track: item.track,
    type: item.type,
    source: item.source,
    company: item.company,
    title: item.title,
    location: item.location,
    url: item.url,
    firstSeen: new Date().toISOString(),
    status: 'queued',
    score: {
      value: judged.score,
      verdict: judged.verdict,
      reasons: judged.reasons ?? [],
      redFlags: judged.redFlags ?? [],
      hook: judged.hook ?? '',
    },
    contacts: [],
    touches: [],
    notes: [],
  };
  report.matched.push(state.tracked[item.id]);
}

// ---- 1b. opportunities the session found itself ---------------------------

for (const found of results.discovered ?? []) {
  if (!hasFields(found, ['company', 'url', 'score', 'verdict'], 'discovered entry')) continue;

  const item = {
    type: found.track === 'application' ? 'posting' : 'company',
    track: found.track === 'application' ? 'application' : 'outreach',
    company: found.company,
    title: found.title || 'no posted role, direct outreach',
    location: found.location ?? '',
    url: found.url,
    source: found.foundVia ? `search:${found.foundVia}` : 'search',
  };
  const id = opportunityId(item);

  recordCompany(kb, {
    name: item.company,
    url: item.url,
    whatTheyDo: found.whatTheyDo ?? '',
    source: item.source,
    signal: found.signal ? { kind: 'hiring-post', text: found.signal, url: found.url } : undefined,
  });

  if (isKnown(state, id)) {
    info(`already known, skipping: ${item.company}`);
    if (found.ref) refToId.set(found.ref, id);
    continue;
  }

  const passed = found.score >= config.targets.minScore && found.verdict !== 'skip';
  if (!passed) {
    dismiss(state, { ...item, id }, `scored ${found.score} (from search)`, found.score);
    report.dismissed += 1;
    continue;
  }

  state.tracked[id] = {
    id,
    track: item.track,
    type: item.type,
    source: item.source,
    company: item.company,
    title: item.title,
    location: item.location,
    url: item.url,
    signal: found.signal ?? '',
    firstSeen: new Date().toISOString(),
    status: 'queued',
    score: {
      value: found.score,
      verdict: found.verdict,
      reasons: found.reasons ?? [],
      redFlags: found.redFlags ?? [],
      hook: found.hook ?? '',
    },
    contacts: [],
    touches: [],
    notes: [],
  };
  if (found.ref) refToId.set(found.ref, id);
  report.discovered.push(state.tracked[id]);
  report.matched.push(state.tracked[id]);
  info(`found via search: ${item.company} (${found.score})`);
}

// ---- 2. drafts ------------------------------------------------------------

function writeDraftPack(item, draft) {
  // Outreach items carry a placeholder title, so leave it out of the folder name.
  const name =
    item.track === 'outreach'
      ? `${slug(item.company)}-${item.id}`
      : `${slug(item.company)}-${slug(item.title)}-${item.id}`;
  const dir = path.join(DRAFTS, name);
  fs.mkdirSync(dir, { recursive: true });

  const header = [
    `# ${item.company}${item.track === 'outreach' ? '' : ` — ${item.title}`}`,
    '',
    `- Track: ${item.track}`,
    `- Score: ${item.score?.value ?? '?'} (${item.score?.verdict ?? '?'})`,
    `- Link: ${item.url}`,
    `- Id: \`${item.id}\``,
    '',
    '',
  ].join('\n');

  const written = [];

  if (draft.contacts?.length) {
    fs.writeFileSync(
      path.join(dir, 'who-to-contact.md'),
      `${header}## Who to write to\n\n${draft.contacts
        .map((c) =>
          [
            `**${c.name || 'name not found'}** — ${c.role || 'role unknown'}`,
            c.email ? `- Email: ${c.email}` : '',
            c.linkedin ? `- LinkedIn: ${c.linkedin}` : '',
            c.twitter ? `- Twitter: ${c.twitter}` : '',
            c.source ? `- Found at: ${c.source}` : '',
            '',
          ]
            .filter(Boolean)
            .join('\n'),
        )
        .join('\n')}`,
    );
    written.push('who-to-contact.md');
  }

  if (draft.pitch) {
    fs.writeFileSync(
      path.join(dir, 'pitch.md'),
      [
        header,
        '## Cold email',
        '',
        draft.pitchSubject ? `**Subject:** ${draft.pitchSubject}\n` : '',
        draft.pitch,
        '',
        draft.outreachNote ? `## Shorter version, for LinkedIn or Twitter DM\n\n${draft.outreachNote}\n` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    );
    written.push('pitch.md');
  }

  if (draft.coverLetter) {
    fs.writeFileSync(
      path.join(dir, 'cover-letter.md'),
      `${header}## Cover letter\n\n${draft.coverLetter}\n`,
    );
    written.push('cover-letter.md');
  }

  if (draft.resumeBullets?.length) {
    fs.writeFileSync(
      path.join(dir, 'resume-bullets.md'),
      `${header}## Bullets tuned for this one\n\n${draft.resumeBullets.map((b) => `- ${b}`).join('\n')}\n`,
    );
    written.push('resume-bullets.md');
  }

  // The thing that makes an approach land: something already done for them,
  // attached, before anyone asked for it.
  if (draft.workSample?.body) {
    fs.writeFileSync(
      path.join(dir, 'work-sample.md'),
      `${header}## ${draft.workSample.title || 'Work sample'}\n\n${draft.workSample.body}\n`,
    );
    written.push('work-sample.md');
  }

  if (draft.screeningAnswers?.length || draft.followupAngles?.length) {
    fs.writeFileSync(
      path.join(dir, 'notes.md'),
      [
        header,
        draft.screeningAnswers?.length
          ? `## Likely form questions\n\n${draft.screeningAnswers
              .map((qa) => `**${qa.question}**\n\n${qa.answer}\n`)
              .join('\n')}`
          : '',
        draft.followupAngles?.length
          ? `## Follow-up angles\n\n${draft.followupAngles.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n`
          : '',
      ]
        .filter(Boolean)
        .join('\n'),
    );
    written.push('notes.md');
  }

  return { dir: path.relative(DRAFTS, dir), files: written };
}

for (const draft of results.drafts ?? []) {
  if (!hasFields(draft, ['angle'], 'draft entry')) continue;

  const id = draft.id ?? refToId.get(draft.ref);
  if (!id) {
    report.problems.push(`draft has neither a known id nor a resolvable ref (${draft.ref ?? 'none'})`);
    continue;
  }
  const item = state.tracked[id];
  if (!item) {
    report.problems.push(`draft for unknown id ${id}, ignored`);
    continue;
  }

  const hasSomething = draft.pitch || draft.coverLetter;
  if (!hasSomething) {
    report.problems.push(`draft for ${id} has neither a pitch nor a cover letter`);
    continue;
  }

  const { dir, files } = writeDraftPack(item, draft);
  item.status = 'drafted';
  item.contacts = draft.contacts ?? [];
  item.draft = {
    dir,
    files,
    angle: draft.angle,
    followupAngles: draft.followupAngles ?? [],
    hasWorkSample: Boolean(draft.workSample?.body),
    generatedAt: new Date().toISOString(),
  };
  report.drafted.push(item);
  info(`drafted ${dir} (${files.join(', ')})`);
}

// ---- 3. follow-ups --------------------------------------------------------

for (const touch of results.touches ?? []) {
  if (!hasFields(touch, ['id', 'touchNumber', 'body'], 'touch entry')) continue;

  const item = state.tracked[touch.id];
  if (!item) {
    report.problems.push(`follow-up for unknown id ${touch.id}, ignored`);
    continue;
  }

  const dir = path.join(DRAFTS, item.draft?.dir ?? `unfiled-${item.id}`);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `followup-${touch.touchNumber}.md`);

  fs.writeFileSync(
    file,
    [
      `# Follow-up ${touch.touchNumber} — ${item.company}`,
      '',
      `Sent the first message ${Math.floor((Date.now() - Date.parse(item.sentAt ?? Date.now())) / 86400000)} days ago. Id \`${item.id}\`.`,
      '',
      `## ${touch.channel === 'linkedin' ? 'LinkedIn message' : 'Email'}`,
      '',
      touch.subject ? `**Subject:** ${touch.subject}\n` : '',
      touch.body,
      '',
      touch.shortVersion ? `## Shorter version, other channel\n\n${touch.shortVersion}\n` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  );

  item.touches = [
    ...(item.touches ?? []),
    {
      n: touch.touchNumber,
      at: new Date().toISOString(),
      channel: touch.channel ?? 'email',
      subject: touch.subject ?? '',
      file: path.relative(DRAFTS, file),
    },
  ];
  report.touches.push({ item, ...touch });
  info(`follow-up ${touch.touchNumber} written for ${item.company}`);
}

// ---- 3b. knowledge the session picked up ---------------------------------

for (const entry of results.knowledge?.companies ?? []) {
  recordCompany(kb, entry);
}
for (const entry of results.knowledge?.people ?? []) {
  recordPerson(kb, entry);
}
for (const lesson of results.knowledge?.lessons ?? []) {
  recordLesson(kb, lesson);
}

// Contacts found while drafting are worth keeping even if she never writes back.
for (const item of report.drafted) {
  for (const contact of item.contacts ?? []) {
    recordPerson(kb, {
      name: contact.name,
      role: contact.role,
      company: item.company,
      publicEmail: contact.email,
      links: { linkedin: contact.linkedin, twitter: contact.twitter, source: contact.source },
    });
  }
}

/**
 * Reconcile angle outcomes. Idempotent: each item is counted once when it is
 * drafted and once more if it ever gets a reply, so the table stays honest
 * across reruns.
 */
for (const item of Object.values(state.tracked)) {
  const angle = item.draft?.angle;
  if (!angle) continue;
  if (!item.angleCounted) {
    recordAngle(kb, angle, 'used');
    item.angleCounted = true;
  }
  const replied = ['replied', 'interviewing', 'offer'].includes(item.status);
  if (replied && !item.angleRepliedCounted) {
    recordAngle(kb, angle, 'replied');
    item.angleRepliedCounted = true;
    recordCompany(kb, { name: item.company, status: 'replied' });
  }
  const exhausted =
    item.status === 'sent' && (item.touches ?? []).length >= 2 && !item.angleSilentCounted;
  if (exhausted) {
    recordAngle(kb, angle, 'silent');
    item.angleSilentCounted = true;
  }
}

saveKnowledge(kb);

// ---- 4. inbox housekeeping and the digest ---------------------------------

const resolved = results.inboxResolved ?? [];
if (resolved.length) {
  archiveUrls(resolved.map((r) => ({ url: r.url, note: r.note ?? '' })));
  info(`archived ${resolved.length} inbox URL(s)`);
}

state.runs.push({
  at: new Date().toISOString(),
  stage: 'apply',
  matched: report.matched.length,
  discovered: report.discovered.length,
  dismissed: report.dismissed,
  drafted: report.drafted.length,
  touches: report.touches.length,
  problems: report.problems.length,
});
saveState(state);

writeDigest(buildDigest({ state, report }));
fs.rmSync(RESULTS_FILE, { force: true });
fs.rmSync(path.join(WORK, 'brief.md'), { force: true });
fs.rmSync(ORDER_FILE, { force: true });

for (const problem of report.problems) warn(problem);
info(
  `applied: ${report.matched.length} tracked (${report.discovered.length} from search), ${report.dismissed} ruled out, ${report.drafted.length} drafted, ${report.touches.length} follow-ups`,
);
