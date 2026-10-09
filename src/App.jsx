import { useState, useEffect } from 'react';
import { MotionConfig } from 'motion/react';
import Nav from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import Stats from './components/Stats.jsx';
import Proof from './components/Proof.jsx';
import Agents from './components/Agents.jsx';
import Writing from './components/Writing.jsx';
import About from './components/About.jsx';
import Contact from './components/Contact.jsx';
import Footer from './components/Footer.jsx';
import Modal from './components/Modal.jsx';

export default function App() {
  const [modalKey, setModalKey] = useState(null);

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') setModalKey(null); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = modalKey ? 'hidden' : '';
  }, [modalKey]);

  return (
    <MotionConfig reducedMotion="user">
      <Nav />
      <main>
        <Hero />
        <Stats />
        <Proof />
        <Agents />
        <Writing onOpen={setModalKey} />
        <About />
        <Contact />
      </main>
      <Footer />
      <Modal pieceKey={modalKey} onClose={() => setModalKey(null)} />
    </MotionConfig>
  );
}
