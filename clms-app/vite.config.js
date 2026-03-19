/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = path.dirname(fileURLToPath(import.meta.url));

function scanSessionDevApi() {
  const sessions = new Map();
  const CONNECTION_TTL_MS = 15 * 1000;

  const cleanOldSessions = () => {
    const cutoff = Date.now() - 30 * 60 * 1000;
    for (const [id, session] of sessions) {
      if ((session.updatedAt || session.createdAt) < cutoff) sessions.delete(id);
    }
  };

  const createSession = () => ({
    books: [],
    devices: new Map(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const getOrCreateSession = (sessionId) => {
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, createSession());
    }
    return sessions.get(sessionId);
  };

  const pruneDevices = (session) => {
    const cutoff = Date.now() - CONNECTION_TTL_MS;
    for (const [deviceId, info] of session.devices) {
      if (info.lastSeen < cutoff) session.devices.delete(deviceId);
    }
  };

  const touchDevice = (session, deviceId, deviceName) => {
    if (!deviceId) return;
    session.devices.set(deviceId, {
      name: deviceName || 'Phone scanner',
      lastSeen: Date.now(),
    });
    session.updatedAt = Date.now();
  };

  const formatSessionResponse = (session) => {
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
  };

  const readJson = (req) => new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
  });

  return {
    name: 'scan-session-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/scan-session', async (req, res, next) => {
        if (!req.url) {
          next();
          return;
        }

        const url = new URL(req.url, 'http://localhost');
        const sessionId = url.searchParams.get('session') || 'default';

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        cleanOldSessions();

        if (req.method === 'GET') {
          const session = sessions.get(sessionId) || createSession();
          res.statusCode = 200;
          res.end(JSON.stringify(formatSessionResponse(session)));
          return;
        }

        if (req.method === 'POST') {
          const session = getOrCreateSession(sessionId);
          const payload = await readJson(req);

          if (payload.deviceId) {
            touchDevice(session, payload.deviceId, payload.deviceName);
          }

          if (payload.type === 'presence') {
            res.statusCode = 200;
            res.end(JSON.stringify(formatSessionResponse(session)));
            return;
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
          res.statusCode = 200;
          res.end(JSON.stringify(formatSessionResponse(session)));
          return;
        }

        if (req.method === 'DELETE') {
          sessions.delete(sessionId);
          res.statusCode = 200;
          res.end(JSON.stringify({ books: [] }));
          return;
        }

        res.statusCode = 405;
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      });
    },
  };
}

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react(), tailwindcss(), scanSessionDevApi()],
  test: {
    projects: [{
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        },
        setupFiles: ['.storybook/vitest.setup.js']
      }
    }]
  }
});
