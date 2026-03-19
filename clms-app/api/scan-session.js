// Simple in-memory scan session store for demo purposes.
// Persists as long as the serverless function instance is warm (~5 min).
// For production: replace with a real database or Redis.

const sessions = new Map();
const CONNECTION_TTL_MS = 15 * 1000;

// Auto-clean sessions older than 30 minutes
function cleanOldSessions() {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [id, session] of sessions) {
    if ((session.updatedAt || session.createdAt) < cutoff) sessions.delete(id);
  }
}

function createSession() {
  return {
    books: [],
    devices: new Map(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function getOrCreateSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, createSession());
  }
  return sessions.get(sessionId);
}

function pruneDevices(session) {
  const cutoff = Date.now() - CONNECTION_TTL_MS;
  for (const [deviceId, info] of session.devices) {
    if (info.lastSeen < cutoff) session.devices.delete(deviceId);
  }
}

function touchDevice(session, deviceId, deviceName) {
  if (!deviceId) return;
  session.devices.set(deviceId, {
    name: deviceName || 'Phone scanner',
    lastSeen: Date.now(),
  });
  session.updatedAt = Date.now();
}

function formatSessionResponse(session) {
  pruneDevices(session);
  const connectedDevices = Array.from(session.devices.entries()).map(([id, device]) => ({
    id,
    name: device.name,
    lastSeen: device.lastSeen,
  }));
  return {
    books: session.books,
    connectedDevices,
    connectedCount: connectedDevices.length,
  };
}

export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sessionId = req.query.session || 'default';

  cleanOldSessions();

  // GET — poll for books
  if (req.method === 'GET') {
    const session = sessions.get(sessionId) || createSession();
    return res.status(200).json(formatSessionResponse(session));
  }

  // POST — presence heartbeat or add a book
  if (req.method === 'POST') {
    const session = getOrCreateSession(sessionId);
    const payload = req.body || {};

    if (payload.deviceId) {
      touchDevice(session, payload.deviceId, payload.deviceName);
    }

    if (payload.type === 'presence') {
      return res.status(200).json(formatSessionResponse(session));
    }

    if (payload && payload.title) {
      session.books.push({
        title: payload.title,
        author: payload.author,
        isbn: payload.isbn,
        deviceId: payload.deviceId || null,
        deviceName: payload.deviceName || null,
        syncedAt: Date.now(),
      });
      session.updatedAt = Date.now();
    }
    return res.status(200).json(formatSessionResponse(session));
  }

  // DELETE — clear session
  if (req.method === 'DELETE') {
    sessions.delete(sessionId);
    return res.status(200).json({ books: [] });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
