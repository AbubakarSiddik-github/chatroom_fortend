/**
 * Connectify WebSocket Service
 * STOMP over SockJS — connects to Spring Boot backend.
 */
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';

let stompClient = null;
let roomSub     = null;
let typingSub   = null;
let readSub     = null;
let presenceSub = null;

/**
 * Connect to the WebSocket server.
 * @param {string} token        JWT from localStorage
 * @param {Function} onConnected  callback when STOMP CONNECTED
 * @param {Function} onError      callback on connection error
 */
export function connect(token, onConnected, onError) {
  if (stompClient?.connected) {
    onConnected?.();
    return;
  }

  stompClient = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    onConnect: () => {
      console.log('[WS] Connected');
      onConnected?.();
    },

    onStompError: (frame) => {
      console.error('[WS] STOMP error:', frame.headers?.message);
      onError?.(frame.headers?.message || 'STOMP error');
    },

    onWebSocketError: (evt) => {
      console.error('[WS] WebSocket error:', evt);
      onError?.('WebSocket connection failed');
    },

    onDisconnect: () => {
      console.log('[WS] Disconnected');
    },
  });

  stompClient.activate();
}

/** Disconnect from the WebSocket server. */
export function disconnect() {
  if (stompClient) {
    try { stompClient.deactivate(); } catch (_) {}
    stompClient = null;
  }
  roomSub = null;
  typingSub = null;
  readSub = null;
  presenceSub = null;
}

/** Returns true if the STOMP client is currently connected. */
export function isConnected() {
  return stompClient?.connected === true;
}

// ── Room messages ──────────────────────────────────────────────────────────

/**
 * Subscribe to /topic/room/{roomId}.
 * @param {string} roomId
 * @param {Function} callback — receives parsed message object
 */
export function subscribeToRoom(roomId, callback) {
  unsubscribeFromRoom();
  if (!stompClient?.connected) return;

  roomSub = stompClient.subscribe(`/topic/room/${roomId}`, (frame) => {
    try { callback(JSON.parse(frame.body)); } catch (_) {}
  });
}

/** Unsubscribe from the current room topic. */
export function unsubscribeFromRoom() {
  if (roomSub) { try { roomSub.unsubscribe(); } catch (_) {} roomSub = null; }
}

/**
 * Send a chat message via STOMP to /app/chat/{roomId}.
 * @param {string} roomId
 * @param {object} payload — { senderId, senderName, content, type }
 */
export function sendMessage(roomId, payload) {
  if (!stompClient?.connected) return;
  stompClient.publish({
    destination: `/app/chat/${roomId}`,
    body: JSON.stringify({ ...payload, roomId }),
  });
}

// ── Typing indicator ───────────────────────────────────────────────────────

/**
 * Subscribe to /topic/typing/{roomId}.
 */
export function subscribeToTyping(roomId, callback) {
  unsubscribeFromTyping();
  if (!stompClient?.connected) return;

  typingSub = stompClient.subscribe(`/topic/typing/${roomId}`, (frame) => {
    try { callback(JSON.parse(frame.body)); } catch (_) {}
  });
}

function unsubscribeFromTyping() {
  if (typingSub) { try { typingSub.unsubscribe(); } catch (_) {} typingSub = null; }
}

export function sendTyping(roomId, payload) {
  if (!stompClient?.connected) return;
  stompClient.publish({
    destination: `/app/typing/${roomId}`,
    body: JSON.stringify(payload),
  });
}

export function sendTypingStop(roomId, payload) {
  if (!stompClient?.connected) return;
  stompClient.publish({
    destination: `/app/typing-stop/${roomId}`,
    body: JSON.stringify(payload),
  });
}

// ── Presence ───────────────────────────────────────────────────────────────

export function subscribeToPresence(callback) {
  if (presenceSub) { try { presenceSub.unsubscribe(); } catch (_) {} presenceSub = null; }
  if (!stompClient?.connected) return;

  presenceSub = stompClient.subscribe('/topic/presence', (frame) => {
    try { callback(JSON.parse(frame.body)); } catch (_) {}
  });
}

// ── Read receipts ──────────────────────────────────────────────────────────

export function subscribeToReadReceipts(roomId, callback) {
  unsubscribeFromReadReceipts();
  if (!stompClient?.connected) return;

  readSub = stompClient.subscribe(`/topic/read/${roomId}`, (frame) => {
    try { callback(JSON.parse(frame.body)); } catch (_) {}
  });
}

function unsubscribeFromReadReceipts() {
  if (readSub) { try { readSub.unsubscribe(); } catch (_) {} readSub = null; }
}

/**
 * Send read receipt via STOMP /app/read/{messageId}.
 */
export function sendReadReceipt(messageId) {
  if (!stompClient?.connected) return;
  stompClient.publish({
    destination: `/app/read/${messageId}`,
    body: '{}',
  });
}

/** Cleanup all room-level subscriptions (typing + read + room). */
export function unsubscribeAll() {
  unsubscribeFromRoom();
  unsubscribeFromTyping();
  unsubscribeFromReadReceipts();
}
