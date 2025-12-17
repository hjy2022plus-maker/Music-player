import { redisHelpers } from '../lib/redis.js';

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 从 Redis 获取已上传的歌曲列表
    const uploadedSongs = await redisHelpers.getJSON('uploaded-songs') || [];

    return res.status(200).json({
      items: uploadedSongs,
      count: uploadedSongs.length,
    });
  } catch (error) {
    console.error('Get songs error:', error);
    return res.status(500).json({
      error: 'Failed to get songs',
      message: error.message,
    });
  }
}
