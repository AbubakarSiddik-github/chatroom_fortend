import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import ChatService from '../services/ChatService';
import UploadService from '../services/uploadService';
import HiddenChatsService from '../services/hiddenChatsService';
import * as ws from '../services/websocketService';
import { getCurrentUserId, getCurrentUsername } from '../utils/helpers';
import { buildUserMap } from '../utils/roomHelpers';
import RoomList from '../components/RoomList';
import UserList from '../components/UserList';
import ChatWindow from '../components/ChatWindow';
import MessageInput from '../components/MessageInput';
import ProfileModal from '../components/ProfileModal';
import '../styles/ChatPage.css';

export default function ChatPage() {
  const navigate   = useNavigate();
  const myId       = getCurrentUserId();
  const myUsername = getCurrentUsername();

  // ── Core state ───────────────────────────────────────────
  const [rooms, setRooms]             = useState([]);
  const [users, setUsers]             = useState([]);
  const [userMap, setUserMap]         = useState({});
  const [activeRoom, setActiveRoom]   = useState(null);
  const [messages, setMessages]       = useState([]);
  const [msgLoading, setMsgLoading]   = useState(false);
  const [msgError, setMsgError]       = useState('');
  const [sidebarError, setSidebarError] = useState('');
  const [sending, setSending]         = useState(false);
  const [activeTab, setActiveTab]     = useState('rooms');

  // ── WebSocket ─────────────────────────────────────────────
  const [wsStatus, setWsStatus]       = useState('disconnected');
  const [typingUser, setTypingUser]   = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});

  // ── Mobile ───────────────────────────────────────────────
  const [showChat, setShowChat] = useState(false);

  // ── Nickname refresh ─────────────────────────────────────
  const [nickVer, setNickVer] = useState(0);
  const refreshNicknames = useCallback(() => setNickVer((v) => v + 1), []);

  // ── Reply state ──────────────────────────────────────────
  const [replyTo, setReplyTo] = useState(null);

  // ── Profile modal ─────────────────────────────────────────
  const [showProfile, setShowProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // ── Toast ────────────────────────────────────────────────
  const [toast, setToast] = useState({ msg: '', type: '', show: false });
  const showToast = (msg, type = 'error') => {
    setToast({ msg, type, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500);
  };

  const typingTimerRef = useRef(null);

  // ── Auth guard ───────────────────────────────────────────
  useEffect(() => {
    if (!AuthService.isLoggedIn()) navigate('/login');
  }, [navigate]);

  // ── Load rooms + users + current user ───────────────────
  useEffect(() => {
    Promise.all([ChatService.getRooms(), ChatService.getUsers()])
      .then(([r, u]) => {
        setRooms(r);
        setUsers(u);
        setUserMap(buildUserMap(u));
      })
      .catch((err) => {
        if (err.response?.status === 401 || err.response?.status === 403) {
          AuthService.logout(); navigate('/login');
        } else {
          setSidebarError('Failed to load data.');
        }
      });

    // Load my profile for avatar display in nav
    UploadService.getMe()
      .then((res) => setCurrentUser(res.data))
      .catch(() => {}); // Non-critical — fallback to initials
  }, [navigate]);

  // ── WebSocket ────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    ws.connect(
      token,
      () => {
        setWsStatus('connected');
        ws.subscribeToPresence((event) => {
          setOnlineUsers((prev) => ({
            ...prev,
            [event.userId]: { username: event.username, status: event.status, lastSeen: event.lastSeen },
          }));
        });
      },
      () => {
        setWsStatus('error');
        showToast('WebSocket connection failed. Chat still works via REST.');
      }
    );
    return () => ws.disconnect();
  }, []);

  // ── Subscribe to active room ─────────────────────────────
  useEffect(() => {
    if (!activeRoom || wsStatus !== 'connected') return;
    ws.unsubscribeAll();

    ws.subscribeToRoom(activeRoom.id, (msg) => {
      setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
      if (msg.senderId !== myId && msg.id) ws.sendReadReceipt(msg.id);
    });

    ws.subscribeToTyping(activeRoom.id, (event) => {
      if (event.userId === myId) return;
      if (event.typing) {
        setTypingUser(event.username);
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setTypingUser(null), 3000);
      } else {
        setTypingUser(null);
      }
    });

    ws.subscribeToReadReceipts(activeRoom.id, (receipt) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === receipt.messageId) {
            const readBy = m.readBy ? [...m.readBy] : [];
            if (!readBy.includes(receipt.userId)) readBy.push(receipt.userId);
            return { ...m, readBy, lastReadAt: receipt.readAt };
          }
          return m;
        })
      );
    });

    return () => { ws.unsubscribeAll(); setTypingUser(null); };
  }, [activeRoom, wsStatus, myId]);

  // ── Load message history ─────────────────────────────────
  const loadMessages = useCallback((room) => {
    if (!room) return;
    setMsgLoading(true);
    setMsgError('');
    ChatService.getMessages(room.id)
      .then((msgs) => {
        setMessages(msgs);
        msgs.forEach((m) => {
          if (m.senderId !== myId && m.id && (!m.readBy || !m.readBy.includes(myId))) {
            ws.sendReadReceipt(m.id);
          }
        });
      })
      .catch(() => setMsgError('Could not load messages.'))
      .finally(() => setMsgLoading(false));
  }, [myId]);

  const handleSelectRoom = (room) => {
    setActiveRoom(room);
    setMessages([]);
    setTypingUser(null);
    setReplyTo(null);
    setShowChat(true);
    loadMessages(room);
  };

  // ── Private chat ─────────────────────────────────────────
  const handleStartPrivate = async (user) => {
    try {
      const room = await ChatService.startPrivate(user.id);
      HiddenChatsService.unhide(myId, room.id);
      setRooms((prev) => prev.find((r) => r.id === room.id) ? prev : [room, ...prev]);
      handleSelectRoom(room);
      setActiveTab('rooms');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to open private chat.');
    }
  };

  // ── Hide room ─────────────────────────────────────────────
  const handleHideRoom = (roomId) => {
    if (activeRoom?.id === roomId) { setActiveRoom(null); setMessages([]); setShowChat(false); }
    showToast('Chat removed from your list.', 'success');
  };

  // ── Send message ──────────────────────────────────────────
  const handleSend = (content, type = 'TEXT', attachmentData = null, replyToId = null) => {
    if (!activeRoom || !content.trim()) return;
    setSending(true);

    const payload = {
      senderId: myId,
      senderName: myUsername,
      content: content.trim(),
      type,
    };

    if (attachmentData) {
      payload.fileName = attachmentData.fileName;
      payload.fileSize = attachmentData.fileSize;
      payload.fileType = attachmentData.fileType;
      payload.publicId = attachmentData.publicId;
    }

    if (replyToId) {
      payload.replyToId = replyToId;
    }

    ws.sendMessage(activeRoom.id, payload);
    ws.sendTypingStop(activeRoom.id, { userId: myId, username: myUsername });
    setReplyTo(null);
    setSending(false);
  };

  // ── Delete message ────────────────────────────────────────
  const handleDeleteMessage = async (msg) => {
    try {
      const res = await ChatService.deleteMessage(msg.id);
      setMessages((prev) => prev.map((m) => m.id === msg.id ? res : m));
      showToast('Message deleted.', 'success');
    } catch (err) {
      if (err.response?.status === 403) showToast('You can only delete your own messages.');
      else showToast('Failed to delete message.');
    }
  };

  // ── Reply ─────────────────────────────────────────────────
  const handleReply = (msg) => {
    setReplyTo(msg);
  };

  // ── Profile saved ─────────────────────────────────────────
  const handleProfileSaved = (updatedUser) => {
    setCurrentUser(updatedUser);
    // Refresh users list so avatars update in sidebar
    ChatService.getUsers().then((u) => { setUsers(u); setUserMap(buildUserMap(u)); }).catch(() => {});
  };

  // ── Typing ────────────────────────────────────────────────
  const handleTyping = useCallback((isTyping) => {
    if (!activeRoom) return;
    const payload = { userId: myId, username: myUsername };
    if (isTyping) ws.sendTyping(activeRoom.id, payload);
    else ws.sendTypingStop(activeRoom.id, payload);
  }, [activeRoom, myId, myUsername]);

  const handleBack  = () => setShowChat(false);
  const handleLogout = () => { ws.disconnect(); AuthService.logout(); navigate('/login'); };

  // ── Nav avatar ────────────────────────────────────────────
  const navAvatarEl = currentUser?.avatarUrl
    ? <img src={currentUser.avatarUrl} alt={myUsername} className="avatar sm avatar-img" />
    : <div className={`avatar sm ${(myUsername || 'u')[0].toLowerCase()}`}>{(myUsername || '?')[0].toUpperCase()}</div>;

  return (
    <div id="chat-page">
      {/* ── NAV ──────────────────────────────────────────── */}
      <header id="chat-nav">
        <div id="chat-nav-brand">
          <div className="nav-logo">💬</div>
          <span className="nav-brand-text">Connectify</span>
        </div>
        <div id="chat-nav-right">
          <span id="ws-status" className={`ws-dot ${wsStatus}`} title={`WebSocket: ${wsStatus}`} />
          <button
            id="chat-nav-user"
            className="nav-user-btn"
            onClick={() => setShowProfile(true)}
            title="Edit profile"
          >
            {navAvatarEl}
            <span className="nav-username">{myUsername}</span>
          </button>
          <button id="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div id="chat-body">
        {/* ── SIDEBAR ──────────────────────────────────────── */}
        <aside id="chat-sidebar" className={showChat ? 'hidden' : ''}>
          <div id="sidebar-tabs">
            <button id="tab-rooms" className={`tab-btn ${activeTab === 'rooms' ? 'active' : ''}`} onClick={() => setActiveTab('rooms')}>Chats</button>
            <button id="tab-users" className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Users</button>
          </div>

          {sidebarError && <p id="sidebar-error" className="sidebar-err">{sidebarError}</p>}

          {activeTab === 'rooms' && (
            <RoomList key={nickVer} rooms={rooms} activeRoomId={activeRoom?.id} onSelect={handleSelectRoom} onlineUsers={onlineUsers} userMap={userMap} onHideRoom={handleHideRoom} />
          )}
          {activeTab === 'users' && (
            <UserList users={users} onStartPrivate={handleStartPrivate} onlineUsers={onlineUsers} />
          )}
        </aside>

        {/* ── MAIN CHAT ─────────────────────────────────────── */}
        <main id="chat-main" className={showChat ? 'visible' : ''}>
          <ChatWindow
            key={`${activeRoom?.id}-${nickVer}`}
            room={activeRoom}
            messages={messages}
            loading={msgLoading}
            error={msgError}
            typingUser={typingUser}
            onlineUsers={onlineUsers}
            onBack={handleBack}
            userMap={userMap}
            onNicknameChanged={refreshNicknames}
            onReply={handleReply}
            onDeleteMessage={handleDeleteMessage}
          />
          <MessageInput
            onSend={handleSend}
            onTyping={handleTyping}
            disabled={!activeRoom || sending}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
          />
        </main>
      </div>

      {/* ── Toast ──────────────────────────────────────────── */}
      <div className={`toast ${toast.type} ${toast.show ? 'show' : ''}`}>{toast.msg}</div>

      {/* ── Profile Modal ─────────────────────────────────── */}
      {showProfile && (
        <ProfileModal
          user={currentUser}
          onClose={() => setShowProfile(false)}
          onSaved={handleProfileSaved}
          showToast={showToast}
        />
      )}
    </div>
  );
}
