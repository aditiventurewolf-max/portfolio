import { useState, useEffect } from 'react';
import Nav from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import Work from './components/Work.jsx';
import Modal from './components/Modal.jsx';
import Automation from './components/Automation.jsx';
import About from './components/About.jsx';
import Contact from './components/Contact.jsx';
import Footer from './components/Footer.jsx';
import SideIndicator from './components/SideIndicator.jsx';

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
    <>
      <Nav />
      <Hero />
      <Work onOpen={setModalKey} />
      <Automation />
      <About />
      <Contact />
      <Footer />
      <SideIndicator />
      <Modal pieceKey={modalKey} onClose={() => setModalKey(null)} />
    </>
  );
}
