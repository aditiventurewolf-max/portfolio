# Context

What this is, why it is built this way, and what was tried and rejected. Read
this before changing anything. `RUNBOOK.md` is the operating procedure,
`README.md` is the user-facing manual, this is the reasoning behind both.

Last updated 2026-08-24.

## The problem

Adi is job hunting. The first version of this lived in `job-apply-bot/` on her
laptop, which was in `.gitignore` and never pushed, so when the laptop died the
whole thing died with it. Nothing was recoverable. That is the origin of two
hard rules here: the system lives in the repo, and it does not depend on any one
machine being awake.

## Three constraints that shaped everything

1. **No running cost.** No metered API. This is why there is no
   `@anthropic-ai/sdk` and no `ANTHROPIC_API_KEY` anywhere in the project.
2. **Runs without her.** It fires on a schedule and produces work she can act on
   from a phone.
3. **Nothing gets sent automatically.** It drafts. She sends.

## How the no-cost constraint is met

The run is split in three, and only the middle part needs a model:

```
npm run prep     deterministic. fetch, dedupe, filter, cadence maths.  free.
   ↓ data/work/brief.md
[ judgement ]    done by the Claude Code session that is running this.
   ↓ data/work/results.json
npm run apply    deterministic. validate, write drafts, update state.   free.
```

The scheduled runtime is a **Claude Code session**, not a script calling an API.
The session *is* the model, billed to her subscription rather than per token.
`prep` hands it a work order; it thinks; `apply` lands the result.

This was a rewrite, not the original design. v1 called the Messages API from
Node with a key in GitHub Actions secrets, at an estimated $15-25/month. v2
deleted that. Two things turned out better as a side effect:

- The session has **web search and page fetch**, so it can actually research a
  company and find a named person. The API version could not.
- No secret to manage, no lockfile, no `npm ci`. Zero dependencies.

The cost is that a run needs a session, so the schedule is a Routine rather than
a cron in CI.

## What Backdoor AI taught us

Researched 2026-08-24. Backdoor (backdoorai.app, $8/week) does startup job
outreach over text. Its model is deliberately the opposite of a job board, and
the parts worth stealing:

| What they do | What we changed |
|---|---|
| Skip the application queue, cold-email founders directly | Added the **outreach track**. A company with no posted role is now a first-class opportunity, not a miss. |
| 10 researched approaches a day, not hundreds | `postingsPerRun: 8`, `companiesPerRun: 4`. The free filter exists to protect that budget. |
| Contact founders and team leads, never HR | Written into the runbook as a rule. `careers@` is explicitly banned. |
| The pitch carries a work sample: "vibecode the feature", "write their next 10 posts" | `workSample` in the draft pack. This is the single biggest change, and the thing most job tools do not do. |
| Follow up every ~3 days, 4 touches | Outreach cadence is 3/6/10/14. Applications stay slow at 4/11/21, because a hiring queue does not move faster for being nudged. |
| Explicitly ask them to decline if not interested | In the runbook for both first contact and follow-ups. |
| Every reply and every silence feeds back | `data/knowledge.json` tracks angle → replied/silent, and every work order opens with what has worked. |
| Sources are launches and funding, not job boards | Added Launch HN and the YC company API. A company that launched this week is hiring before it posts. |

Their own playbook post argues for 8-12 target companies, researched deeply,
with a concrete work sample attached. That is now the shape of the outreach
track.

## The two tracks

**Application track.** An advertised role. She is one of hundreds. Draft pack is
a cover letter plus resume bullets tuned to the posting. Slow follow-up cadence.
Lower expected return, still worth doing.

**Outreach track.** A company with nothing posted, found via a launch, the YC
batch list, or a hiring post. Nobody else is writing to them about a job. Draft
pack is a cold pitch, a named contact, and a work sample. Fast cadence. This is
where the returns are.

## Sources, and what does not work

Working, free, no auth:

- **ATS APIs** — Greenhouse, Lever, Ashby, Workable, Recruitee, SmartRecruiters.
  Provider is auto-detected per company slug and cached in `data/ats-map.json`.
  8 of 15 seed slugs resolved; the rest have no public board.
- **YC company API** (`api.ycombinator.com/v0.1/companies`) — filtered to teams
  under 30, because that is where the founder is the hiring manager. ~400
  companies across two batches. No jobs endpoint exists, only companies.
- **Launch HN** via the HN Algolia API — companies launching this week.
- **HN "Who is hiring"** — current month's thread.
- **Remotive** — their terms ask for attribution and few calls a day, hence one
  daily run.

Tried and does not work from this environment:

- **Bluesky** `searchPosts` returns 403. Their anti-bot, not our policy.
- **Reddit** JSON returns 403. Datacenter IP block.
- **Mastodon** public search needs a token for statuses.
- **Work at a Startup** has no public API; `api.workatastartup.com` is denied at
  the egress proxy.
- **Keka, Darwinbox, Zoho Recruit** — no public read API. This is why several
  Indian startups (Supertails, Zepto, PhysicsWallah, Cuemath) cannot be polled
  and have to come in through the inbox.

**LinkedIn, X and Instagram have no usable API and block scraping.** So they are
not fetched. Instead `prep` writes a rotating plan of web-search queries aimed
at *posts* rather than job listings, and the session runs them with its own
search tool. 54 queries in the space, 14 a run, full coverage in about four
days. Hiring intent shows up in a post days before it shows up on a board, and
often instead of ever showing up on one.

## Knowledge base

`data/knowledge.json`, rendered to `data/knowledge.md`. Companies, people, pitch
angles with reply rates, and lessons. Every run reads a digest of it and writes
back. Without this, run thirty knows exactly what run one knew, and the research
cost is paid again every time. Angle outcomes are reconciled idempotently in
`apply`, so the reply-rate table stays honest across reruns.

## Things that bit us, kept as tests

- **Excluding the word "manager" killed every Product Manager role.** The
  exclude list now names specific manager flavours instead.
- **Recency sorting gave Anthropic all eight posting slots**, because it has 483
  postings with the freshest timestamps. `pick()` now round-robins across
  companies, two at a time.
- **Substring keyword matching**: "ai" matched "said" and "available", turning
  the whole HN thread into false positives. Everything is word-boundary matched.
- **A dry run used to write every survivor into state**, which meant the next
  real run treated them as already seen and never scored them. Nothing is
  persisted now until there is a decision.
- **Documentation inside `commands.md` parsed as commands.** Only the `## Pending`
  section is executable, fenced blocks are skipped, and ids must be 10 hex chars.

## Verified vs assumed

Verified against live systems: all six ATS providers, the YC API, Launch HN, HN
hiring, Remotive, the full `prep` run (1478 items → 701 after filters → 12
queued), the `apply` ingest path with a realistic results file, ref resolution
for session-discovered companies, draft pack writing, the knowledge base, and
both cadence tracks (outreach fires day 3, application day 4, replies stop it).

Not yet verified: a real end-to-end run where a live session does the judging.
Everything downstream of that is tested, but the quality of the actual pitches
and work samples is unproven until it runs once for real.

## Open items

- `profile/resume.md` still has bracketed placeholders for her Bounce role,
  dates and numbers. Every draft is built only from that file, so this is the
  highest-leverage thing left and it needs her.
- Reply detection is manual (`replied <id>` in `commands.md`). The Gmail
  connector could close this loop automatically, and the runbook is the place to
  put it.
- The 701 postings that pass the free filter drain at 8 a day, newest first, so
  older survivors may never be reached. Deliberate: freshness matters more than
  completeness in a job hunt.
