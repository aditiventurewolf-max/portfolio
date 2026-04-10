import { useState, useEffect } from 'react';

const STOPS = [
  { id: 'work',       label: 'Work',       dark: false },
  { id: 'automation', label: 'Automation', dark: true  },
  { id: 'about',      label: 'About',      dark: false },
  { id: 'contact',    label: 'Contact',    dark: false },
];

export default function SideIndicator() {
  const [visible, setVisible] = useState(false);
  const [dotTop, setDotTop]   = useState(0);
  const [label, setLabel]     = useState('Work');
  const [onDark, setOnDark]   = useState(false);

  useEffect(() => {
    const handle = () => {
      const scrollY = window.scrollY;
      const docH    = document.documentElement.scrollHeight - window.innerHeight;
      const prog    = docH > 0 ? scrollY / docH : 0;
      const hero    = document.getElementById('hero');
      const heroH   = hero ? hero.offsetHeight : window.innerHeight;

      setVisible(scrollY > heroH * 0.55);
      setDotTop(Math.round(prog * 97));

      let lbl = 'Work', dark = false;
      for (const stop of STOPS) {
        const el = document.getElementById(stop.id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.55) {
          lbl  = stop.label;
          dark = stop.dark;
        }
      }
      setLabel(lbl);
      setOnDark(dark);
    };
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);

  return (
    <div
      id="sideIndicator"
      className={`side-indicator${visible ? ' visible' : ''}${onDark ? ' on-dark' : ''}`}
      aria-hidden="true"
    >
      <div className="side-track">
        <div className="side-dot" style={{ top: dotTop + 'px' }} />
      </div>
      <span className="side-label">{label}</span>
    </div>
  );
}
