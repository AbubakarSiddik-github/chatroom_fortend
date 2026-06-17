import { useEffect } from 'react';
import '../styles/Modal.css';

/**
 * Confirmation dialog.
 * Props: { title, message, confirmLabel, danger, onConfirm, onCancel }
 */
export default function ConfirmModal({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-subtitle">{message}</p>
        <div className="modal-actions">
          <div className="modal-actions-right" style={{ width: '100%', justifyContent: 'flex-end' }}>
            <button className="modal-btn ghost" onClick={onCancel}>Cancel</button>
            <button className={`modal-btn ${danger ? 'danger' : 'primary'}`} onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
