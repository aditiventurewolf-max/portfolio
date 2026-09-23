/**
 * The part of this system that compounds.
 *
 * Every run learns things that are worth more than that run's drafts: which
 * companies exist and what they are building, who the reachable person is, what
 * signal said they were hiring, and which pitch angles got answered. Without
 * somewhere to put that, run thirty knows exactly as much as run one.
 *
 * Kept as JSON for the code and rendered to markdown for a person.
 */
import fs from 'node:fs';
import path from 'node:path';
import { DATA } from './paths.mjs';

export const KNOWLEDGE_FILE = path.join(DATA, 'knowledge.json');
export const KNOWLEDGE_DOC = path.join(DATA, 'knowledge.md');

const EMPTY = {
  version: 1,
  updatedAt: null,
  companies: {},
  people: {},
  angles: {},
  lessons: [],
};

function slug(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export function loadKnowledge() {
  try {
    const loaded = JSON.parse(fs.readFileSync(KNOWLEDGE_FILE, 'utf8'));
    return { ...structuredClone(EMPTY), ...loaded };
  } catch {
    return structuredClone(EMPTY);
  }
}

export function saveKnowledge(kb) {
  kb.updatedAt = new Date().toISOString();
  kb.lessons = kb.lessons.slice(-120);
  fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(KNOWLEDGE_FILE, `${JSON.stringify(kb, null, 2)}\n`);
  fs.writeFileSync(KNOWLEDGE_DOC, render(kb));
}

const today = () => new Date().toISOString().slice(0, 10);

export function recordCompany(kb, entry) {
  if (!entry.name) return null;
  const key = slug(entry.name);
  const existing = kb.companies[key] ?? {
    name: entry.name,
    firstSeen: today(),
    sources: [],
    signals: [],
  };

  kb.companies[key] = {
    ...existing,
    name: entry.name,
    url: entry.url ?? existing.url ?? '',
    whatTheyDo: entry.whatTheyDo ?? existing.whatTheyDo ?? '',
    stage: entry.stage ?? existing.stage ?? '',
    teamSize: entry.teamSize ?? existing.teamSize ?? '',
    whySheFits: entry.whySheFits ?? existing.whySheFits ?? '',
    status: entry.status ?? existing.status ?? 'seen',
    sources: [...new Set([...(existing.sources ?? []), entry.source].filter(Boolean))],
    signals: entry.signal
      ? [
          ...(existing.signals ?? []),
          { at: today(), kind: entry.signal.kind ?? 'note', text: entry.signal.text ?? '', url: entry.signal.url ?? '' },
        ].slice(-12)
      : existing.signals ?? [],
    lastSeen: today(),
  };
  return key;
}

export function recordPerson(kb, entry) {
  if (!entry.name) return null;
  const key = slug(`${entry.company ?? ''}-${entry.name}`);
  const existing = kb.people[key] ?? { firstSeen: today() };
  kb.people[key] = {
    ...existing,
    name: entry.name,
    role: entry.role ?? existing.role ?? '',
    company: entry.company ?? existing.company ?? '',
    publicEmail: entry.publicEmail ?? existing.publicEmail ?? '',
    links: { ...(existing.links ?? {}), ...(entry.links ?? {}) },
    notes: entry.notes ?? existing.notes ?? '',
    lastSeen: today(),
  };
  return key;
}

/** Which pitch angles get answered. The only feedback signal that matters. */
export function recordAngle(kb, angle, outcome = 'used') {
  if (!angle) return;
  const key = slug(angle).slice(0, 48) || 'unnamed';
  const entry = (kb.angles[key] ??= { angle, used: 0, replied: 0, silent: 0 });
  entry.angle = angle;
  if (outcome === 'used') entry.used += 1;
  if (outcome === 'replied') entry.replied += 1;
  if (outcome === 'silent') entry.silent += 1;
}

export function recordLesson(kb, text) {
  if (!text) return;
  kb.lessons.push({ at: today(), text });
}

/** A compact digest of what is known, small enough to sit in every work order. */
export function knowledgeBrief(kb, limit = 25) {
  const companies = Object.values(kb.companies)
    .sort((a, b) => String(b.lastSeen).localeCompare(String(a.lastSeen)))
    .slice(0, limit);

  const angles = Object.values(kb.angles)
    .filter((a) => a.used > 0)
    .sort((a, b) => b.replied / (b.used || 1) - a.replied / (a.used || 1));

  return [
    `Known companies: ${Object.keys(kb.companies).length}. Known people: ${Object.keys(kb.people).length}.`,
    '',
    companies.length ? 'Most recently seen:' : 'No companies on file yet.',
    ...companies.map(
      (c) =>
        `- ${c.name}${c.stage ? ` (${c.stage})` : ''}${c.teamSize ? `, ${c.teamSize} people` : ''} — ${
          c.whatTheyDo || 'not described yet'
        }${c.status && c.status !== 'seen' ? ` [${c.status}]` : ''}`,
    ),
    '',
    angles.length ? 'Angle performance:' : 'No angle history yet.',
    ...angles.map((a) => `- ${a.replied}/${a.used} replied: ${a.angle}`),
    '',
    kb.lessons.length ? 'Lessons carried forward:' : '',
    ...kb.lessons.slice(-10).map((l) => `- ${l.at}: ${l.text}`),
  ]
    .filter((line) => line !== undefined)
    .join('\n');
}

function render(kb) {
  const companies = Object.values(kb.companies).sort((a, b) => a.name.localeCompare(b.name));
  const people = Object.values(kb.people).sort((a, b) =>
    String(a.company).localeCompare(String(b.company)),
  );
  const angles = Object.values(kb.angles).sort((a, b) => b.used - a.used);

  return [
    '# What the job agent knows',
    '',
    `Updated ${kb.updatedAt ?? 'never'}. Written by the agent, safe to edit by hand.`,
    '',
    `${companies.length} ${companies.length === 1 ? 'company' : 'companies'} · ${people.length} ${
      people.length === 1 ? 'person' : 'people'
    } · ${angles.length} pitch ${angles.length === 1 ? 'angle' : 'angles'} tried`,
    '',
    '## Companies',
    '',
    companies.length ? '' : '_Nothing yet._',
    ...companies.map((c) =>
      [
        `### ${c.name}`,
        '',
        c.url ? `- ${c.url}` : '',
        c.whatTheyDo ? `- What: ${c.whatTheyDo}` : '',
        c.stage || c.teamSize ? `- Stage: ${[c.stage, c.teamSize && `${c.teamSize} people`].filter(Boolean).join(', ')}` : '',
        c.whySheFits ? `- Why it fits: ${c.whySheFits}` : '',
        `- Status: ${c.status ?? 'seen'} · first seen ${c.firstSeen} · last seen ${c.lastSeen}`,
        c.sources?.length ? `- Found via: ${c.sources.join(', ')}` : '',
        c.signals?.length
          ? `- Signals:\n${c.signals.map((s) => `  - ${s.at} (${s.kind}): ${s.text}${s.url ? ` ${s.url}` : ''}`).join('\n')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n')
        .concat('\n'),
    ),
    '## People',
    '',
    people.length ? '' : '_Nothing yet._',
    ...people.map((p) =>
      [
        `- **${p.name}** — ${p.role || 'role unknown'}${p.company ? ` at ${p.company}` : ''}`,
        p.publicEmail ? `  - ${p.publicEmail}` : '',
        Object.entries(p.links ?? {}).length
          ? `  - ${Object.entries(p.links).map(([k, v]) => `${k}: ${v}`).join(' · ')}`
          : '',
        p.notes ? `  - ${p.notes}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    ),
    '',
    '## Pitch angles',
    '',
    angles.length ? '| replied / used | angle |\n| --- | --- |' : '_Nothing yet._',
    ...angles.map((a) => `| ${a.replied}/${a.used} | ${a.angle} |`),
    '',
    '## Lessons',
    '',
    kb.lessons.length ? '' : '_Nothing yet._',
    ...kb.lessons.slice().reverse().map((l) => `- **${l.at}** ${l.text}`),
    '',
  ].join('\n');
}
