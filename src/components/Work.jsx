import { useState } from 'react';
import Reveal from './Reveal.jsx';

const CARDS = [
  {
    key: 'petcare', category: 'writing',
    tag: 'Writing · The Daily Brief',
    title: 'Why Indian Startups Are Betting Big on Your Dog',
    desc: 'From ₹1.6B to ₹7B — the pandemic pet boom, premiumization, and the trust gap creating India\'s next unicorn opportunity.',
  },
  {
    key: 'linkedin', category: 'analysis',
    tag: 'Research · Algorithm',
    title: 'How the LinkedIn Algorithm Actually Works',
    desc: 'Based on 318,842 posts and LinkedIn\'s own engineering blog. Why the same content gets 12 likes for you and 50,000 impressions for someone else.',
  },
  {
    key: 'skincare', category: 'analysis',
    tag: 'UX Analysis · Skincare',
    title: 'Personalising Skincare — Brand & UX Audit',
    desc: 'A full audit identifying where the site loses customers and a user journey redesign that actually delivers the "personal touch" the brand promises.',
  },
  {
    key: 'stimuler', category: 'analysis',
    tag: 'UX Analysis · App',
    title: 'Stimuler — App UX Teardown',
    desc: 'Onboarding friction, the premature Pro push on Day 4, and the small UI details causing drop-offs on a language learning app.',
  },
  {
    key: 'naxatra', category: 'strategy',
    tag: 'Brand Strategy · EV',
    title: 'Naxatra Labs — "Density is Destiny"',
    desc: 'Narrative strategy for an axial flux motor startup. Repositioned them from component manufacturer to Performance Architect.',
  },
  {
    key: 'consent', category: 'writing',
    tag: 'Writing · MyMuse',
    title: 'Life of Consent',
    desc: 'Demolishing misconceptions about consent — what it is, what it absolutely is not, and why the conversation matters more than we admit.',
  },
];

const FILTERS = ['all', 'writing', 'analysis', 'strategy'];

export default function Work({ onOpen }) {
  const [active, setActive] = useState('all');

  return (
    <section id="work">
      <div className="container work-container">

        <div className="work-sticky">
          <Reveal className="section-header">
            <span className="eyebrow">Selected Work</span>
            <h2>Research, analysis,<br />and things I've written.</h2>
          </Reveal>
          <Reveal className="work-filter">
            {FILTERS.map(f => (
              <button
                key={f}
                className={`filter-btn${active === f ? ' active' : ''}`}
                onClick={() => setActive(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </Reveal>
        </div>

        <div className="work-cards-col">
          <div className="work-grid">
            {CARDS.map((card, i) => {
              const show = active === 'all' || card.category === active;
              return (
                <Reveal
                  key={card.key}
                  as="article"
                  className={`work-card${show ? '' : ' hidden'}`}
                  style={{ transitionDelay: `${i * 0.06}s` }}
                >
                  <span className="work-tag">{card.tag}</span>
                  <h3 className="work-title">{card.title}</h3>
                  <p className="work-desc">{card.desc}</p>
                  <button className="work-read" onClick={() => onOpen(card.key)}>Read piece →</button>
                </Reveal>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
