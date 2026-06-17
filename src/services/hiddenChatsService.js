/**
 * Hidden Chats Service — localStorage-based per-user hidden room IDs.
 *
 * Key pattern: connectify_hidden_chats_<currentUserId>
 * Value: JSON array of room IDs
 */

const PREFIX = 'connectify_hidden_chats_';

function storageKey(myId) {
  return `${PREFIX}${myId}`;
}

function getAll(myId) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(myId)) || '[]');
  } catch {
    return [];
  }
}

function save(myId, ids) {
  localStorage.setItem(storageKey(myId), JSON.stringify(ids));
}

const HiddenChatsService = {
  /** Returns true if roomId is hidden for this user. */
  isHidden(myId, roomId) {
    return getAll(myId).includes(roomId);
  },

  /** Hide a room for this user. */
  hide(myId, roomId) {
    const ids = getAll(myId);
    if (!ids.includes(roomId)) {
      ids.push(roomId);
      save(myId, ids);
    }
  },

  /** Unhide a room (e.g., when starting private chat again). */
  unhide(myId, roomId) {
    const ids = getAll(myId).filter((id) => id !== roomId);
    save(myId, ids);
  },

  /** Get all hidden room IDs. */
  getHiddenIds(myId) {
    return getAll(myId);
  },
};

export default HiddenChatsService;
