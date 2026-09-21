const PIPED = 'https://pipedapi.kavin.rocks';

function mapVideo(v) {
  return {
    id: (v.url || '').split('v=')[1] || (v.url || '').split('/').pop() || v.uid || '',
    title: v.title || 'Unknown',
    artist: v.uploaderName || v.uploader || 'Unknown',
    artistId: (v.uploaderUrl || '').split('/channel/')[1] || (v.uploaderUrl || '').split('/@')[1] || '',
    album: '', duration: v.duration || 0,
    thumbnail: v.thumbnail || '', viewCount: v.views || 0,
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const q = req.query;
  const action = q.action;

  try {
    if (action === 'search' && q.q) {
      const r = await fetch(`${PIPED}/search?q=${encodeURIComponent(q.q)}&filter=videos`);
      const data = await r.json();
      return res.json((data.items || []).slice(0, parseInt(q.limit || '25')).map(mapVideo));
    }

    if (action === 'search-artists' && q.q) {
      const r = await fetch(`${PIPED}/search?q=${encodeURIComponent(q.q)}&filter=channels`);
      const data = await r.json();
      return res.json((data.items || []).slice(0, parseInt(q.limit || '10')).map(ch => ({
        id: (ch.url || '').split('/channel/')[1] || (ch.url || '').split('/@')[1] || '',
        name: ch.name || 'Unknown', thumbnail: ch.thumbnail || '',
        subscriberCount: ch.subscribers || 0,
      })));
    }

    if (action === 'artist-info' && q.channelId) {
      const r = await fetch(`${PIPED}/channel/${q.channelId}`);
      const data = await r.json();
      return res.json({ id: q.channelId, name: data.name || 'Unknown',
        thumbnail: data.thumbnail || '', subscriberCount: data.subscribers || 0 });
    }

    if (action === 'artist-songs' && q.channelId) {
      const r = await fetch(`${PIPED}/channel/${q.channelId}`);
      const data = await r.json();
      const videos = (data.relatedStreams || []).filter(v => v.type === 'stream');
      return res.json(videos.slice(0, parseInt(q.limit || '100')).map(mapVideo));
    }

    if (action === 'stream' && q.id) {
      const r = await fetch(`${PIPED}/streams/${q.id}`);
      const data = await r.json();
      const audioStreams = data.audioStreams || [];
      if (!audioStreams.length) return res.status(404).json({ error: 'No audio found' });
      const best = audioStreams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
      // Return stream URL for client-side playback
      return res.json({ url: best.url, type: best.mimeType || 'audio/webm' });
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (e) {
    console.error('API error:', e.message);
    res.status(500).json({ error: e.message || 'Server error' });
  }
};
