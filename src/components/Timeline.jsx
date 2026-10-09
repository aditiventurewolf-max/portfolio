import { motion } from 'motion/react';
import { timeline } from '../data/site.js';

const TILT = [-2, 1.5, -1, 2, -1.5];

export default function Timeline() {
  return (
    <section className="timeline bg-ink" aria-label="Where I've been">
      <div className="wrap">
        <h2 className="label timeline-title">★ The route so far</h2>
        <ol className="timeline-row">
          {timeline.map((t, i) => (
            <motion.li
              key={t.org}
              className={`tl-card bg-${t.color}`}
              initial={{ opacity: 0, y: 30, rotate: 0 }}
              whileInView={{ opacity: 1, y: 0, rotate: TILT[i] }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ type: 'spring', stiffness: 320, damping: 20, delay: i * 0.07 }}
              whileHover={{ rotate: 0, y: -6 }}
            >
              <span className="tl-when">{t.when}</span>
              <b>{t.org}</b>
              <span className="tl-role">{t.role}</span>
              <small>{t.note}</small>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
