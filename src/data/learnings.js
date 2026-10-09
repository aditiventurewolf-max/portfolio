// Content for /learnings and the homepage. Keep each field to one sentence.
// `result` is the public, rounded version. `exact` has the resume v4 numbers and is only used
// when the site is built with VITE_EXACT=1 (for the private PDF), so Bounce's exact figures stay off the public site.

const EXACT = typeof import.meta !== 'undefined' && import.meta.env?.VITE_EXACT === '1';
export const resultOf = item => (EXACT && item.exact) || item.result;

export const intro =
  'Founder\'s-office operator at Bounce. I take a messy problem, find the number that actually explains it, ship the fix and make it stick. Below: what I did, what moved, and the one lesson I kept from each.';

export const groups = [
  {
    label: 'Bounce · Founder\'s Office',
    items: [
      {
        title: 'In-app Shop for delivery riders',
        did: 'Built Bounce\'s rider Shop from zero: tested willingness to pay at hubs, picked vendors, trained hub managers, then launched it in-app across Bangalore, Mumbai, Hyderabad and Delhi, plus in-app partnerships (fintech, gold savings, health insurance).',
        result: '500+ paid orders from 450+ riders in the first 7 weeks; in-app partnerships brought in 50K+ leads in a month.',
        exact: '516 paid orders, ₹1.4L GMV, 463 riders in 7 weeks; mobile holders drive 76% of revenue. In-app partnerships: 57,600 leads in 4 weeks.',
        learned: 'Riders didn\'t reject helmets, they rejected helmets that didn\'t fit the bike. A "no" is often a fit problem, and that insight pushed the Shop to stay lean on owned stock and earn from partners instead.',
      },
      {
        title: 'Repair quality (RRR) program',
        did: 'Led service quality for repairs and roadside assistance: set up the weekly review with every city head, moved QC before job-card closure, rebuilt the QC checklist and got a 45-min roadside-delay alarm into the ops app.',
        result: 'Repeat repairs down by about a third, roadside fixes 2.5× faster, repair CSAT up 9 points.',
        exact: 'Repeat repairs 15.75% → 10%, 7-day defects 17% → 12%, roadside closure 155 → 60 min, repair CSAT 76% → 85%.',
        learned: 'Checks that are mandated but never verified do nothing. A 27-point checklist that took 15 minutes got skipped; the short, verified check is what moved the number.',
      },
      {
        title: 'Why riders actually churn',
        did: 'Ran 200+ rider calls to understand the relationship riders actually have with Bounce, coded every one, and joined it with hub wait-time and repair data.',
        result: 'Riders hit by three service failures were almost 4× more likely to churn, and most of a hub visit was waiting, not repair. My two rider-policy changes went to the management review.',
        exact: 'Churn was 9% with no service failure vs 33% with three; riders wait ~2 h at the hub for ~45 min of repair. My two rider-policy changes went to the management review.',
        learned: 'Riders forgive a failed fix; they don\'t forgive a 6-hour wait or rude staff. The cheapest retention lever was the queue, not the repair.',
      },
      {
        title: 'Finding the technicians who drive repeat repairs',
        did: 'Built Bounce\'s first fair technician scorecard across Bangalore and NCR, adjusted for job mix so tough jobs don\'t punish good people, then designed a sister-hub retraining program.',
        result: 'Pinpointed the few technicians actually driving repeat repairs, all of whom the existing defaulter list had missed, and paired each with a top performer at a nearby hub.',
        exact: 'Pinpointed the 3 technicians actually driving repeat repairs, all of whom the existing defaulter list had missed, and paired each with a top performer at a nearby hub.',
        learned: 'Gut-feel lists catch the loudest people, not the ones moving the number. Adjust for the work before you judge the worker.',
      },
    ],
  },
  {
    label: 'Scaler AI Labs + things I build',
    items: [
      {
        title: 'Director\'s Office, Scaler AI Labs',
        did: 'Ran operations for an AI training-data team and built Sourcery, where a Claude agent turns a raw brief into weighted criteria, scores vendors and chases follow-ups.',
        result: '15+ vendors managed; delivery workflows re-engineered to cut manual processing time by ~30%.',
        learned: 'Automate the follow-up, not the judgement. The agent was most useful doing the chasing nobody wanted to do, while people kept the final call.',
      },
      {
        title: 'Open-source AI agents',
        did: 'Built a market-research agent that pulls filings, news and prices into one report, a semantic search engine on vector embeddings, and a skill engine where Claude learns from its own outputs.',
        result: 'Three public repos on GitHub.',
        learned: 'Agents fail at the edges, not the middle. Most of the work was deciding what the agent should refuse to guess.',
      },
    ],
  },
  {
    label: 'Research & writing',
    items: [
      {
        title: 'Why Indian startups are betting on your dog',
        did: 'Wrote a market piece for The Daily Brief (Zerodha) on India\'s pet-care boom.',
        result: 'Pet population 26M → 42M; a ₹3.6B market where 90% of sales are still offline.',
        learned: 'In pet care the moat is trust, not product. New pet parents don\'t know what to buy, so whoever teaches them wins.',
      },
      {
        title: 'Naxatra Labs: "Density is Destiny"',
        did: 'Brand and content strategy for a Rainmatter-backed EV motor startup.',
        result: 'Reframed "efficient compact motors" into one narrative, with separate pitches for OEM CTOs, policy and investors.',
        learned: 'Deep-tech brands fall into a competence trap: accurate, but nobody feels why it matters. Lead with what the spec lets the customer do.',
      },
    ],
  },
];
