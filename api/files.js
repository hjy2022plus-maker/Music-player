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
    const uploadedFiles = await redisHelpers.getJSON('uploaded-songs') || [];

    return res.status(200).json({
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length,
    });
  } catch (error) {
    console.error('Get files error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get files',
      message: error.message,
    });
  }
}
