import { put } from '@vercel/blob';
import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return new Response(JSON.stringify({ error: 'Filename is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 上传到 Vercel Blob
    const blob = await put(filename, req.body, {
      access: 'public',
      addRandomSuffix: true,
    });

    // 保存文件元数据到 Vercel KV
    try {
      const uploadedSongs = await kv.get('uploaded-songs') || [];

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
      await kv.set('uploaded-songs', uploadedSongs);
      console.log('[Upload] Saved file metadata to KV:', fileMetadata.id);

      return new Response(JSON.stringify({
        success: true,
        file: fileMetadata,
        // 向后兼容旧格式
        url: blob.url,
        filename: filename,
        size: blob.size,
        type: blob.contentType || 'audio/mpeg',
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (kvError) {
      console.error('[Upload] Failed to save to KV:', kvError);

      // 如果 KV 保存失败，仍然返回文件 URL（降级处理）
      return new Response(JSON.stringify({
        success: true,
        warning: 'File uploaded but metadata not saved',
        url: blob.url,
        filename: filename,
        size: blob.size,
        type: blob.contentType || 'audio/mpeg',
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({
      error: 'Upload failed',
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
