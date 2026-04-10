import { useState, useEffect } from 'react';

export default function Nav() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const check = () => {
      const hero = document.getElementById('hero');
      const threshold = hero ? hero.offsetHeight - 80 : 80;
      setSolid(window.scrollY > threshold);
    };
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, []);

  const scrollTo = id => e => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav id="nav" className={solid ? 'solid' : ''}>
      <div className="nav-inner">
        <a href="#" className="nav-brand" onClick={scrollTo('hero')}>Aditi Agrawal</a>
        <ul className="nav-links">
          <li><a href="#work" onClick={scrollTo('work')}>Work</a></li>
          <li><a href="#automation" onClick={scrollTo('automation')}>Automation</a></li>
          <li><a href="#about" onClick={scrollTo('about')}>About</a></li>
          <li><a href="#contact" onClick={scrollTo('contact')}>Contact</a></li>
        </ul>
      </div>
    </nav>
  );
}
