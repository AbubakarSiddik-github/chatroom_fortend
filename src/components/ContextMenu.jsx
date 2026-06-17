import { useEffect, useRef } from 'react';
import '../styles/ContextMenu.css';

/**
 * Right-click / long-press context menu.
 * Props: { x, y, items: [{ label, icon?, danger?, onClick }], onClose }
 */
export default function ContextMenu({ x, y, items, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Adjust position to keep menu on screen
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menuRef.current.style.left = `${window.innerWidth - rect.width - 8}px`;
    }
    if (rect.bottom > window.innerHeight) {
      menuRef.current.style.top = `${window.innerHeight - rect.height - 8}px`;
    }
  }, [x, y]);

  return (
    <div className="ctx-menu" ref={menuRef} style={{ left: x, top: y }}>
      {items.map((item, i) => (
        <button
          key={i}
          className={`ctx-item ${item.danger ? 'danger' : ''}`}
          onClick={() => { item.onClick(); onClose(); }}
        >
          {item.icon && <span className="ctx-icon">{item.icon}</span>}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
