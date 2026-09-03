import fs from 'node:fs';
import crypto from 'node:crypto';
import { STATE_FILE, ATS_MAP_FILE, DATA } from './paths.mjs';

const EMPTY = { version: 2, updatedAt: null, runs: [], tracked: {}, dismissed: {} };
const DISMISSED_TTL_DAYS = 180;

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return structuredClone(fallback);
  }
}

function writeJson(file, value) {
  fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

export function loadState() {
  const state = readJson(STATE_FILE, EMPTY);
  // v1 tracked advertised postings only, under `jobs`.
  if (state.jobs && !state.tracked) {
    state.tracked = state.jobs;
    for (const item of Object.values(state.tracked)) {
      item.track ??= 'application';
      if (item.appliedAt && !item.sentAt) item.sentAt = item.appliedAt;
      if (item.status === 'applied') item.status = 'sent';
    }
    delete state.jobs;
  }
  state.version = 2;
  state.tracked ??= {};
  state.dismissed ??= {};
  state.runs ??= [];
  return state;
}

export function saveState(state) {
  state.updatedAt = new Date().toISOString();
  for (const [id, entry] of Object.entries(state.dismissed)) {
    if (daysSince(entry.at) > DISMISSED_TTL_DAYS) delete state.dismissed[id];
  }
  state.runs = state.runs.slice(-40);
  writeJson(STATE_FILE, state);
}

export function loadAtsMap() {
  return readJson(ATS_MAP_FILE, {});
}

export function saveAtsMap(map) {
  writeJson(ATS_MAP_FILE, map);
}

/**
 * Stable id. Deliberately excludes the ATS numeric id, so a role reposted under
 * a new requisition is recognised as the same role rather than as new work.
 */
export function opportunityId({ company, title, location, type }) {
  const key = [type ?? 'posting', company, title, location]
    .map((part) => String(part ?? '').toLowerCase().replace(/\s+/g, ' ').trim())
    .join('|');
  return crypto.createHash('sha1').update(key).digest('hex').slice(0, 10);
}

/** Ruled out, remembered compactly so it is never refetched and rejudged. */
export function dismiss(state, item, reason, score = null) {
  state.dismissed[item.id] = {
    t: item.title,
    c: item.company,
    r: reason,
    at: new Date().toISOString().slice(0, 10),
    ...(score === null ? {} : { s: score }),
  };
}

export function isKnown(state, id) {
  return Boolean(state.tracked[id] || state.dismissed[id]);
}

export function daysSince(iso) {
  if (!iso) return Infinity;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return Infinity;
  return (Date.now() - then) / 86400000;
}
