import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Github } from 'lucide-react';
import { agents } from '../data/site.js';

const LINE = '$ claude --task "do the boring work so I can do the interesting work"';

function Typing() {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? LINE.length : 0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setN(v => (v >= LINE.length ? v : v + 1)), 35);
    return () => clearInterval(id);
  }, [reduce]);

  return <p className="typing" aria-label={LINE}>{LINE.slice(0, n)}<span className="caret" /></p>;
}

export default function Agents() {
  return (
    <section id="agents" className="section bg-ink">
      <span className="section-num" aria-hidden="true">02</span>
      <div className="wrap">
        <div className="section-head">
          <h2 className="h-section">Agents<br /><span className="outline">I built</span></h2>
          <p>Side projects that started as "can I automate this?" All open source.</p>
        </div>
        <Typing />
        <div className="agents-grid">
          {agents.map((a, i) => (
            <motion.article
              key={a.name}
              className="term"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ type: 'spring', stiffness: 300, damping: 22, delay: i * 0.1 }}
              whileHover={{ y: -8, rotate: i % 2 ? 1 : -1 }}
            >
              <div className="term-bar"><i /><i /><i /><code>~/{a.name}</code></div>
              <div className="term-body">
                <h3>{a.title}</h3>
                <p>{a.desc}</p>
                <div className="term-tags">{a.tags.map(t => <span key={t}>{t}</span>)}</div>
                <a className="btn" href={a.link} target="_blank" rel="noopener noreferrer">
                  <Github size={18} /> View repo
                </a>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
