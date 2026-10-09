import { motion } from 'motion/react';
import { chips } from '../data/site.js';
import Cat from './Cat.jsx';

export default function About() {
  return (
    <section id="about" className="section bg-cream tex-grid">
      <span className="section-num" aria-hidden="true">04</span>
      <div className="wrap about-grid">
        <motion.figure
          className="polaroid"
          initial={{ rotate: -12, y: 60, opacity: 0 }}
          whileInView={{ rotate: -3, y: 0, opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          whileHover={{ rotate: 2, scale: 1.02 }}
        >
          <img src="/assets/images/aditi.jpg" alt="Aditi Agrawal" onError={e => { e.currentTarget.style.display = 'none'; }} />
          <figcaption>That's me</figcaption>
          <motion.div className="stamp" animate={{ rotate: [8, 14, 8] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
            Money-back guarantee
          </motion.div>
        </motion.figure>

        <div className="about-copy">
          <span className="label">About</span>
          <h2 className="h-section" style={{ marginTop: 12 }}>Jack of all trades.<br /><span className="tag-box bg-red">Master of some.</span></h2>
          <p>IIM Ranchi IPM (ranked <strong>#1 in my cohort</strong>). Now in the Founder's Office at Bounce, where I own the messy middle: rider products, repair quality, partnerships, and whatever is on fire this week.</p>
          <p>I like problems that look like ops but are really about people. Lately I've been building AI tools so I can spend my time on the parts that need thinking.</p>
          <div className="guarantee">
            <strong>The Domino's deal:</strong> if I don't fit the role and the team in a week, you get your money back.
          </div>
          <div className="chips">
            {chips.map(c => <span key={c} className="chip">{c}</span>)}
          </div>
          <Cat />
        </div>
      </div>
    </section>
  );
}
