import fs from 'node:fs';
import { CONFIG_FILE } from './paths.mjs';

let cached = null;

export function loadConfig() {
  if (cached) return cached;
  const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
  const config = JSON.parse(raw);

  // Env overrides, so a workflow_dispatch can tune a single run without a commit.
  if (process.env.MIN_SCORE) {
    config.targets.minScore = Number(process.env.MIN_SCORE);
  }
  if (process.env.MAX_DRAFTED) {
    config.targets.maxDraftedPerRun = Number(process.env.MAX_DRAFTED);
  }
  if (process.env.MAX_SCORED) {
    config.targets.maxScoredPerRun = Number(process.env.MAX_SCORED);
  }
  if (process.env.MODEL_ID) {
    config.model.id = process.env.MODEL_ID;
  }

  cached = config;
  return config;
}
