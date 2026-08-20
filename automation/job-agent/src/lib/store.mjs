import fs from 'node:fs';
import crypto from 'node:crypto';
import { STATE_FILE, ATS_MAP_FILE, DATA } from './paths.mjs';

const EMPTY = { version: 1, updatedAt: null, runs: [], jobs: {}, dismissed: {} };

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
  state.jobs ??= {};
  state.dismissed ??= {};
  state.runs ??= [];
  return state;
}

const DISMISSED_TTL_DAYS = 180;

/**
 * Postings that did not make the cut are remembered compactly, so they are not
 * refetched and rescored every day, without bloating the tracked pipeline.
 */
export function dismiss(state, job, reason, score = null) {
  state.dismissed[job.id] = {
    t: job.title,
    c: job.company,
    r: reason,
    at: new Date().toISOString().slice(0, 10),
    ...(score === null ? {} : { s: score }),
  };
}

export function isKnown(state, id) {
  return Boolean(state.jobs[id] || state.dismissed[id]);
}

function pruneDismissed(state) {
  for (const [id, entry] of Object.entries(state.dismissed)) {
    if (daysSince(entry.at) > DISMISSED_TTL_DAYS) delete state.dismissed[id];
  }
}

export function saveState(state) {
  state.updatedAt = new Date().toISOString();
  pruneDismissed(state);
  // Keep the run log bounded so the committed file stays readable.
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
 * Stable id for a posting. Deliberately excludes the ATS numeric id so a role
 * that gets reposted under a new requisition does not show up as brand new.
 */
export function jobId({ company, title, location }) {
  const key = [company, title, location]
    .map((part) => String(part ?? '').toLowerCase().replace(/\s+/g, ' ').trim())
    .join('|');
  return crypto.createHash('sha1').update(key).digest('hex').slice(0, 10);
}

export function daysSince(iso) {
  if (!iso) return Infinity;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return Infinity;
  return (Date.now() - then) / 86400000;
}

export const OPEN_STATUSES = new Set(['new', 'matched', 'drafted', 'applied']);
