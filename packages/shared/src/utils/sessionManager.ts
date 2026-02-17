const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const SESSION_KEY = 'simplify_session_id';
const SESSION_TS_KEY = 'simplify_session_ts';

let currentSessionId: string | null = null;
let lastActivityTs = 0;

function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Get the current session ID.
 * Generates a new one if the session has expired (30min inactivity).
 */
export function getSessionId(): string {
  const now = Date.now();

  if (currentSessionId && now - lastActivityTs < SESSION_TIMEOUT_MS) {
    lastActivityTs = now;
    return currentSessionId;
  }

  // Try to restore from sessionStorage
  if (!currentSessionId) {
    try {
      const storedId = sessionStorage.getItem(SESSION_KEY);
      const storedTs = Number(sessionStorage.getItem(SESSION_TS_KEY) || '0');
      if (storedId && now - storedTs < SESSION_TIMEOUT_MS) {
        currentSessionId = storedId;
        lastActivityTs = now;
        sessionStorage.setItem(SESSION_TS_KEY, String(now));
        return currentSessionId;
      }
    } catch {
      // sessionStorage unavailable
    }
  }

  // Start a new session
  currentSessionId = generateId();
  lastActivityTs = now;
  try {
    sessionStorage.setItem(SESSION_KEY, currentSessionId);
    sessionStorage.setItem(SESSION_TS_KEY, String(now));
  } catch {
    // ignore
  }
  return currentSessionId;
}

/**
 * Returns the timestamp of the last activity (epoch ms), or null if no session yet.
 */
export function getLastActivityTs(): number | null {
  if (lastActivityTs > 0) return lastActivityTs;
  try {
    const stored = Number(sessionStorage.getItem(SESSION_TS_KEY) || '0');
    return stored > 0 ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Check whether the current session is "new" (just created in this call cycle).
 * Useful for firing session.start only once per session.
 */
let lastNewSessionId: string | null = null;

export function isNewSession(): boolean {
  const sid = getSessionId();
  if (sid !== lastNewSessionId) {
    lastNewSessionId = sid;
    return true;
  }
  return false;
}
