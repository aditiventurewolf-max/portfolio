import { useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { writing, writingFilters } from '../data/site.js';

const TILT = [-1, 1.2, -0.6, 0.8, -1.4, 0.6];

export default function Writing({ onOpen }) {
  const [active, setActive] = useState('all');
  const shown = writing.filter(w => active === 'all' || w.category === active);

  return (
    <section id="writing" className="section bg-violet tex-halftone">
      <span className="section-num" aria-hidden="true">03</span>
      <div className="wrap">
        <div className="section-head">
          <h2 className="h-section">Things I<br /><span className="tag-box bg-white">wrote</span></h2>
          <div className="filters" role="group" aria-label="Filter writing">
            {writingFilters.map(f => (
              <button key={f} className="btn filter" aria-pressed={active === f} onClick={() => setActive(f)}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <LayoutGroup>
          <motion.div layout className="writing-grid">
            <AnimatePresence mode="popLayout">
              {shown.map(w => {
                const i = writing.indexOf(w);
                return (
                  <motion.article
                    layout
                    key={w.key}
                    className={`wcard bg-${w.color}`}
                    initial={{ opacity: 0, scale: 0.8, rotate: TILT[i] * 4 }}
                    animate={{ opacity: 1, scale: 1, rotate: TILT[i] }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.12 } }}
                    transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                    whileHover={{ y: -8, rotate: 0 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span className="wcard-tag">{w.tag}</span>
                    <div className="wcard-body">
                      <h3>{w.title}</h3>
                      <p>{w.desc}</p>
                      <button className="wcard-read" onClick={() => onOpen(w.key)} aria-label={`Read: ${w.title}`}>Read it <ArrowRight size={18} strokeWidth={3} /></button>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      </div>
    </section>
  );
}
