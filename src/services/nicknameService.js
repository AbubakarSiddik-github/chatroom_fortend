/**
 * Nickname Service — localStorage-based per-user nicknames.
 *
 * Key pattern: connectify_nickname_<currentUserId>_<otherUserId>
 * Value: string (the nickname)
 */

const PREFIX = 'connectify_nickname_';

function key(myId, otherId) {
  return `${PREFIX}${myId}_${otherId}`;
}

const NicknameService = {
  /** Get nickname for otherUserId set by currentUserId. Returns null if not set. */
  get(myId, otherId) {
    if (!myId || !otherId) return null;
    return localStorage.getItem(key(myId, otherId)) || null;
  },

  /** Set a nickname for otherUserId. */
  set(myId, otherId, nickname) {
    if (!myId || !otherId) return;
    const trimmed = (nickname || '').trim();
    if (trimmed) {
      localStorage.setItem(key(myId, otherId), trimmed);
    } else {
      localStorage.removeItem(key(myId, otherId));
    }
  },

  /** Clear nickname — reverts to actual username. */
  clear(myId, otherId) {
    if (!myId || !otherId) return;
    localStorage.removeItem(key(myId, otherId));
  },
};

export default NicknameService;
