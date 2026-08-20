# Job agent

Finds roles, scores them against your actual profile, drafts the application in
your voice, and runs the follow-up cadence. Runs on GitHub Actions once a day,
so nothing depends on a laptop being awake.

The old version lived in `job-apply-bot/`, which was in `.gitignore` and never
pushed. It died with the laptop. This one lives in the repo and runs in the cloud.

## How a day works

```
cron 08:17 IST
  │
  ├─ read commands.md          you said "applied a1b2c3d4e5" from your phone
  ├─ read inbox.md             you pasted a LinkedIn link from your phone
  │
  ├─ discover      ATS APIs + Remotive + HN "who is hiring" + your inbox
  ├─ local filter  title gates, free, cuts ~900 postings to ~250
  ├─ score         Claude reads each posting against resume.md, 0-100
  ├─ draft         cover letter, resume bullets, LinkedIn note, form answers
  ├─ follow up     anything applied and gone quiet gets the next touch drafted
  │
  └─ commit the state back, comment the digest on the control-panel issue
```

You get a GitHub notification with the digest. You open the drafts, edit what you
want, and send them. The agent does not submit applications for you. That is
deliberate, see "What it will not do".

## Setup

1. **Add the API key.** Repo → Settings → Secrets and variables → Actions → New
   repository secret, named `ANTHROPIC_API_KEY`.
2. **Merge this to `main`.** GitHub only fires `schedule` for workflows on the
   default branch, so the daily cron does not start until the workflow file is on
   `main`. Until then, run it by hand from the Actions tab.
3. **Fill in `profile/resume.md`.** The bracketed parts are placeholders. Every
   cover letter is built only from what is in that file, so a thin resume means
   thin letters. This is the highest-leverage thing you can spend twenty minutes on.
4. **Check `config.json`.** Especially `targets.roles`, `dealBreakers`, and
   `minScore`.

Then: Actions → Job agent → Run workflow. First run has a backlog, so set
`max_scored` to `250` once to clear it, then leave it at the default.

## Operating it from your phone

Everything is a file edit on github.com, which works fine in a mobile browser.

**Add a job you found anywhere** (LinkedIn, a WhatsApp forward, a tweet): paste
the URL under `## Pending` in `data/inbox.md`. Next run fetches the page, pulls
the posting out of it, scores it, and drafts the application. Or use the `url`
input on a manual run.

**Tell it what happened**: add a line under `## Pending` in `data/commands.md`.

```
applied a1b2c3d4e5          starts the follow-up clock
replied a1b2c3d4e5          they answered, stops follow-ups
interviewing a1b2c3d4e5
rejected a1b2c3d4e5
skip a1b2c3d4e5             changed your mind
note a1b2c3d4e5 recruiter said they reopen this in September
```

Job ids are in the digest. The agent moves executed lines into `## Applied` so
the file stays clean.

## What it reads

| Source | Coverage | Notes |
|---|---|---|
| Greenhouse, Lever, Ashby, Workable, Recruitee, SmartRecruiters | Whatever the companies in `config.json` post | Public JSON endpoints, no auth, no scraping |
| Remotive | Remote roles matching `feeds.remotive.searches` | Their terms want attribution and few calls a day, hence one daily run |
| HN "Ask HN: Who is hiring?" | The current month's thread | Filtered by keyword on word boundaries |
| Your inbox | Anything you paste | Claude extracts the posting from the page text |

Adding a company: you need its ATS slug, not its website. Find it with

```bash
npm run probe -- supertails zepto wakefit
```

It tries every provider, prints what it finds, and caches the answer in
`data/ats-map.json`. Many Indian startups use Keka, Darwinbox or Zoho Recruit,
which have no public read API, so they come back empty. Those go through the
inbox instead. That is not a gap in the code, it is what those vendors expose.

**On LinkedIn specifically:** LinkedIn does not allow automated scraping of job
pages, and signed-out fetches get an inconsistent partial page at best. So
LinkedIn is used the way it actually works: you paste a job link into the inbox,
and the agent handles everything after that. Outreach notes are drafted for you
to send from your own account. Nothing logs into LinkedIn as you.

## What it will not do

It does not press submit. Not because it can't, but because auto-submitting
applications means sending things in your name that you have not read, to people
who will remember it, and most employers' terms prohibit it anyway. The agent
takes the application from "nothing" to "one read and a paste away". That is
where the hours actually go.

It also never invents experience. If a posting wants something not in
`resume.md`, the prompt tells Claude to write around the gap using the closest
real thing, not to claim it.

## Cost

One Claude call per posting scored, one per application drafted, one per
follow-up. Scoring runs at `medium` effort, drafting at `high`. At the default 30
scored per day, expect roughly $15 to $25 a month on `claude-opus-5`.

Turn it down by lowering `targets.maxScoredPerRun`, setting
`model.scoringEffort` to `low`, or tightening `includeTitleKeywords` so fewer
postings reach the model at all. The local title gate is free and does most of
the work: last test run it cut 915 postings to 246 before any API call.

## Files

```
config.json              who you are, what you want, where to look
profile/resume.md        every fact the agent is allowed to use
profile/voice.md         how anything sent as you must sound
data/applications.json   tracked pipeline + a compact record of what was ruled out
data/ats-map.json        which board each company slug lives on, cached
data/inbox.md            paste job URLs here
data/commands.md         tell it what happened
data/digest.md           last run's report
data/drafts/<job>/       cover-letter.md, resume-bullets.md, outreach.md, followup-N.md
```

## Running it locally

```bash
npm install
ANTHROPIC_API_KEY=sk-... npm run all
```

Without a key it runs in dry-run: discovery and the local filters work, nothing
is scored or drafted, and nothing is written to state. Useful for checking a new
company slug or keyword list before spending anything.

```bash
npm run discover     # find, score, draft
npm run followup     # only the follow-up cadence
npm run all          # both
```
