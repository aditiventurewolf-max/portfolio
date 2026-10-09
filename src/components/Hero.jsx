import { useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowDown, FileText } from 'lucide-react';
import { stickers } from '../data/site.js';
import Star from './Star.jsx';

const pop = {
  hidden: { y: 60, opacity: 0, rotate: -4 },
  show: i => ({ y: 0, opacity: 1, rotate: 0, transition: { delay: 0.08 * i, type: 'spring', stiffness: 380, damping: 22 } }),
};

export default function Hero() {
  const board = useRef(null);

  return (
    <header id="top" className="hero bg-cream tex-grid">
      <div className="wrap hero-inner">
        <div>
          <motion.span className="label hero-kicker" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
            ★ Founder's Office · Bounce
          </motion.span>

          <h1 className="h-display">
            <motion.span className="line" custom={0} variants={pop} initial="hidden" animate="show">I find the</motion.span>
            <motion.span className="line" custom={1} variants={pop} initial="hidden" animate="show"><span className="hl">number</span></motion.span>
            <motion.span className="line outline" custom={2} variants={pop} initial="hidden" animate="show">behind</motion.span>
            <motion.span className="line" custom={3} variants={pop} initial="hidden" animate="show">the <span className="hl hl-red">mess.</span></motion.span>
          </h1>

          <motion.p className="hero-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            I'm Aditi. I took Bounce's rider Shop from zero to <strong>₹1.4L GMV in 7 weeks</strong>, rebuilt how repairs get checked, and I build AI agents for fun.
          </motion.p>

          <motion.div className="hero-ctas" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <a href="#proof" className="btn bg-red">See the proof <ArrowDown size={18} /></a>
            <a href="/learnings" className="btn bg-white">The 1-pager <FileText size={18} /></a>
          </motion.div>
        </div>

        <motion.div
          className="board"
          ref={board}
          initial={{ opacity: 0, rotate: 6, scale: 0.9 }}
          animate={{ opacity: 1, rotate: 2, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.2 }}
        >
          <div className="star-badge">
            <Star className="star spin-slow" fill="var(--yellow)" />
            <span>Open to<br />work</span>
          </div>

          {stickers.map((s, i) => (
            <motion.div
              key={s.id}
              className={`sticker bg-${s.color}${s.round ? ' round' : ''}`}
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: 1, rotate: s.rotate }}
              transition={{ delay: 0.5 + i * 0.09, type: 'spring', stiffness: 420, damping: 14 }}
              drag
              dragConstraints={board}
              dragElastic={0.15}
              dragMomentum={false}
              whileHover={{ scale: 1.06, rotate: s.rotate * -1 }}
              whileDrag={{ scale: 1.12, rotate: 0, boxShadow: '10px 10px 0 0 #000', zIndex: 10 }}
            >
              <b>{s.text}</b>
              <small>{s.sub}</small>
            </motion.div>
          ))}

          <span className="board-hint">↔ Drag the stickers</span>
        </motion.div>
      </div>
    </header>
  );
}
