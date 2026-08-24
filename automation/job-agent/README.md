# Job agent

Finds roles and companies, works out which are worth your time, drafts the
approach, and keeps the follow-up cadence going. Runs on a schedule in the
cloud. No laptop, no API key, no per-token cost.

Two things it does that a job board cannot:

- **Writes to people at companies that have not posted anything.** A company
  that launched this week is hiring before it posts, and nobody else is emailing
  them about a job.
- **Arrives with work already done.** Every cold pitch carries a work sample
  built for that specific company: their next ten posts, a spec for the feature
  they are missing, a teardown of their onboarding.

It never sends anything. It drafts, you read, you send.

## How a run works

```
prep      fetch every source, dedupe, filter, work out what follow-ups are due
          → data/work/brief.md                                          free
judge     the scheduled Claude session reads the brief, runs the post searches,
          researches companies, finds people, writes the drafts
          → data/work/results.json                    on your subscription
apply     validate, write the draft files, update state and the knowledge base
          → data/drafts/, data/digest.md                                free
```

The thinking happens inside a Claude Code session rather than an API call, which
is why there is nothing to pay per run and no key to manage. `RUNBOOK.md` is
what the session follows. `CONTEXT.md` explains why it is built this way.

## Setup

1. **Fill in `profile/resume.md`.** The bracketed parts are placeholders. Every
   draft is built only from what is in that file, so a thin resume means thin
   drafts. Twenty minutes here is worth more than any other change.
2. **Check `config.json`** — `targets.roles`, `dealBreakers`, `minScore`, and the
   `socialSearch` queries.
3. **Set up the schedule.** A Routine fires a fresh session every morning and
   points it at `RUNBOOK.md`. Ask Claude to set it up, or run it by hand any time
   by opening a session and saying "run the job agent runbook".

## Operating it from your phone

Everything is a file edit on github.com, which works fine in a mobile browser.

**Add a job or company you found anywhere** — LinkedIn, a WhatsApp forward, a
tweet: paste the URL under `## Pending` in `data/inbox.md`. The next run fetches
the page, works out what it is, scores it, and drafts the approach.

**Tell it what happened**: add lines under `## Pending` in `data/commands.md`.

```
sent a1b2c3d4e5          you sent it, starts the follow-up clock
replied a1b2c3d4e5       they answered, stops follow-ups
interviewing a1b2c3d4e5
rejected a1b2c3d4e5
skip a1b2c3d4e5          changed your mind
note a1b2c3d4e5 the founder replied from a different address
```

Ids come from the digest. Executed lines move themselves into `## Applied`.

## Where to look

| File | What it is |
|---|---|
| `data/digest.md` | The last run. What to send, who to write to, what is due. |
| `data/knowledge.md` | Every company and person found, and which pitch angles get answered. |
| `data/drafts/<company>/` | The actual drafts. `pitch.md`, `work-sample.md`, `cover-letter.md`, `who-to-contact.md`, `followup-N.md`. |
| `data/applications.json` | Machine state. Rarely needs reading. |

## What it reads

| Source | What it gives |
|---|---|
| Greenhouse, Lever, Ashby, Workable, Recruitee, SmartRecruiters | Posted roles at the companies in `config.json` |
| YC company API | Current-batch companies under 30 people, where the founder does the hiring |
| Launch HN | Companies that launched this week |
| HN "Who is hiring" | The current month's thread |
| Remotive | Remote roles |
| Web search for **posts** | LinkedIn, X, Instagram and YC job pages, via search rather than scraping |
| `data/inbox.md` | Anything you paste |

LinkedIn, X and Instagram have no usable API and block scraping, so the agent
does not pretend to fetch them. It searches for their publicly indexed *posts*
instead, aiming at hiring intent rather than job listings. Nothing ever logs in
as you.

Adding a company needs its ATS slug, not its website:

```bash
npm run probe -- supertails zepto wakefit
```

It tries every provider and caches the answer. Many Indian startups use Keka,
Darwinbox or Zoho Recruit, which expose no public API, so they come back empty
and go through the inbox instead.

## Running it by hand

```bash
npm run prep      # build the work order. free, no model.
npm run status    # what is in flight, what is due, reply rate.
npm run apply     # after results.json exists
```

Zero dependencies, so there is nothing to install. Node 20 or newer.

## What it will not do

It does not press submit and it does not send email. Auto-applying means sending
things in your name that you have not read, to people who remember it, and most
employers' terms prohibit it. It takes each approach from nothing to one read
away, which is where the hours actually went.

It never invents experience. If a posting wants something not in `resume.md`, the
drafts write around the gap rather than claiming it.
