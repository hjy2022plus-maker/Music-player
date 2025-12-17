import { del } from '@vercel/blob';
import { redisHelpers } from '../lib/redis.js';

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id: fileId } = req.query;

    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    // 从 Redis 获取文件元数据
    const uploadedSongs = await redisHelpers.getJSON('uploaded-songs') || [];
    const fileIndex = uploadedSongs.findIndex(f => f.id === fileId);

    if (fileIndex === -1) {
      return res.status(404).json({ error: 'File not found' });
    }

    const fileMetadata = uploadedSongs[fileIndex];

    // 从 Vercel Blob Storage 删除文件
    try {
      if (fileMetadata.url) {
        await del(fileMetadata.url);
        console.log('[Delete] Deleted file from Blob Storage:', fileMetadata.url);
      }
    } catch (blobError) {
      console.error('[Delete] Failed to delete from Blob Storage:', blobError);
      // 继续删除元数据，即使 Blob 删除失败
    }

    // 从 Redis 删除元数据
    uploadedSongs.splice(fileIndex, 1);
    await redisHelpers.setJSON('uploaded-songs', uploadedSongs);
    console.log('[Delete] Deleted file metadata from Redis:', fileId);

    return res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      deletedFile: {
        id: fileMetadata.id,
        filename: fileMetadata.filename,
      },
    });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({
      error: 'Delete failed',
      message: error.message,
    });
  }
}
