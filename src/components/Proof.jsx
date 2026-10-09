import { useState } from 'react';
import { motion } from 'motion/react';
import { RotateCw } from 'lucide-react';
import { groups, resultOf } from '../data/learnings.js';

const FRONT = ['bg-white', 'bg-white', 'bg-white', 'bg-white', 'bg-white'];
const HEAD = ['bg-yellow', 'bg-violet', 'bg-red', 'bg-yellow', 'bg-violet'];
const BACK = ['bg-yellow', 'bg-violet', 'bg-red', 'bg-yellow', 'bg-violet'];
const TILT = [-1.2, 1, 0.8, -0.8, 1.2];

// Bounce work plus the Scaler Director's Office card.
const cases = [...groups[0].items, groups[1].items[0]].map((c, i) => ({
  ...c,
  where: i < groups[0].items.length ? 'Bounce' : 'Scaler AI Labs',
}));

function FlipCard({ c, i }) {
  const [flipped, setFlipped] = useState(false);
  const toggle = () => setFlipped(f => !f);

  return (
    <motion.div
      className="flip"
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={`${c.title}. ${flipped ? 'Showing what I learned' : 'Flip to see what I learned'}`}
      onClick={toggle}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}
      initial={{ opacity: 0, y: 60, rotate: TILT[i] * 3 }}
      whileInView={{ opacity: 1, y: 0, rotate: TILT[i] }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: (i % 2) * 0.08 }}
      whileHover={{ y: -6 }}
    >
      <motion.div
        className="flip-inner"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        <div className={`flip-face ${FRONT[i]}`}>
          <div className={`flip-head ${HEAD[i]}`}>
            <span className="label">{c.where}</span>
            <span className="flip-idx">0{i + 1}</span>
          </div>
          <div className="flip-body">
            <h3>{c.title}</h3>
            <p>{c.did}</p>
            <p className="flip-result">{resultOf(c)}</p>
            <span className="flip-foot"><RotateCw size={16} strokeWidth={3} /> Tap for the lesson</span>
          </div>
        </div>

        <div className={`flip-face flip-back ${BACK[i]} tex-halftone`}>
          <div className="flip-head bg-ink">
            <span className="label">What it taught me</span>
            <span className="flip-idx" style={{ color: '#000' }}>0{i + 1}</span>
          </div>
          <div className="flip-body" style={{ background: 'transparent' }}>
            <span className="quote-mark">“</span>
            <p className="lesson tag-box bg-white" style={{ padding: '14px 16px' }}>{c.learned}</p>
            <span className="flip-foot"><RotateCw size={16} strokeWidth={3} /> Tap to flip back</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Proof() {
  return (
    <section id="proof" className="section bg-cream">
      <span className="section-num" aria-hidden="true">01</span>
      <div className="wrap">
        <div className="section-head">
          <h2 className="h-section">Proof of<br /><span className="tag-box bg-yellow">work</span></h2>
          <p>What I did, what moved, and the one lesson I kept. Every card flips.</p>
        </div>
        <div className="proof-grid">
          {cases.map((c, i) => <FlipCard key={c.title} c={c} i={i} />)}
        </div>
      </div>
    </section>
  );
}
