import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { pets } from '../data/site.js';

// Easter egg: pet the cats. Each pet pops a heart, wiggles the cat and cycles what it says.
function Pet({ pet }) {
  const [count, setCount] = useState(0);
  const [hearts, setHearts] = useState([]);

  const onPet = () => {
    setCount(c => c + 1);
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

export default function Cat() {
  return (
    <div className="cat-zone">
      {pets.map(p => <Pet key={p.name} pet={p} />)}
    </div>
  );
}
