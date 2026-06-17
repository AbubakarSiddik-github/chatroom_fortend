import { useState, useMemo, useRef, useCallback } from 'react';
import { getCurrentUserId } from '../utils/helpers';
import { getRoomDisplayName, getOtherUser } from '../utils/roomHelpers';
import HiddenChatsService from '../services/hiddenChatsService';
import ContextMenu from './ContextMenu';
import ConfirmModal from './ConfirmModal';
import '../styles/Sidebar.css';

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
);

export default function RoomList({ rooms, activeRoomId, onSelect, onlineUsers = {}, userMap = {}, onHideRoom }) {
  const [query, setQuery] = useState('');
  const [ctxMenu, setCtxMenu] = useState(null);     // { x, y, room }
  const [confirmDelete, setConfirmDelete] = useState(null); // room
  const longPressTimer = useRef(null);
  const myId = getCurrentUserId();

  // Filter: remove hidden, apply search
  const filtered = useMemo(() => {
    const hiddenIds = HiddenChatsService.getHiddenIds(myId);
    let list = rooms.filter((r) => !hiddenIds.includes(r.id));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((r) => {
        const displayName = getRoomDisplayName(r, myId, userMap);
        return displayName.toLowerCase().includes(q);
      });
    }
    return list;
  }, [rooms, query, myId, userMap]);

  // ── Context menu handlers ──────────────────────────────
  const handleContextMenu = useCallback((e, room) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, room });
  }, []);

  const handleLongPressStart = useCallback((e, room) => {
    longPressTimer.current = setTimeout(() => {
      const touch = e.touches?.[0];
      const x = touch?.clientX ?? e.clientX;
      const y = touch?.clientY ?? e.clientY;
      setCtxMenu({ x, y, room });
    }, 500);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    clearTimeout(longPressTimer.current);
  }, []);

  const handleDeleteClick = (room) => {
    setConfirmDelete(room);
  };

  const handleConfirmDelete = () => {
    if (confirmDelete) {
      HiddenChatsService.hide(myId, confirmDelete.id);
      onHideRoom?.(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  // ── Context menu items ─────────────────────────────────
  const getMenuItems = (room) => [
    { label: 'Delete chat', icon: '🗑️', danger: true, onClick: () => handleDeleteClick(room) },
  ];

  return (
    <div id="room-list" className="sidebar-list">
      <div className="search-bar">
        <SearchIcon />
        <input
          id="search-rooms"
          type="text"
          placeholder="Search chats…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <p className="sidebar-empty">
          {query ? 'No chats match your search.' : 'No chats yet. Start a conversation!'}
        </p>
      )}

      <ul className="sidebar-items">
        {filtered.map((room) => {
          const isActive  = room.id === activeRoomId;
          const isPrivate = room.type === 'PRIVATE';
          const displayName = getRoomDisplayName(room, myId, userMap);
          const initial = (displayName || '?')[0];
          const letterClass = initial.toLowerCase();

          // Presence for private rooms
          let isOtherOnline = null;
          if (isPrivate) {
            const other = getOtherUser(room, myId, userMap);
            if (other && onlineUsers[other.id]) {
              isOtherOnline = onlineUsers[other.id].status === 'ONLINE';
            }
          }

          return (
            <li
              key={room.id}
              id={`room-${room.id}`}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelect(room)}
              onContextMenu={(e) => handleContextMenu(e, room)}
              onTouchStart={(e) => handleLongPressStart(e, room)}
              onTouchEnd={handleLongPressEnd}
              onTouchCancel={handleLongPressEnd}
            >
              <div className="avatar-wrap">
                <div className={`avatar sm ${letterClass}`}>
                  {isPrivate ? initial : initial}
                </div>
                {isPrivate && isOtherOnline !== null && (
                  <span className={`presence ${isOtherOnline ? 'online' : 'offline'}`} />
                )}
              </div>
              <div className="sidebar-item-body">
                <div className="sidebar-item-top">
                  <span className="sidebar-item-name">{displayName}</span>
                  <span className={`sidebar-badge ${isPrivate ? 'private' : 'group'}`}>
                    {isPrivate ? 'DM' : 'GROUP'}
                  </span>
                </div>
                <div className="sidebar-item-bottom">
                  <span className="sidebar-item-preview">
                    {isPrivate
                      ? (isOtherOnline ? '● Online' : '○ Offline')
                      : `${room.memberIds?.length || 0} members`
                    }
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Context menu */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={getMenuItems(ctxMenu.room)}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <ConfirmModal
          title="Delete chat"
          message="Delete this chat from your list? Messages are preserved on the server."
          confirmLabel="Delete"
          danger
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
