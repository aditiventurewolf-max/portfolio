import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { pieces } from '../data/pieces.js';

export default function Modal({ pieceKey, onClose }) {
  const piece = pieceKey ? pieces[pieceKey] : null;
  const closeRef = useRef(null);

  useEffect(() => {
    if (piece) closeRef.current?.focus();
  }, [piece]);

  return (
    <AnimatePresence>
      {piece && (
        <motion.div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="modal-backdrop" onClick={onClose} />
          <motion.div
            className="modal-box"
            initial={{ y: 80, rotate: -3, scale: 0.9 }}
            animate={{ y: 0, rotate: 0, scale: 1 }}
            exit={{ y: 80, rotate: 3, scale: 0.9, transition: { duration: 0.15, ease: 'easeOut' } }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          >
            <button ref={closeRef} className="modal-close" aria-label="Close" onClick={onClose}>
              <X size={26} strokeWidth={3} />
            </button>
            <h2 id="modal-title">{piece.title}</h2>
            <span className="modal-meta">{piece.meta}</span>
            <div className="modal-content" dangerouslySetInnerHTML={{ __html: piece.body }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
