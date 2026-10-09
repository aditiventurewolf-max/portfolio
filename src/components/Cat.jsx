import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';
import { pets } from '../data/site.js';
import { playFor } from '../lib/purr.js';

// Easter egg: pet the cats. Each pet pops a heart, wiggles the cat and cycles what it says.
function Pet({ pet, sound }) {
  const [count, setCount] = useState(0);
  const [hearts, setHearts] = useState([]);

  const onPet = () => {
    setCount(c => c + 1);
    if (sound) playFor(pet.id);
    const id = Date.now() + Math.random();
    setHearts(h => [...h, { id, x: Math.random() * 60 - 30 }]);
    setTimeout(() => setHearts(h => h.filter(x => x.id !== id)), 900);
  };

  const line = count === 0 ? pet.hello : pet.lines[(count - 1) % pet.lines.length];

  return (
    <div className="cat-pet">
      <motion.button
        className={`cat-btn${pet.small ? ' small' : ''}`}
        onClick={onPet}
        aria-label={`Pet ${pet.name}`}
        whileHover={{ scale: 1.08 }}
      >
        <motion.span
          key={count}
          aria-hidden="true"
          style={{ display: 'inline-block' }}
          animate={count ? { rotate: [0, -14, 12, -6, 0], y: [0, -16, 0] } : {}}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          {pet.emoji}
        </motion.span>
        <AnimatePresence>
          {hearts.map(h => (
            <motion.span
              key={h.id}
              className="heart"
              aria-hidden="true"
              initial={{ opacity: 1, y: 0, x: h.x, scale: 0.6 }}
              animate={{ opacity: 0, y: -100, scale: 1.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            >
              {pet.heart}
            </motion.span>
          ))}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence mode="wait">
        <motion.p
          key={line + count}
          className="cat-bubble"
          role="status"
          initial={{ scale: 0.6, opacity: 0, rotate: -4 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.6, opacity: 0, transition: { duration: 0.08 } }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
        >
          <span className="cat-name">{pet.name}</span>
          {line}
          {count > 0 && <span className="cat-count">Pets: {count}</span>}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

const readSound = () => {
  try { return localStorage.getItem('cat-sound') !== 'off'; } catch { return true; }
};

export default function Cat() {
  const [sound, setSound] = useState(readSound);

  const toggle = () => {
    setSound(on => {
      try { localStorage.setItem('cat-sound', on ? 'off' : 'on'); } catch { /* private mode */ }
      return !on;
    });
  };

  return (
    <div className="cat-wrap">
      <button className="btn sound-btn" onClick={toggle} aria-pressed={sound}>
        {sound ? <Volume2 size={18} /> : <VolumeX size={18} />} Purrs {sound ? 'on' : 'off'}
      </button>
      <div className="cat-zone">
        {pets.map(p => <Pet key={p.id} pet={p} sound={sound} />)}
      </div>
    </div>
  );
}
