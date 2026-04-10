import Reveal from './Reveal.jsx';

const PROJECTS = [
  {
    num: '01', tags: ['Vector Embeddings', 'RAG'],
    title: 'Content Discovery System',
    desc: 'Semantic search using vector embeddings. Finds conceptually similar content — not just keyword matches — surfacing what\'s relevant when you need it.',
    link: 'https://github.com/aditiventurewolf-max/content-discovery-engine-through-vector-embeddings',
  },
  {
    num: '02', tags: ['Meta-Learning', 'Skill Engine'],
    title: 'Self Recursive Learner',
    desc: 'Claude watches its own outputs, extracts reusable patterns, and saves them as new skills. Each session makes the next one smarter. Teaching the teacher — recursively.',
    link: 'https://github.com/aditiventurewolf-max/recursive-skill-learner',
  },
  {
    num: '03', tags: ['Multi-Agent', 'Claude API'],
    title: 'Market Research Agent',
    desc: 'Give it a market. Get back a full research report. Autonomous data gathering, synthesis, and insight generation.',
    link: 'https://github.com/aditiventurewolf-max/market-report',
  },
  {
    num: '04', tags: ['End-to-End', 'Agentic Pipeline'],
    title: 'Job Application Agent',
    desc: 'Fully autonomous: finds jobs, tailors resumes, writes cover letters, applies. Your time is better spent on the actual interview.',
    link: 'https://docs.google.com/spreadsheets/d/1kVvHZDIxZ3zLydLzep6v8wKBdygIVumH1ecJD4fMzrI/edit?pli=1&gid=1171427330#gid=1171427330',
  },
];

export default function Automation() {
  return (
    <section id="automation">
      <div className="container">
        <Reveal className="section-header">
          <span className="eyebrow">Automation Projects</span>
          <h2>AI agents that do<br />the boring work.</h2>
          <p className="section-sub">Because interesting problems deserve human attention.</p>
        </Reveal>

        <div className="projects-grid">
          {PROJECTS.map(p => (
            <Reveal key={p.num} className="project-card">
              <div className="project-top">
                <span className="project-num">{p.num}</span>
                <div className="project-tags">
                  {p.tags.map(t => <span key={t}>{t}</span>)}
                </div>
              </div>
              <h3 className="project-title">{p.title}</h3>
              <p className="project-desc">{p.desc}</p>
              <a
                href={p.link}
                className="project-link"
                target={p.link !== '#' ? '_blank' : undefined}
                rel={p.link !== '#' ? 'noopener noreferrer' : undefined}
              >
                View project →
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
