import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from './lib/config.mjs';
import { PROFILE, DRAFTS } from './lib/paths.mjs';
import { loadState, saveState, jobId, dismiss, isKnown } from './lib/store.mjs';
import { LLM_ENABLED, usageReport } from './lib/claude.mjs';
import { info, warn, error, summary, flushStepSummary } from './lib/log.mjs';
import { discoverPostings, hydrate } from './sources/index.mjs';
import { prefilter, scoreJob } from './stages/score.mjs';
import { tailorJob } from './stages/tailor.mjs';
import { dueFollowups, writeFollowup } from './stages/followup.mjs';
import { applyCommands } from './stages/commands.mjs';
import { buildDigest, writeDigest, postDigestIssue } from './stages/digest.mjs';

const config = loadConfig();
const resume = fs.readFileSync(path.join(PROFILE, 'resume.md'), 'utf8');
const voice = fs.readFileSync(path.join(PROFILE, 'voice.md'), 'utf8');

const report = {
  scanned: 0,
  newJobs: 0,
  scored: 0,
  drafted: 0,
  matched: [],
  nearMisses: [],
  followups: [],
  problems: [],
};

/** Inbox items first (she queued them by hand), then freshest postings. */
function priority(a, b) {
  const rank = (job) => (job.source === 'inbox' ? 0 : job.source.startsWith('ats') ? 1 : 2);
  if (rank(a) !== rank(b)) return rank(a) - rank(b);
  return Date.parse(b.postedAt ?? 0) - Date.parse(a.postedAt ?? 0) || 0;
}

async function discover(state) {
  const postings = await discoverPostings(config);
  report.scanned = postings.length;

  // Collapse duplicates within the run, then drop anything already decided on.
  const seen = new Map();
  for (const posting of postings) {
    if (!posting.title || !posting.url) continue;
    const id = jobId(posting);
    if (!seen.has(id)) seen.set(id, { ...posting, id });
  }

  const fresh = [...seen.values()].filter((posting) => !isKnown(state, posting.id));
  report.newJobs = fresh.length;
  info(`${fresh.length} postings are new`);
  fresh.sort(priority);

  const budget = config.targets.maxScoredPerRun;
  let scored = 0;
  let skippedForBudget = 0;

  for (const posting of fresh) {
    let job = posting;
    if (!job.description && job.detailRef) {
      job = await hydrate(job);
    }

    const gate = prefilter(job, config.targets);
    if (!gate.keep) {
      dismiss(state, job, gate.reason);
      continue;
    }

    // Over budget or no key: leave it undecided so the next run picks it up.
    if (scored >= budget) {
      skippedForBudget += 1;
      continue;
    }
    if (!LLM_ENABLED) {
      skippedForBudget += 1;
      continue;
    }

    const score = await scoreJob(job, { config, resume });
    scored += 1;
    if (!score) {
      report.problems.push(`could not score ${job.company} / ${job.title}`);
      continue;
    }

    const scoreRecord = {
      value: score.score,
      verdict: score.verdict,
      reasons: score.reasons,
      redFlags: score.redFlags,
      hook: score.hook,
      scoredAt: new Date().toISOString(),
    };

    const matched = score.score >= config.targets.minScore && score.verdict !== 'skip';

    if (!matched) {
      dismiss(state, job, `scored ${score.score}`, score.score);
      if (score.score >= config.targets.minScore - 12) {
        report.nearMisses.push({ ...job, score: scoreRecord });
      }
      continue;
    }

    state.jobs[job.id] = {
      id: job.id,
      source: job.source,
      provider: job.provider,
      company: job.company,
      title: job.title,
      location: job.location,
      url: job.url,
      postedAt: job.postedAt,
      firstSeen: new Date().toISOString(),
      status: 'matched',
      score: scoreRecord,
      touches: [],
      notes: [],
    };
    report.matched.push({ ...job, score: scoreRecord });
  }

  report.scored = scored;
  if (skippedForBudget) {
    const why = LLM_ENABLED ? `over the ${budget}/run scoring budget` : 'no API key';
    report.problems.push(
      `${skippedForBudget} postings passed the local filter but were not scored (${why}). They stay queued for the next run.`,
    );
  }

  // Draft applications for the strongest matches.
  const toDraft = report.matched
    .sort((a, b) => b.score.value - a.score.value)
    .slice(0, config.targets.maxDraftedPerRun);

  for (const job of toDraft) {
    if (!LLM_ENABLED) break;
    const drafts = await tailorJob(job, { config, resume, voice });
    if (!drafts) {
      report.problems.push(`could not draft ${job.company} / ${job.title}`);
      continue;
    }
    const stored = state.jobs[job.id];
    stored.status = 'drafted';
    stored.drafts = { ...drafts, generatedAt: new Date().toISOString() };
    job.drafts = stored.drafts;
    report.drafted += 1;
  }
}

async function followups(state) {
  const due = dueFollowups(state, config);
  info(`${due.length} follow-up(s) due`);

  for (const item of due) {
    if (!LLM_ENABLED) break;
    const written = await writeFollowup(item, { config, resume, voice });
    if (!written) {
      report.problems.push(`could not draft follow-up for ${item.job.company}`);
      continue;
    }
    const stored = state.jobs[item.job.id];
    stored.touches = [
      ...(stored.touches ?? []),
      {
        n: item.touchNumber,
        at: new Date().toISOString(),
        subject: written.subject,
        file: written.file,
      },
    ];
    report.followups.push({ ...item, ...written });
  }
}

async function main() {
  const mode = process.argv[2] ?? 'all';
  info(`mode: ${mode}, model: ${config.model.id}, llm: ${LLM_ENABLED ? 'on' : 'dry-run'}`);
  if (!LLM_ENABLED) {
    report.problems.push('ANTHROPIC_API_KEY is not set, so nothing was scored or drafted.');
  }

  fs.mkdirSync(DRAFTS, { recursive: true });
  const state = loadState();

  const commands = applyCommands(state, process.env.AGENT_COMMANDS ?? '');
  if (commands.failed.length) {
    report.problems.push(`unrecognised commands: ${commands.failed.join(', ')}`);
  }

  if (mode === 'discover' || mode === 'all') await discover(state);
  if (mode === 'followup' || mode === 'all') await followups(state);

  const usage = usageReport();
  state.runs.push({
    at: new Date().toISOString(),
    mode,
    scanned: report.scanned,
    newJobs: report.newJobs,
    scored: report.scored,
    drafted: report.drafted,
    followups: report.followups.length,
    usage,
  });
  saveState(state);

  const digest = buildDigest({ state, report, usage });
  writeDigest(digest);
  summary(digest);
  flushStepSummary();
  await postDigestIssue(digest);

  info('done');
}

main().catch((err) => {
  error(err.stack ?? err.message);
  process.exitCode = 1;
});
