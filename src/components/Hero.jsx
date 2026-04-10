import { useState, useEffect } from 'react';

const WORDS = ['research', 'analyse', 'write', 'build', 'automate'];

export default function Hero() {
  const [wordIdx, setWordIdx] = useState(0);
  const [phase, setPhase]     = useState('visible');
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhase('exiting');
      setTimeout(() => {
        setWordIdx(i => (i + 1) % WORDS.length);
        setPhase('entering');
        requestAnimationFrame(() =>
          requestAnimationFrame(() => setPhase('visible'))
        );
      }, 300);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handle = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);

  const wordStyle = {
    exiting:  { opacity: 0, transform: 'translateY(-18px)', transition: 'opacity 0.28s ease, transform 0.28s ease' },
    entering: { opacity: 0, transform: 'translateY(18px)',  transition: 'none' },
    visible:  { opacity: 1, transform: 'none',              transition: 'opacity 0.42s ease, transform 0.42s ease' },
  }[phase];

  return (
    <section id="hero">
      <div
        className="hero-glow hero-glow--a"
        style={{ transform: `translateY(${scrollY * 0.28}px)` }}
      />
      <div
        className="hero-glow hero-glow--b"
        style={{ transform: `translateY(${scrollY * -0.18}px)` }}
      />
      <div className="hero-inner">
        <p className="hero-eyebrow">Researcher &amp; Writer &nbsp;·&nbsp; IIM Ranchi</p>
        <h1 className="hero-headline">
          <span className="hero-i">I&nbsp;</span>
          <span className="hero-word" style={wordStyle}>{WORDS[wordIdx]}</span>
          <span className="hero-dot">.</span>
        </h1>
      </div>
      <div className="hero-scroll-cue" aria-hidden="true">
        <div className="scroll-cue-line"><div className="scroll-cue-fill" /></div>
        <span className="scroll-cue-label">Scroll</span>
      </div>
    </section>
  );
}
