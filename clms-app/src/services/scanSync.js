// Cross-device scan sync via serverless API.
// TODO(api): Replace with WebSocket /api/scan/session/:id for production.

const DEFAULT_SCAN_ORIGIN = 'https://clms-app.vercel.app';
const DEFAULT_SESSION_ID = 'demo';
const SCAN_ORIGIN = (import.meta.env.VITE_SCAN_URL || DEFAULT_SCAN_ORIGIN).replace(/\/$/, '');
const API_BASE = (import.meta.env.VITE_SCAN_API_URL || `${SCAN_ORIGIN}/api/scan-session`).replace(/\/$/, '');

function resolveSessionId(sessionId) {
  return sessionId || DEFAULT_SESSION_ID;
}

function buildSessionUrl(sessionId) {
  const safeSession = encodeURIComponent(resolveSessionId(sessionId));
  return `${API_BASE}?session=${safeSession}`;
}

function ensureDeviceId(deviceId) {
  if (deviceId) return deviceId;
  return `device-${Math.random().toString(36).slice(2, 10)}`;
}

export async function touchScanSession(sessionId, { deviceId, deviceName } = {}) {
  try {
    const res = await fetch(buildSessionUrl(sessionId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'presence',
        deviceId: ensureDeviceId(deviceId),
        deviceName: deviceName || 'Phone scanner',
      }),
    });
    if (!res.ok) throw new Error('presence failed');
  } catch {
    // Network error — silent for demo
  }
}

export async function pushScannedBook(book, sessionId, { deviceId, deviceName } = {}) {
  try {
    const res = await fetch(buildSessionUrl(sessionId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'book',
        deviceId: ensureDeviceId(deviceId),
        deviceName: deviceName || 'Phone scanner',
        title: book.title,
        author: book.author,
        isbn: book.isbn,
      }),
    });
    if (!res.ok) throw new Error('push failed');
  } catch {
    // Network error — silent for demo
  }
}

export async function getScanSession(sessionId) {
  try {
    const res = await fetch(buildSessionUrl(sessionId));
    if (!res.ok) return { books: [], connectedDevices: [], connectedCount: 0 };
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return { books: [], connectedDevices: [], connectedCount: 0 };
    const data = await res.json();
    const connectedDevices = Array.isArray(data.connectedDevices) ? data.connectedDevices : [];
    const connectedCount = Number.isFinite(data.connectedCount) ? data.connectedCount : connectedDevices.length;
    return {
      books: data.books || [],
      connectedDevices,
      connectedCount,
    };
  } catch {
    return { books: [], connectedDevices: [], connectedCount: 0 };
  }
}

export async function getScannedBooks(sessionId) {
  const session = await getScanSession(sessionId);
  return session.books;
}

export async function clearScanSession(sessionId) {
  try {
    await fetch(buildSessionUrl(sessionId), { method: 'DELETE' });
  } catch {
    // noop
  }
}

// Poll-based listener for cross-device sync
export function startPolling(callback, intervalMs = 2000, sessionId) {
  let lastCount = 0;
  let lastConnectedCount = 0;
  let stopped = false;

  const poll = async () => {
    if (stopped) return;
    try {
      const { books, connectedDevices, connectedCount } = await getScanSession(sessionId);
      let newBooks = [];
      let hasBookDelta = false;
      const hasConnectionDelta = connectedCount !== lastConnectedCount;

      if (hasConnectionDelta) {
        lastConnectedCount = connectedCount;
      }

      if (books.length < lastCount) {
        // Session may have been reset; realign pointer so new arrivals can be detected again.
        lastCount = books.length;
      }
      if (books.length > lastCount) {
        newBooks = books.slice(lastCount);
        hasBookDelta = true;
        lastCount = books.length;
      }

      if (hasBookDelta || hasConnectionDelta) {
        callback({
          newBooks,
          books,
          connectedDevices,
          connectedCount,
          hasBookDelta,
          hasConnectionDelta,
        });
      }
    } catch {
      // silent
    }
    if (!stopped) {
      setTimeout(poll, intervalMs);
    }
  };

  // Start polling
  poll();

  // Return stop function
  return () => { stopped = true; };
}
