import albums from '../mock/data.json' assert { type: 'json' };

export default function handler(req, res) {
  const { q } = req.query;

  if (q) {
    const filtered = albums.filter(album =>
      album.title.toLowerCase().includes(q.toLowerCase()) ||
      album.artist.toLowerCase().includes(q.toLowerCase())
    );
    return res.status(200).json(filtered);
  }

  res.status(200).json(albums);
}
