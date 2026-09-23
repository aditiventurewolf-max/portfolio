import fs from 'node:fs';

const lines = [];

function stamp() {
  return new Date().toISOString().slice(11, 19);
}

export function info(...args) {
  console.log(`[${stamp()}]`, ...args);
}

export function warn(...args) {
  console.warn(`[${stamp()}] WARN`, ...args);
}

export function error(...args) {
  console.error(`[${stamp()}] ERROR`, ...args);
}

/** Queue a markdown line for the run digest and the GitHub step summary. */
export function summary(line = '') {
  lines.push(line);
}

export function summaryText() {
  return lines.join('\n');
}

/** Append the collected summary to $GITHUB_STEP_SUMMARY when running in Actions. */
export function flushStepSummary() {
  const target = process.env.GITHUB_STEP_SUMMARY;
  if (!target) return;
  try {
    fs.appendFileSync(target, `${summaryText()}\n`);
  } catch (err) {
    warn('could not write step summary:', err.message);
  }
}
