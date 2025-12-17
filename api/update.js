import { redisHelpers } from '../lib/redis.js';

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id: fileId } = req.query;

    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    const body = req.body;

    // 从 Redis 获取文件列表
    const uploadedSongs = await redisHelpers.getJSON('uploaded-songs') || [];
    const fileIndex = uploadedSongs.findIndex(f => f.id === fileId);

    if (fileIndex === -1) {
      return res.status(404).json({ error: 'File not found' });
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

    // 更新元数据
    const updatedFile = {
      ...currentFile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    uploadedSongs[fileIndex] = updatedFile;
    await redisHelpers.setJSON('uploaded-songs', uploadedSongs);
    console.log('[Update] Updated file metadata:', fileId);

    return res.status(200).json({
      success: true,
      file: updatedFile,
    });
  } catch (error) {
    console.error('Update error:', error);
    return res.status(500).json({
      error: 'Update failed',
      message: error.message,
    });
  }
}
