import { redisHelpers } from '../lib/redis.js';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req) {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PUT, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const url = new URL(req.url);
    const fileId = url.searchParams.get('id');

    if (!fileId) {
      return new Response(JSON.stringify({ error: 'File ID is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const body = await req.json();

    // 从 Redis 获取文件列表
    const uploadedSongs = await redisHelpers.getJSON('uploaded-songs') || [];
    const fileIndex = uploadedSongs.findIndex(f => f.id === fileId);

    if (fileIndex === -1) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
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

    return new Response(JSON.stringify({
      success: true,
      file: updatedFile,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Update error:', error);
    return new Response(JSON.stringify({
      error: 'Update failed',
      message: error.message,
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
