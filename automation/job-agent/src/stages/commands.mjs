import fs from 'node:fs';
import { COMMANDS_FILE } from '../lib/paths.mjs';
import { info, warn } from '../lib/log.mjs';

const VERBS = new Set([
  'applied',
  'replied',
  'interviewing',
  'offer',
  'rejected',
  'closed',
  'skip',
  'note',
]);

const STATUS_VERBS = new Set([
  'applied',
  'replied',
  'interviewing',
  'offer',
  'rejected',
  'closed',
]);

function parseLine(line) {
  const cleaned = line.replace(/^[-*+]\s*/, '').trim();
  if (!cleaned || cleaned.startsWith('#') || cleaned.startsWith('>')) return null;
  const [verbRaw, idRaw, ...rest] = cleaned.split(/\s+/);
  const verb = (verbRaw ?? '').toLowerCase();
  if (!VERBS.has(verb)) return null;
  const id = (idRaw ?? '').replace(/[`,]/g, '');
  // Job ids are 10 hex characters. Anything else is documentation, not a command.
  if (!/^[0-9a-f]{10}$/.test(id)) return null;
  return { verb, id, text: rest.join(' ') };
}

/**
 * Only the "## Pending" block is executable. Everything else in the file is
 * instructions or history, and fenced blocks are examples.
 */
export function pendingSection(text) {
  const match = /^##\s*Pending\s*$([\s\S]*?)(?=^##\s|\Z)/im.exec(text);
  const body = match ? match[1] : '';
  return body.replace(/```[\s\S]*?```/g, '');
}

/**
 * Apply status updates written by hand into data/commands.md, or passed in
 * through a workflow_dispatch input. One command per line:
 *
 *   applied a1b2c3d4e5
 *   rejected a1b2c3d4e5
 *   note a1b2c3d4e5 recruiter said they are hiring again in September
 */
export function applyCommands(state, extraText = '') {
  const fileText = fs.existsSync(COMMANDS_FILE) ? fs.readFileSync(COMMANDS_FILE, 'utf8') : '';
  const lines = [...pendingSection(fileText).split('\n'), ...extraText.split('\n')];

  const applied = [];
  const failed = [];

  for (const line of lines) {
    const command = parseLine(line);
    if (!command) continue;

    const job = state.jobs[command.id];
    if (!job) {
      warn(`command "${line.trim()}" refers to unknown job id ${command.id}`);
      failed.push(line.trim());
      continue;
    }

    if (command.verb === 'note') {
      job.notes = [...(job.notes ?? []), { at: new Date().toISOString(), text: command.text }];
    } else if (command.verb === 'skip') {
      job.status = 'closed';
      job.closedReason = command.text || 'skipped by hand';
    } else if (STATUS_VERBS.has(command.verb)) {
      job.status = command.verb;
      if (command.verb === 'applied' && !job.appliedAt) {
        job.appliedAt = new Date().toISOString();
      }
      if (command.text) {
        job.notes = [...(job.notes ?? []), { at: new Date().toISOString(), text: command.text }];
      }
    }

    applied.push(`${command.verb} ${command.id}`);
    info(`command applied: ${command.verb} ${command.id} -> ${job.company} / ${job.title}`);
  }

  if (applied.length && fileText) {
    rewriteCommandsFile(fileText, applied, failed);
  }
  return { applied, failed };
}

function rewriteCommandsFile(fileText, applied, failed) {
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

  // Drop executed lines from Pending, keep anything that failed so it stays visible.
  const nextPending = pendingSection(fileText)
    .split('\n')
    .filter((line) => {
      const command = parseLine(line);
      if (!command) return true;
      return failed.includes(line.trim());
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const historyLines = applied.map((entry) => `- ${stamp} ${entry}`).join('\n');

  let next = fileText.replace(
    /^##\s*Pending\s*$([\s\S]*?)(?=^##\s|\Z)/im,
    `## Pending\n\n${nextPending}${nextPending ? '\n' : ''}\n`,
  );
  next = next.replace(/^##\s*Applied\s*$/im, `## Applied\n\n${historyLines}`);

  fs.writeFileSync(COMMANDS_FILE, next);
}
