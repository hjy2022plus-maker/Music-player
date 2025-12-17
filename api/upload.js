export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'POST') {
    try {
      // Vercel Serverless Functions have limitations on file uploads
      // For production, recommend using cloud storage (Cloudinary, S3, etc.)

      // For now, return a mock response
      const mockUrl = `https://picsum.photos/seed/${Date.now()}/400/400`;

      return res.status(200).json({
        url: mockUrl,
        filename: `${Date.now()}_upload.mp3`,
        size: 0,
        type: 'audio/mpeg',
        note: 'Mock upload - consider using Cloudinary or S3 for production'
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Upload failed',
        detail: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
