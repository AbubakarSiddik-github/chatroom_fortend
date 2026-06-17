import { useState, useMemo } from 'react';
import { getCurrentUserId } from '../utils/helpers';
import '../styles/Sidebar.css';

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
);

export default function UserList({ users, onStartPrivate, onlineUsers = {} }) {
  const [query, setQuery] = useState('');
  const myId = getCurrentUserId();

  const filtered = useMemo(() => {
    const others = users.filter((u) => u.id !== myId);
    if (!query.trim()) return others;
    const q = query.toLowerCase();
    return others.filter((u) =>
      u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }, [users, query, myId]);

  return (
    <div id="user-list" className="sidebar-list">
      <div className="search-bar">
        <SearchIcon />
        <input
          id="search-users"
          type="text"
          placeholder="Search users…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <p className="sidebar-empty">
          {query ? 'No users match your search.' : 'No other users found.'}
        </p>
      )}

      <ul className="sidebar-items">
        {filtered.map((user) => {
          const isOnline = onlineUsers[user.id]?.status === 'ONLINE';
          const initial  = (user.username || '?')[0];
          const letterClass = initial.toLowerCase();

          return (
            <li
              key={user.id}
              id={`user-${user.id}`}
              className="sidebar-item"
              onClick={() => onStartPrivate(user)}
              title={`Chat with ${user.username}`}
            >
              <div className="avatar-wrap">
                <div className={`avatar sm ${letterClass}`}>{initial}</div>
                <span className={`presence ${isOnline ? 'online' : 'offline'}`} />
              </div>
              <div className="sidebar-item-body">
                <div className="sidebar-item-top">
                  <span className="sidebar-item-name">{user.username}</span>
                  <span className={`sidebar-status ${isOnline ? 'on' : ''}`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="sidebar-item-bottom">
                  <span className="sidebar-item-preview">{user.email}</span>
                  <span className="sidebar-dm-hint">DM →</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
