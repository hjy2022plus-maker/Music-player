import { createServer } from 'http';
import { readFileSync, writeFileSync, mkdirSync, existsSync, createReadStream } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_PATH = join(__dirname, 'data.json');
const UPLOAD_DIR = join(__dirname, 'uploads');
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
    'Access-Control-Allow-Methods': 'GET,OPTIONS,POST',
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

const ensureUploadDir = () => {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
};

const parseMultipartForm = (req, boundary) => new Promise((resolve, reject) => {
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('error', reject);
  req.on('end', () => {
    const buffer = Buffer.concat(chunks);
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const boundaryEndBuffer = Buffer.from(`--${boundary}--`);
    let start = buffer.indexOf(boundaryBuffer);

    while (start !== -1) {
      const headerStart = start + boundaryBuffer.length + 2; // skip boundary + CRLF
      const headerEnd = buffer.indexOf(Buffer.from('\r\n\r\n'), headerStart);
      if (headerEnd === -1) break;

      const headers = buffer.slice(headerStart, headerEnd).toString('utf8');
      const dispositionMatch = /name="([^"]+)"(?:;\s*filename="([^"]+)")?/i.exec(headers);
      if (dispositionMatch && dispositionMatch[2]) {
        const contentTypeMatch = /Content-Type:\s*([^\r\n]+)/i.exec(headers);
        const contentStart = headerEnd + 4;
        let nextBoundary = buffer.indexOf(boundaryBuffer, contentStart);
        if (nextBoundary === -1) {
          nextBoundary = buffer.indexOf(boundaryEndBuffer, contentStart);
        }
        const contentEnd = nextBoundary > 0 ? nextBoundary - 2 : buffer.length; // drop trailing CRLF
        const fileData = buffer.slice(contentStart, contentEnd);

        return resolve({
          filename: dispositionMatch[2],
          contentType: contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream',
          data: fileData
        });
      }

      start = buffer.indexOf(boundaryBuffer, headerEnd);
    }

    reject(new Error('No file part in multipart payload'));
  });
});

const handler = async (req, res) => {
  if (!req.url) return sendJson(res, 400, { error: 'Bad request' });
  if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true });

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
          '/songs',
          '/upload (POST multipart/form-data)'
        ],
        note: 'Use Vite dev server (e.g., http://localhost:5173) for the frontend UI.'
      });
    }

    if (pathname === '/upload' && req.method === 'POST') {
      const contentType = req.headers['content-type'] || '';
      const boundaryMatch = /boundary=([^;]+)/i.exec(contentType);
      if (!boundaryMatch) return sendJson(res, 400, { error: 'Missing multipart boundary' });

      try {
        const { filename, data, contentType: fileType } = await parseMultipartForm(req, boundaryMatch[1]);
        ensureUploadDir();

        const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '') || 'upload.bin';
        const savedName = `${Date.now()}_${safeName}`;
        const filePath = join(UPLOAD_DIR, savedName);
        writeFileSync(filePath, data);

        const host = req.headers.host || `localhost:${PORT}`;
        const proto = req.headers['x-forwarded-proto'] || 'http';
        const fileUrl = `${proto}://${host}/uploads/${savedName}`;

        return sendJson(res, 200, { url: fileUrl, filename: savedName, size: data.length, type: fileType });
      } catch (error) {
        console.error('Upload error:', error);
        return sendJson(res, 400, { error: 'Upload failed', detail: error.message });
      }
    }

    if (segments[0] === 'uploads' && segments[1]) {
      ensureUploadDir();
      const targetPath = join(UPLOAD_DIR, ...segments.slice(1));
      if (!targetPath.startsWith(UPLOAD_DIR)) {
        return sendJson(res, 400, { error: 'Invalid path' });
      }
      if (!existsSync(targetPath)) {
        return sendJson(res, 404, { error: 'File not found' });
      }

      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Access-Control-Allow-Origin': '*'
      });
      return createReadStream(targetPath).pipe(res);
    }

    const db = readDb();

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
