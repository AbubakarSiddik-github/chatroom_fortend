import { useEffect, useRef, useState } from 'react';
import { getCurrentUserId, formatTime } from '../utils/helpers';
import { getRoomDisplayName, getOtherUser, getOtherActualName, hasNickname } from '../utils/roomHelpers';
import NicknameService from '../services/nicknameService';
import NicknameModal from './NicknameModal';
import '../styles/ChatWindow.css';

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6"/>
  </svg>
);
const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
  </svg>
);
const FileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);

export default function ChatWindow({ room, messages, loading, error, typingUser, onlineUsers = {}, onBack, userMap = {}, onNicknameChanged }) {
  const bottomRef = useRef(null);
  const myId = getCurrentUserId();
  const [showNicknameModal, setShowNicknameModal] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  if (!room) {
    return (
      <div id="chat-window" className="chat-empty">
        <div className="chat-empty-content">
          <div className="chat-empty-icon">💬</div>
          <h2>Select a chat to start messaging</h2>
          <p>Choose a room from the sidebar or tap a user to start a private conversation.</p>
        </div>
      </div>
    );
  }

  const isPrivate = room.type === 'PRIVATE';
  const displayName = getRoomDisplayName(room, myId, userMap);
  const actualName = isPrivate ? getOtherActualName(room, myId, userMap) : null;
  const hasNick = isPrivate ? hasNickname(room, myId, userMap) : false;
  const otherUser = isPrivate ? getOtherUser(room, myId, userMap) : null;

  let otherOnline = null;
  if (isPrivate && otherUser && onlineUsers[otherUser.id]) {
    otherOnline = onlineUsers[otherUser.id].status === 'ONLINE';
  }

  const initial = (displayName || '?')[0];
  const letterClass = initial.toLowerCase();

  let subtitle;
  if (isPrivate) {
    const presenceText = otherOnline !== null ? (otherOnline ? '● Online' : '○ Offline') : '';
    subtitle = hasNick ? `@${actualName} · ${presenceText}` : presenceText;
  } else {
    subtitle = `${room.memberIds?.length ?? 0} members`;
  }

  const handleSaveNickname = (nickname) => {
    if (otherUser) {
      NicknameService.set(myId, otherUser.id, nickname);
      onNicknameChanged?.();
    }
  };
  const handleClearNickname = () => {
    if (otherUser) {
      NicknameService.clear(myId, otherUser.id);
      onNicknameChanged?.();
    }
  };

  const renderMessageContent = (msg) => {
    if (msg.deleted) {
      return <p className="msg-content deleted">This message was deleted</p>;
    }
    
    if (msg.type === 'IMAGE') {
      return (
        <div className="msg-content image-attachment">
          <a href={msg.content} target="_blank" rel="noopener noreferrer">
            <img src={msg.content} alt={msg.fileName || 'Attachment'} loading="lazy" />
          </a>
        </div>
      );
    }
    
    if (msg.type === 'FILE') {
      return (
        <div className="msg-content file-attachment">
          <a href={msg.content} target="_blank" rel="noopener noreferrer" className="file-card">
            <FileIcon />
            <div className="file-info">
              <span className="file-name">{msg.fileName}</span>
              <span className="file-size">{(msg.fileSize / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          </a>
        </div>
      );
    }

    return <p className="msg-content">{msg.content}</p>;
  };

  return (
    <div id="chat-window">
      <div id="chat-window-header">
        {onBack && (
          <button id="chat-back-btn" className="icon-btn" onClick={onBack} aria-label="Back to chats">
            <BackIcon />
          </button>
        )}
        <div className="avatar-wrap">
          <div className={`avatar md ${letterClass}`}>{initial}</div>
          {isPrivate && otherOnline !== null && (
            <span className={`presence ${otherOnline ? 'online' : 'offline'}`} />
          )}
        </div>
        <div className="cw-header-text">
          <div className="cw-header-name-row">
            <h2 id="active-room-name">{displayName}</h2>
            {isPrivate && (
              <button
                id="edit-nickname-btn"
                className="icon-btn sm"
                onClick={() => setShowNicknameModal(true)}
                title="Edit nickname"
              >
                <EditIcon />
              </button>
            )}
          </div>
          <span className="cw-meta">{subtitle}</span>
        </div>
      </div>

      <div id="messages-area">
        {loading && (
          <div className="msg-status-wrap">
            <div className="spinner" />
            <p className="msg-status">Loading messages…</p>
          </div>
        )}
        {error && <p className="msg-status error">{error}</p>}

        {!loading && !error && messages.length === 0 && (
          <div className="msg-status-wrap">
            <p className="msg-status">No messages yet. Say hello! 👋</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.senderId === myId;
          const isRead = isMe && msg.readBy?.some((uid) => uid !== myId);
          const senderInitial = (msg.senderName || '?')[0];
          const senderLC = senderInitial.toLowerCase();

          return (
            <div
              key={msg.id}
              id={`msg-${msg.id}`}
              className={`message-row ${isMe ? 'mine' : 'theirs'}`}
            >
              {!isMe && <div className={`avatar sm ${senderLC}`}>{senderInitial}</div>}
              <div className="message-bubble">
                {!isMe && <span className="msg-sender">{msg.senderName}</span>}
                
                {renderMessageContent(msg)}

                <span className="msg-meta">
                  <span className="msg-time">{formatTime(msg.createdAt)}</span>
                  {isMe && (
                    <span className={`msg-read ${isRead ? 'read' : 'sent'}`}>
                      {isRead ? '✓✓ Read' : '✓ Sent'}
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}

        {typingUser && (
          <div id="typing-indicator" className="typing-indicator">
            <div className="typing-dots"><span /><span /><span /></div>
            <span className="typing-text">{typingUser} is typing…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {showNicknameModal && otherUser && (
        <NicknameModal
          username={otherUser.username || 'user'}
          currentNickname={NicknameService.get(myId, otherUser.id)}
          onSave={handleSaveNickname}
          onClear={handleClearNickname}
          onClose={() => setShowNicknameModal(false)}
        />
      )}
    </div>
  );
}
