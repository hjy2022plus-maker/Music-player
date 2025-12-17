import { put } from '@vercel/blob';
import { redisHelpers } from '../lib/redis.js';

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename } = req.query;

    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    // 上传到 Vercel Blob
    const blob = await put(filename, req, {
      access: 'public',
      addRandomSuffix: true,
    });

    // 保存文件元数据到 Redis
    try {
      const uploadedSongs = await redisHelpers.getJSON('uploaded-songs') || [];

      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const uploadedAt = new Date().toISOString();

      const fileMetadata = {
        // 文件标识
        id: fileId,
        blobId: blob.pathname, // Blob Storage 中的路径标识

        // 文件信息
        filename: filename,
        originalName: filename,
        size: blob.size,
        mimeType: blob.contentType || 'audio/mpeg',

        // Blob Storage URL
        url: blob.url,
        downloadUrl: blob.downloadUrl,

        // 音乐元数据（可后续通过 ID3 标签更新）
        title: filename.replace(/\.[^/.]+$/, ''),
        artist: 'Unknown Artist',
        album: 'Uploaded',
        duration: '0:00',
        cover: '/covers/default.jpg',
        accentColor: '#ff006e',

        // 时间戳
        uploadedAt: uploadedAt,
        createdAt: uploadedAt,
        updatedAt: uploadedAt,

        // 业务关联（可扩展）
        userId: null, // 后续可添加用户系统
        tags: ['uploaded'],

        // 状态
        status: 'active', // active, deleted, processing
      };

      uploadedSongs.push(fileMetadata);
      await redisHelpers.setJSON('uploaded-songs', uploadedSongs);
      console.log('[Upload] Saved file metadata to Redis:', fileMetadata.id);

      return res.status(200).json({
        success: true,
        file: fileMetadata,
        // 向后兼容旧格式
        url: blob.url,
        filename: filename,
        size: blob.size,
        type: blob.contentType || 'audio/mpeg',
      });
    } catch (kvError) {
      console.error('[Upload] Failed to save to Redis:', kvError);

      // 如果 Redis 保存失败，仍然返回文件 URL（降级处理）
      return res.status(200).json({
        success: true,
        warning: 'File uploaded but metadata not saved',
        url: blob.url,
        filename: filename,
        size: blob.size,
        type: blob.contentType || 'audio/mpeg',
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      error: 'Upload failed',
      message: error.message,
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
