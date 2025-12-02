import { createServer } from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_PATH = join(__dirname, 'data.json');
const PORT = Number(process.env.MOCK_PORT) || 4000;

const readDb = () => {
  const raw = readFileSync(DATA_PATH, 'utf8');
  // Strip potential BOM to avoid JSON.parse errors on Windows editors
  const clean = raw.replace(/^\uFEFF/, '');
  return JSON.parse(clean);
};

const sendJson = (res, statusCode, data) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
};

const filterByQuery = (items, q) => {
  if (!q) return items;
  const term = q.toLowerCase();
  return items.filter(item =>
    Object.values(item).some(value =>
      typeof value === 'string' && value.toLowerCase().includes(term)
    )
  );
};

const handler = (req, res) => {
  if (!req.url) return sendJson(res, 400, { error: 'Bad request' });
  if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true });

  const db = readDb();
  const { pathname, searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const segments = pathname.split('/').filter(Boolean);

  try {
    if (pathname === '/health') {
      return sendJson(res, 200, { status: 'ok', uptime: process.uptime() });
    }

    if (pathname === '/') {
      return sendJson(res, 200, {
        status: 'ok',
        message: 'Mock API ready',
        routes: [
          '/health',
          '/albums',
          '/albums/:id',
          '/albums/:id/songs',
          '/songs'
        ],
        note: 'Use Vite dev server (e.g., http://localhost:5173) for the frontend UI.'
      });
    }

    if (pathname === '/albums' && req.method === 'GET') {
      const q = searchParams.get('q');
      const items = filterByQuery(db.albums, q);
      return sendJson(res, 200, { items, count: items.length });
    }

    if (segments[0] === 'albums' && segments[1]) {
      const album = db.albums.find(a => a.id === segments[1]);
      if (!album) return sendJson(res, 404, { error: 'Album not found' });

      if (segments[2] === 'songs') {
        const songs = db.songs.filter(s => s.albumId === album.id);
        return sendJson(res, 200, { album, songs, count: songs.length });
      }

      return sendJson(res, 200, album);
    }

    if (pathname === '/songs' && req.method === 'GET') {
      const q = searchParams.get('q');
      const items = filterByQuery(db.songs, q);
      return sendJson(res, 200, { items, count: items.length });
    }

    return sendJson(res, 404, { error: 'Route not found' });
  } catch (error) {
    console.error('Mock server error:', error);
    return sendJson(res, 500, { error: 'Internal error' });
  }
};

const startServer = (port, attempt = 0) => {
  const server = createServer(handler);

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempt < 5) {
      const nextPort = port + 1;
      console.warn(`[mock] Port ${port} in use, retrying on ${nextPort}...`);
      setTimeout(() => startServer(nextPort, attempt + 1), 150);
      return;
    }

    console.error('[mock] Failed to start server:', err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`Mock API running on http://localhost:${port}`);
  });
};

startServer(PORT);
