/**
 * Decode the JWT stored in localStorage and return the payload.
 * Returns null if no token or decode fails.
 */
export function getJwtPayload() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded  = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

/** Returns the current user's MongoDB id from the JWT subject claim. */
export function getCurrentUserId() {
  return getJwtPayload()?.sub ?? null;
}

/** Returns the current user's username from the JWT. */
export function getCurrentUsername() {
  return getJwtPayload()?.username ?? null;
}

/** Format an ISO timestamp to HH:MM. */
export function formatTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}
