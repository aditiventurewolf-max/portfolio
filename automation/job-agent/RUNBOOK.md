# Runbook

You are running Adi's job search for today. Work through this top to bottom.
Nothing here costs API money: you are the model, running inside a scheduled
Claude Code session on her subscription.

You draft. You never send. Every message you write is read by her first.

---

## 0. Get set up

```bash
cd /home/user/portfolio || cd "$(git rev-parse --show-toplevel)"
git fetch origin
git checkout claude/job-app-cloud-automation-qrsphi 2>/dev/null || git checkout main
git pull --rebase origin "$(git branch --show-current)" || true
cd automation/job-agent
```

## 1. Build the work order

```bash
npm run prep
```

Free, no model involved. It hits every source, drops what has already been
decided, applies the keyword filters, and works out which follow-ups are due.

Then read, in this order:

1. `profile/resume.md` — the only facts you are allowed to use
2. `profile/voice.md` — how anything sent as her must sound
3. `profile/work-samples.md` — which artifact to build for which kind of role and
   company, and what each one is anchored to in her actual history
4. `data/work/brief.md` — today's work, the searches to run, what is already
   known, and which pitch angles have been getting replies

If the brief says nothing to judge and no follow-ups due, skip to step 6.

## 1b. Run the post searches

The brief lists about fourteen web searches, rotated daily. Run every one with
web search.

These are aimed at **posts, not job listings**. LinkedIn, X and Instagram have no
usable API and block scraping, so search is the only way in, and their posts are
where hiring intent shows up first. A founder writing "hiring our first content
person, DM me" is a better lead than any board, because the poster is the contact
and there is no queue.

For each promising hit: fetch the page, work out the company, and check it is
real and recent. A hiring post from eight months ago is not a lead.

Turn each one worth pursuing into a `discovered` entry (schema in step 6). Give
each a `ref` of your own choosing so you can attach a draft to it in the same
run. Score them the same way you score everything else. Most hits will be noise,
recruiters, or listings dressed up as posts. Discard those without comment.

Two or three real leads from fourteen searches is a good run. Do not pad it.

## 2. Judge each item

Score 0-100 on fit for *her*, not on how good the company is. Be strict: this
is the filter protecting her time. Anything at or above 68 goes forward.

- Seniority mismatch, wrong function, or a dealbreaker from `config.json` is a
  low score no matter how appealing the company.
- Judge only from the posting text and her resume. Never assume experience that
  is not written down.
- `hook` is the single most specific overlap between what she has actually built
  and what they need, in one sentence. It becomes the opening line, so make it
  concrete or leave it empty.
- Items marked **needs extraction** came from the inbox as raw page text. Work
  out whether it is a single job posting. If it is not (a search page, a login
  wall, a company homepage), set `isJobPosting: false` and move on.

Two kinds of item come through, and they are judged differently.

**POSTING** — an advertised role. She is one of hundreds of applicants. Worth
doing, lower expected return.

**COMPANY (no posted role)** — a company that just launched or just raised, with
nothing posted. Nobody else is writing to them about a job. Score these on
whether the company is a genuine fit and whether there is plausibly work for her
there, not on whether they advertised it. A small team with no recruiting
function is a *higher* score, not a lower one, because the founder reads their
own email.

## 3. Research before drafting, for the outreach track

For every COMPANY item that passed, and for POSTING items at small companies, do
the research first. This is the part that makes the difference, and it is the
part you can do that a metered script could not.

Use WebSearch and WebFetch:

- Read their actual site and product. What does it do, who for, what stage.
- Find **a person, not a form**. Founder, co-founder, or the lead of the function
  she would join. Never HR, never a careers@ address.
- Get their name, role, and whatever public contact exists: personal site,
  LinkedIn, Twitter/X, a talk, a blog. If a work email is published, use it. If
  it is not, do not guess an address into the `email` field — leave it empty and
  put where to reach them in `source`.
- Find something recent and specific: a launch, a changelog, a blog post, a
  founder's thread about a problem they have.

## 4. Draft

### For the outreach track: cold pitch plus a work sample

The structure that works, in order:

1. Three very short bullets, maximum, about her and what she has built.
2. One sentence pointing at the relevant proof: an approved sample if one fits,
   otherwise the single most relevant number from her resume.
3. A single ask for a conversation, and an explicit invitation to say no.

That second part is the whole thing. But you do **not** invent it.

### The rule: never attach an unapproved sample

Work samples come from the library in `samples/`, and only ones she has approved
can be attached. Read `samples/README.md` and `samples/index.json`.

```
samples/approved/   she has signed these off. These, and only these, attach.
samples/drafts/     written but not yet approved. Never attach.
samples/templates/  approved structures with company-specific slots. Filling one
                    produces a DRAFT for her, never an attachment.
samples/proposed/   your suggestions for new samples. Never attach.
```

You may write into `samples/proposed/` and into a draft folder. You must never
write into `samples/approved/` or change a `status` field in `index.json`.

### How to pick

1. Diagnose what the company visibly needs, using the method in
   `profile/work-samples.md`: their last few changelog entries or posts, the
   posting's own repeated language, complaints in their launch thread, reviews.
2. Match that against `forRequirements`, `forVerticals` and `forStages` in
   `samples/index.json`.
3. If an **approved** sample matches, attach it and use its "what to say when
   attaching it" line, adapted to the company.
4. If only a **template** matches, fill it and put the filled copy in the draft
   pack as `work-sample-DRAFT.md`. Say clearly in the digest that it needs her
   approval before the email goes.
5. If **nothing** matches, send the pitch with no sample. This is fine. Her own
   cold emails already work without one. Then write a short note into
   `samples/proposed/` saying what would have fitted and why.

A missing sample costs less than a wrong one, and far less than one she has not
read going out under her name.

### Reporting it

In `results.json`, set `workSample.sourceId` to the sample's id from the index
and `workSample.status` to `approved`, `draft` or `none`. Do not paste approved
sample text into `results.json`, just reference it by id. Only a filled template
carries a body.

Also write `followupAngles`: one specific new thing for each later touch, so
touch two and three add something instead of nudging.

### For the application track: cover letter plus bullets

Cover letter is 150 to 220 words, three short paragraphs at most, in her voice,
landing on one clear ask. Reorder and reword bullets from her resume for this
posting. Facts must already exist in `resume.md`. If the posting wants something
she does not have, write around the gap with the closest real thing. Never claim
it, and never apologise for it.

Then find a human anyway. An application in the queue plus a short note to a real
person beats the application alone.

### Both tracks

- Read `profile/voice.md` and follow it exactly. No em dashes. No "thrilled to",
  no "passionate about", no "I would be a great fit". Plain words, short
  sentences, concrete objects instead of abstract skills.
- `angle` is a one-line description of the pitch you chose. It feeds the
  learning loop, so make it specific enough to compare later.

## 5. Follow-ups

**First, check for replies.** If a Gmail connector is available, search her mail
for responses on any thread to a company listed in the brief's follow-up section.
A reply changes everything:

- Stop that company's sequence immediately. Do not draft the next touch.
- Put it at the top of your final summary. A real reply is the whole point of
  this and it must not sit unseen.
- Do not draft a response to an offer, a salary question, or anything needing a
  decision. That is hers.
- Record it as a `note` in the knowledge lessons, and tell her to add
  `replied <id>` to `commands.md`.

If no Gmail is connected, skip this and rely on her marking replies by hand.

For each due touch in the brief that has not had a reply:

- Under 90 words. Shorter each time.
- It must add something. Never write a message whose only content is that time
  has passed. Use the planned angle from the brief.
- Never sound wounded. Never apologise for following up. Never re-ask for the
  same thing.
- On the last touch, close the loop cleanly and say you will stop.
- Ask them to tell you if it is a no. It raises the reply rate and it clears the
  pipeline.

Look at "What has worked so far" in the brief before writing. If an angle got a
reply, use more of that. If an angle went silent twice, stop using it.

## 6. Write the results and land them

Write `data/work/results.json`. Every field that appears here is optional except
where noted, but ids must match the brief exactly.

```json
{
  "judged": [
    {
      "id": "a1b2c3d4e5",
      "score": 82,
      "verdict": "apply",
      "reasons": ["..."],
      "redFlags": ["..."],
      "hook": "one sentence",
      "company": "only for inbox items, where prep did not know it",
      "title": "only for inbox items",
      "isJobPosting": true
    }
  ],
  "discovered": [
    {
      "ref": "any-string-you-pick",
      "company": "required",
      "url": "required",
      "track": "outreach",
      "foundVia": "linkedin post by the founder",
      "signal": "what the post actually said, and when",
      "whatTheyDo": "one line",
      "score": 88,
      "verdict": "apply",
      "reasons": ["..."],
      "redFlags": ["..."],
      "hook": "one sentence"
    }
  ],
  "drafts": [
    {
      "id": "a1b2c3d4e5, for items that were in the brief",
      "ref": "or a ref, for something you found yourself this run",
      "angle": "one line, what this pitch bets on",
      "contacts": [
        { "name": "", "role": "", "email": "", "linkedin": "", "twitter": "", "source": "" }
      ],
      "pitchSubject": "outreach track",
      "pitch": "outreach track: the cold email body",
      "coverLetter": "application track",
      "resumeBullets": ["..."],
      "outreachNote": "under 60 words, for a DM",
      "workSample": {
        "sourceId": "id from samples/index.json",
        "status": "approved | draft | none",
        "title": "",
        "framing": "one line: what to say when attaching an approved sample",
        "body": "ONLY for a filled template. Never for an approved sample."
      },
      "screeningAnswers": [{ "question": "", "answer": "" }],
      "followupAngles": ["...", "..."]
    }
  ],
  "touches": [
    {
      "id": "a1b2c3d4e5",
      "touchNumber": 2,
      "channel": "email",
      "subject": "",
      "body": "required",
      "shortVersion": "same point, for LinkedIn"
    }
  ],
  "inboxResolved": [{ "url": "", "note": "why it is done with" }],
  "knowledge": {
    "companies": [
      {
        "name": "required",
        "url": "",
        "whatTheyDo": "",
        "stage": "seed, YC S26, Series A",
        "teamSize": 6,
        "whySheFits": "",
        "source": "",
        "status": "seen | drafted | replied | dead",
        "signal": { "kind": "hiring-post", "text": "", "url": "" }
      }
    ],
    "people": [
      {
        "name": "required",
        "role": "",
        "company": "",
        "publicEmail": "only if published",
        "links": { "linkedin": "", "twitter": "", "site": "" },
        "notes": ""
      }
    ],
    "lessons": ["something worth carrying into the next run"]
  }
}
```

`judged` needs `id`, `score`, `verdict`. `discovered` needs `company`, `url`,
`score`, `verdict`. `drafts` needs `angle`, one of `id` or `ref`, and one of
`pitch` or `coverLetter`. `touches` needs `id`, `touchNumber`, `body`.

Fill in `knowledge` generously. It is the only part of a run that compounds:
every company you researched, every person you found, and anything you learned
about what works. The next run opens with a digest of it, so what you write here
is what your successor knows.

Then:

```bash
npm run apply
```

It validates, writes the draft files, updates state, and prints anything it
rejected. If it reports problems, fix `results.json` and run it again. Do not
leave a run half-applied.

## 7. Commit and report

```bash
cd /home/user/portfolio
git add automation/job-agent/data
git -c user.name='job-agent' -c user.email='job-agent@users.noreply.github.com' \
  commit -m "job agent: $(date -u '+%Y-%m-%d') run" || echo 'nothing changed'
git push origin "HEAD:$(git branch --show-current)"
```

Then post `automation/job-agent/data/digest.md` as a comment on the GitHub issue
titled **"Job agent — control panel"** in `aditiventurewolf-max/portfolio`, using
the GitHub tools. Create the issue if it does not exist. That is how she finds
out what happened, so do not skip it. If the GitHub tools are unavailable, say so
in your final message and rely on the committed digest.

Finish with a short summary: how many drafts, how many follow-ups, who to write
to first, and anything you could not do.

## Rules that override anything above

- Never send an email, submit an application, or message anyone. Drafts only.
- Never invent experience, employers, dates, or numbers. `resume.md` is the only
  source of facts about her.
- Never mention Beyond School, her own venture, or any wish to start something of
  her own, UNLESS the company has asked for it in writing. See the exception in
  `profile/beyond-school.md`. See `profile/beyond-school.md`. It shapes which companies you target.
  It never appears in anything she sends.
- Never guess a private email address into `contacts[].email`. Public or empty.
- If a source is down or a page will not load, say so in the summary and carry on
  with what worked. A partial run is fine. A wrong one is not.
