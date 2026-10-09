// Homepage content. Bounce/Scaler case studies come from learnings.js so the site, /learnings and the PDF never drift apart.

export const contact = {
  email: 'aditiagrawal2026@gmail.com',
  linkedin: 'https://linkedin.com/in/venture-with-aditi',
  github: 'https://github.com/aditiventurewolf-max',
  blog: 'https://iimranchi.ac.in/its-okay-to-not-be-okay/',
};

export const marquee = [
  'Founder\'s Office @ Bounce',
  '₹1.4L GMV in 7 weeks',
  'IIM Ranchi',
  '57,600 partner leads',
  'Builds AI agents for fun',
  'Certified cat person',
  'Bangalore',
];

// Draggable stickers in the hero. x/y are % positions inside the sticker board.
export const stickers = [
  { id: 'gmv',   text: '₹1.4L GMV',        sub: 'in 7 weeks',     color: 'yellow', x: 5,  y: 7,  rotate: -6 },
  { id: 'leads', text: '57,600',           sub: 'partner leads',  color: 'violet', x: 58, y: 5,  rotate: 5 },
  { id: 'rsa',   text: '155 → 60',         sub: 'min to close',   color: 'red',    x: 6,  y: 37, rotate: -3 },
  { id: 'csat',  text: 'CSAT 76 → 85',     sub: 'repair',         color: 'white',  x: 50, y: 37, rotate: 6 },
  { id: 'iim',   text: 'IIM RANCHI',       sub: '#1 in cohort, yr 1', color: 'yellow', x: 5, y: 68, rotate: 4 },
  { id: 'cat',   text: '🐱',               sub: 'drag me',        color: 'violet', x: 64, y: 64, rotate: -10, round: true },
];

export const stats = [
  { value: 516,   label: 'paid Shop orders in 7 weeks', prefix: '', suffix: '' },
  { value: 57600, label: 'partner leads in 4 weeks', prefix: '', suffix: '' },
  { value: 200,   label: 'rider calls, every one coded', prefix: '', suffix: '+' },
  { value: 5000,  label: 'scooters rebranded', prefix: '', suffix: '+' },
];

export const agents = [
  {
    name: 'market-report',
    title: 'Market Research Agent',
    desc: 'Give it a ticker. It pulls earnings, news sentiment, filings and price history in parallel, then writes a research note with a one-line verdict.',
    tags: ['Tool calling', 'Llama 3.3'],
    link: 'https://github.com/aditiventurewolf-max/market-report',
  },
  {
    name: 'recursive-skill-learner',
    title: 'Self Recursive Learner',
    desc: 'An MCP server that watches Claude\'s outputs, pulls out reusable patterns and saves them as versioned skills. Each session makes the next one smarter.',
    tags: ['MCP', 'Claude'],
    link: 'https://github.com/aditiventurewolf-max/recursive-skill-learner',
  },
  {
    name: 'content-discovery-engine',
    title: 'Content Discovery Engine',
    desc: 'Semantic search on vector embeddings. Finds what\'s related in meaning, not just in keywords.',
    tags: ['Embeddings', 'Pinecone'],
    link: 'https://github.com/aditiventurewolf-max/content-discovery-engine-through-vector-embeddings',
  },
];

export const writing = [
  {
    key: 'petcare', category: 'writing', color: 'yellow',
    tag: 'The Daily Brief (Zerodha)',
    title: 'Why Indian startups are betting big on your dog',
    desc: 'From ₹1.6B to ₹7B: the pandemic pet boom, premiumisation, and the trust gap behind India\'s next unicorn.',
  },
  {
    key: 'linkedin', category: 'research', color: 'violet',
    tag: 'Research · 318,842 posts',
    title: 'How the LinkedIn algorithm actually works',
    desc: 'Why the same post gets 12 likes for you and 50,000 impressions for someone else.',
  },
  {
    key: 'naxatra', category: 'strategy', color: 'red',
    tag: 'Brand strategy · EV',
    title: 'Naxatra Labs: "Density is Destiny"',
    desc: 'Repositioned an axial-flux motor startup from component maker to performance architect.',
  },
  {
    key: 'skincare', category: 'research', color: 'white',
    tag: 'UX audit · Skincare',
    title: 'Personalising Skincare: brand & UX audit',
    desc: 'Where the site loses customers, and a journey redesign that delivers the "personal touch" it promises.',
  },
  {
    key: 'stimuler', category: 'research', color: 'yellow',
    tag: 'UX teardown · App',
    title: 'Stimuler: app UX teardown',
    desc: 'Onboarding friction, a premature Pro push on day 4, and the small UI details causing drop-offs.',
  },
  {
    key: 'consent', category: 'writing', color: 'violet',
    tag: 'Writing · MyMuse',
    title: 'Life of Consent',
    desc: 'What consent is, what it absolutely is not, and why the conversation matters more than we admit.',
  },
];

export const writingFilters = ['all', 'writing', 'research', 'strategy'];

export const chips = ['🐱🐈‍⬛ Cat mom ×2', '⏰ Alarm enthusiast', '🥬 Anti-spinach', '📚 IIM Ranchi', '🛵 EV nerd'];

export const pets = [
  {
    name: 'Mr B',
    emoji: '🐱',
    heart: '❤️',
    hello: 'psst. pet me.',
    lines: [
      'meow.',
      'mrrp? more data please.',
      'I knock spreadsheets off tables.',
      'hire her. she has treats.',
      'purr… 155 → 60 minutes.',
      'okay, that is enough petting.',
    ],
  },
  {
    name: 'Miss P (tiny rescue)',
    emoji: '🐈‍⬛',
    heart: '🖤',
    small: true,
    hello: 'mew? (tiny. rescued. in charge.)',
    lines: [
      'mew!',
      'small but very much in charge.',
      'chasing the cursor is my job.',
      'Mr B gets the treats first. unfair.',
      'mew mew (translation: hire her).',
    ],
  },
];
