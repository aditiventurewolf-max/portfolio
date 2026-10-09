import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { marquee } from '../data/site.js';

const LINKS = [
  { href: '#proof', label: 'Proof' },
  { href: '#agents', label: 'Agents' },
  { href: '#writing', label: 'Writing' },
  { href: '#about', label: 'About' },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const items = [...marquee, ...marquee];

  return (
    <>
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {items.map((m, i) => <span key={i}>{m} <span>★</span></span>)}
        </div>
      </div>

      <nav className="nav">
        <div className="wrap nav-inner">
          <a href="#top" className="logo">Aditi.A</a>
          <ul className="nav-links">
            {LINKS.map(l => <li key={l.href}><a href={l.href}>{l.label}</a></li>)}
            <li><a href="/learnings">1-Pager</a></li>
          </ul>
          <a href="#contact" className="btn nav-cta">Hire me <ArrowUpRight size={18} /></a>
          <button
            className="nav-burger"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen(o => !o)}
          >
            {open ? <X size={26} strokeWidth={3} /> : <Menu size={26} strokeWidth={3} />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              className="nav-drawer"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{ overflow: 'hidden' }}
            >
              {[...LINKS, { href: '/learnings', label: '1-Pager' }, { href: '#contact', label: 'Hire me' }].map(l => (
                <a key={l.href} href={l.href} className="btn" onClick={() => setOpen(false)}>{l.label}</a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
