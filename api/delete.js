import { del } from '@vercel/blob';
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
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'DELETE') {
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

    // 从 KV 获取文件元数据
    const uploadedSongs = await kv.get('uploaded-songs') || [];
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

    // 从 KV 删除元数据
    uploadedSongs.splice(fileIndex, 1);
    await kv.set('uploaded-songs', uploadedSongs);
    console.log('[Delete] Deleted file metadata from KV:', fileId);

    return new Response(JSON.stringify({
      success: true,
      message: 'File deleted successfully',
      deletedFile: {
        id: fileMetadata.id,
        filename: fileMetadata.filename,
      },
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Delete error:', error);
    return new Response(JSON.stringify({
      error: 'Delete failed',
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
