import { pieces } from '../data/pieces.js';

export default function Modal({ pieceKey, onClose }) {
  const piece = pieceKey ? pieces[pieceKey] : null;

  return (
    <div
      id="modal"
      className={`modal${piece ? ' open' : ''}`}
      aria-hidden={piece ? 'false' : 'true'}
    >
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-box">
        <button className="modal-close" aria-label="Close" onClick={onClose}>✕</button>
        {piece && (
          <div id="modalBody">
            <h2>{piece.title}</h2>
            <p className="modal-meta">{piece.meta}</p>
            <div dangerouslySetInnerHTML={{ __html: piece.body }} />
          </div>
        )}
      </div>
    </div>
  );
}
