/**
 * Room display helpers — resolves display names for private rooms.
 */
import NicknameService from '../services/nicknameService';

/**
 * Build a lookup map: userId → user object from a users array.
 */
export function buildUserMap(users) {
  const map = {};
  users.forEach((u) => { map[u.id] = u; });
  return map;
}

/**
 * Get the "other" user in a private room (the one who is NOT myId).
 * Returns the user object from userMap, or null.
 */
export function getOtherUser(room, myId, userMap) {
  if (!room?.memberIds) return null;
  const otherId = room.memberIds.find((id) => id !== myId);
  return otherId ? (userMap[otherId] || { id: otherId, username: 'Unknown User' }) : null;
}

/**
 * Get the display name for a room.
 * - GROUP: room.name
 * - PRIVATE: nickname > other user's username > "Unknown User"
 */
export function getRoomDisplayName(room, myId, userMap) {
  if (room.type !== 'PRIVATE') return room.name || 'Unnamed Room';

  const other = getOtherUser(room, myId, userMap);
  if (!other) return 'Unknown User';

  const nickname = NicknameService.get(myId, other.id);
  return nickname || other.username || 'Unknown User';
}

/**
 * Get the actual username of the other user (for subtitle when nickname is set).
 */
export function getOtherActualName(room, myId, userMap) {
  const other = getOtherUser(room, myId, userMap);
  return other?.username || null;
}

/**
 * Check if the other user in a private room has a nickname set.
 */
export function hasNickname(room, myId, userMap) {
  const other = getOtherUser(room, myId, userMap);
  if (!other) return false;
  return !!NicknameService.get(myId, other.id);
}
