import { useState, useEffect, useRef } from 'react';
import '../styles/Modal.css';

/**
 * Nickname edit modal.
 * Props: { username, currentNickname, onSave, onClear, onClose }
 */
export default function NicknameModal({ username, currentNickname, onSave, onClear, onClose }) {
  const [value, setValue] = useState(currentNickname || '');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      onSave(trimmed);
    }
    onClose();
  };

  const handleClear = () => {
    onClear();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Set Nickname</h3>
        <p className="modal-subtitle">
          Custom name for <strong>@{username}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="modal-input"
            type="text"
            placeholder={username}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={30}
          />
          <div className="modal-actions">
            {currentNickname && (
              <button type="button" className="modal-btn secondary" onClick={handleClear}>
                Clear Nickname
              </button>
            )}
            <div className="modal-actions-right">
              <button type="button" className="modal-btn ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="modal-btn primary" disabled={!value.trim()}>Save</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
