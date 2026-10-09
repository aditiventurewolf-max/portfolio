// Content for /learnings. Bounce Shop numbers are from Metabase (9 Oct 2026); repair numbers are
// from the RRR management review (7 Oct 2026) and RSA tracker. Keep each field to one sentence.

export const intro =
  'Founder\'s-office operator at Bounce. I take a messy problem, find the number that actually explains it, ship a fix, and write down what I got wrong. Below: what I did, what moved, and the one lesson I kept from each.';

export const groups = [
  {
    label: 'Bounce · Founder\'s Office',
    items: [
      {
        title: 'In-app Shop for delivery riders',
        did: 'Built the rider-accessories line from zero: tested willingness to pay at hubs, picked vendors, piloted mobile holders and helmets, then took it in-app across 4 cities.',
        result: '516 paid orders, ₹1.4L GMV, 463 riders in 7 weeks; mobile holders drive 76% of revenue. Zerodha partnership: 57,600 leads in 4 weeks.',
        learned: 'Riders didn\'t reject helmets, they rejected helmets that didn\'t fit the bike. A "no" is often a fit problem, and that insight pushed the Shop to stay lean on owned stock and earn from partners instead.',
      },
      {
        title: 'Repair quality (RRR) program',
        did: 'Co-owned the repeat-repair program: QC checklist redesign, a pre-handover quality check, and weekly root-cause reviews.',
        result: 'Okhla pre-handover QC cut 7-day repeats from 11.0 to 4.9 per 100 bikes; roadside closure 155 → 109 min; CSAT 76% → 80% best week.',
        learned: 'Checks that are mandated but never verified do nothing. A 27-point checklist that took 15 minutes got skipped; the short, verified check is what moved the number.',
      },
      {
        title: 'Why riders actually churn',
        did: 'Ran a root-cause calling program: 148 repair pairs, 80 coded rider calls, then joined it with hub wait-time data.',
        result: 'Churn was 9% with no service failure vs 33% with three; riders wait ~2 h at the hub for ~45 min of repair. Two policy changes went to the management review.',
        learned: 'Riders forgive a failed fix; they don\'t forgive a 6-hour wait or rude staff. The cheapest retention lever was the queue, not the repair.',
      },
      {
        title: 'Technician performance leaderboard',
        did: 'Built a mix-adjusted, statistically shrunk leaderboard of 63 technicians to pick who should be retrained.',
        result: 'Only 3 were defensibly below par, and the informal "defaulter" list had missed all 3. The swap pilot was paused to fix incentives first.',
        learned: 'Most of a ranking is noise; say so out loud. And a correct analysis can still lose to the incentive scheme. Fix what people are paid for before who does the work.',
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
        title: 'Job Application Agent',
        did: 'Built a pipeline that finds roles, tailors the resume, drafts the note and tracks every application.',
        result: 'It runs my own job search end to end.',
        learned: 'The agent was fast; the hard part was taste. A short, specific note beat fifty generic ones every time.',
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
