import { createServer } from 'http';
import { readFileSync, writeFileSync, mkdirSync, existsSync, createReadStream, unlinkSync } from 'fs';
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

const writeDb = (data) => {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
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

      // 新模式：直接传递文件作为 body，filename 在查询参数中
      if (!boundaryMatch && searchParams.get('filename')) {
        try {
          const filename = searchParams.get('filename');
          const chunks = [];

          req.on('data', (chunk) => chunks.push(chunk));
          req.on('error', (error) => {
            console.error('Upload error:', error);
            sendJson(res, 400, { error: 'Upload failed', detail: error.message });
          });
          req.on('end', () => {
            try {
              const data = Buffer.concat(chunks);
              ensureUploadDir();

              const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '') || 'upload.bin';
              const savedName = `${Date.now()}_${safeName}`;
              const filePath = join(UPLOAD_DIR, savedName);
              writeFileSync(filePath, data);

              const host = req.headers.host || `localhost:${PORT}`;
              const proto = req.headers['x-forwarded-proto'] || 'http';
              const fileUrl = `${proto}://${host}/uploads/${savedName}`;

              // 保存歌曲信息到 data.json
              try {
                const db = readDb();
                if (!db.uploadedSongs) {
                  db.uploadedSongs = [];
                }

                const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const uploadedAt = new Date().toISOString();

                const fileMetadata = {
                  id: fileId,
                  blobId: savedName,
                  filename: savedName,
                  originalName: safeName,
                  size: data.length,
                  mimeType: contentType || 'audio/mpeg',
                  url: fileUrl,
                  downloadUrl: fileUrl,
                  title: safeName.replace(/\.[^/.]+$/, ''),
                  artist: 'Unknown Artist',
                  album: 'Uploaded',
                  duration: '0:00',
                  cover: '/covers/default.jpg',
                  accentColor: '#ff006e',
                  uploadedAt: uploadedAt,
                  createdAt: uploadedAt,
                  updatedAt: uploadedAt,
                  userId: null,
                  tags: ['uploaded'],
                  status: 'active',
                };

                db.uploadedSongs.push(fileMetadata);
                writeDb(db);
                console.log('[Upload] Saved song info to database:', fileMetadata.title);

                return sendJson(res, 200, {
                  success: true,
                  file: fileMetadata,
                  url: fileUrl,
                  filename: savedName,
                  size: data.length,
                  type: contentType || 'audio/mpeg'
                });
              } catch (dbError) {
                console.error('[Upload] Failed to save to database:', dbError);
                return sendJson(res, 200, {
                  success: true,
                  warning: 'File uploaded but metadata not saved',
                  url: fileUrl,
                  filename: savedName,
                  size: data.length,
                  type: contentType || 'audio/mpeg'
                });
              }
            } catch (error) {
              console.error('Upload processing error:', error);
              return sendJson(res, 400, { error: 'Upload failed', detail: error.message });
            }
          });
          return; // 等待异步处理
        } catch (error) {
          console.error('Upload error:', error);
          return sendJson(res, 400, { error: 'Upload failed', detail: error.message });
        }
      }

      // 旧模式：multipart/form-data（向后兼容）
      if (!boundaryMatch) return sendJson(res, 400, { error: 'Missing multipart boundary or filename parameter' });

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

        // 保存歌曲信息到 data.json
        try {
          const db = readDb();
          if (!db.uploadedSongs) {
            db.uploadedSongs = [];
          }

          const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const uploadedAt = new Date().toISOString();

          const fileMetadata = {
            // 文件标识
            id: fileId,
            blobId: savedName, // 本地文件名作为标识

            // 文件信息
            filename: savedName,
            originalName: safeName,
            size: data.length,
            mimeType: fileType,

            // 文件 URL
            url: fileUrl,
            downloadUrl: fileUrl,

            // 音乐元数据（可后续通过 ID3 标签更新）
            title: safeName.replace(/\.[^/.]+$/, ''),
            artist: 'Unknown Artist',
            album: 'Uploaded',
            duration: '0:00',
            cover: '/covers/default.jpg',
            accentColor: '#ff006e',

            // 时间戳
            uploadedAt: uploadedAt,
            createdAt: uploadedAt,
            updatedAt: uploadedAt,

            // 业务关联
            userId: null,
            tags: ['uploaded'],

            // 状态
            status: 'active',
          };

          db.uploadedSongs.push(fileMetadata);
          writeDb(db);
          console.log('[Upload] Saved song info to database:', fileMetadata.title);

          return sendJson(res, 200, {
            success: true,
            file: fileMetadata,
            // 向后兼容
            url: fileUrl,
            filename: savedName,
            size: data.length,
            type: fileType
          });
        } catch (dbError) {
          console.error('[Upload] Failed to save to database:', dbError);
          return sendJson(res, 200, {
            success: true,
            warning: 'File uploaded but metadata not saved',
            url: fileUrl,
            filename: savedName,
            size: data.length,
            type: fileType
          });
        }
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

    if (pathname === '/uploaded-songs' && req.method === 'GET') {
      const uploadedSongs = db.uploadedSongs || [];
      return sendJson(res, 200, { items: uploadedSongs, count: uploadedSongs.length });
    }

    if (pathname === '/delete' && req.method === 'DELETE') {
      const fileId = searchParams.get('id');
      if (!fileId) {
        return sendJson(res, 400, { error: 'File ID is required' });
      }

      const uploadedSongs = db.uploadedSongs || [];
      const fileIndex = uploadedSongs.findIndex(f => f.id === fileId);

      if (fileIndex === -1) {
        return sendJson(res, 404, { error: 'File not found' });
      }

      const fileMetadata = uploadedSongs[fileIndex];

      // 删除文件本体
      try {
        const filePath = join(UPLOAD_DIR, fileMetadata.filename);
        if (existsSync(filePath)) {
          unlinkSync(filePath);
          console.log('[Delete] Deleted file:', filePath);
        }
      } catch (fileError) {
        console.error('[Delete] Failed to delete file:', fileError);
      }

      // 删除元数据
      uploadedSongs.splice(fileIndex, 1);
      db.uploadedSongs = uploadedSongs;
      writeDb(db);
      console.log('[Delete] Deleted file metadata:', fileId);

      return sendJson(res, 200, {
        success: true,
        message: 'File deleted successfully',
        deletedFile: {
          id: fileMetadata.id,
          filename: fileMetadata.filename,
        }
      });
    }

    if (pathname === '/update' && (req.method === 'PUT' || req.method === 'PATCH')) {
      const fileId = searchParams.get('id');
      if (!fileId) {
        return sendJson(res, 400, { error: 'File ID is required' });
      }

      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => {
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString());
          const uploadedSongs = db.uploadedSongs || [];
          const fileIndex = uploadedSongs.findIndex(f => f.id === fileId);

          if (fileIndex === -1) {
            return sendJson(res, 404, { error: 'File not found' });
          }

          const currentFile = uploadedSongs[fileIndex];

          // 更新允许的字段
          const updatableFields = [
            'title', 'artist', 'album', 'duration', 'cover',
            'accentColor', 'tags', 'status'
          ];

          const updates = {};
          for (const field of updatableFields) {
            if (body[field] !== undefined) {
              updates[field] = body[field];
            }
          }

          const updatedFile = {
            ...currentFile,
            ...updates,
            updatedAt: new Date().toISOString(),
          };

          uploadedSongs[fileIndex] = updatedFile;
          db.uploadedSongs = uploadedSongs;
          writeDb(db);
          console.log('[Update] Updated file metadata:', fileId);

          return sendJson(res, 200, {
            success: true,
            file: updatedFile,
          });
        } catch (error) {
          return sendJson(res, 400, { error: 'Invalid JSON body' });
        }
      });

      return; // 等待 req.on('end')
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
