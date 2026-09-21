const INSTANCES = ['https://invidious.f5.si', 'https://iv.datura.network', 'https://invidious.nerdvpn.de', 'https://yt.cdaut.de'];

async function tryFetch(path) {
  for (const inst of INSTANCES) {
    try {
      const r = await fetch(`${inst}${path}`, { signal: AbortSignal.timeout(8000) });
      if (r.ok) return await r.json();
    } catch {}
  }
  throw new Error('All Invidious instances failed');
}

function ytThumb(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const q = req.query;
  const action = q.action;

  try {
    if (action === 'search' && q.q) {
      const data = await tryFetch(`/api/v1/search?q=${encodeURIComponent(q.q)}&type=video&sort_by=relevance`);
      const results = (Array.isArray(data) ? data : data.filter?.(v => v.type === 'video') || []).slice(0, parseInt(q.limit || '25'));
      return res.json(results.map(v => ({
        id: v.videoId || '', title: v.title || 'Unknown',
        artist: v.author || 'Unknown', artistId: (v.authorId || '').replace('UC', ''),
        album: '', duration: v.lengthSeconds || 0,
        thumbnail: ytThumb(v.videoId), viewCount: v.viewCount || 0,
      })));
    }

    if (action === 'search-artists' && q.q) {
      const data = await tryFetch(`/api/v1/search?q=${encodeURIComponent(q.q)}&type=channel`);
      return res.json((Array.isArray(data) ? data : []).slice(0, parseInt(q.limit || '10')).map(ch => ({
        id: ch.authorId || '', name: ch.author || 'Unknown',
        thumbnail: ch.authorThumbnails?.[ch.authorThumbnails.length - 1]?.url || '',
        subscriberCount: parseInt(ch.subCountText) || 0,
      })));
    }

    if (action === 'artist-info' && q.channelId) {
      const ucId = q.channelId.startsWith('UC') ? q.channelId : 'UC' + q.channelId;
      const data = await tryFetch(`/api/v1/channels/${ucId}`);
      return res.json({
        id: ucId, name: data.author || 'Unknown',
        thumbnail: data.authorThumbnails?.[data.authorThumbnails.length - 1]?.url || '',
        subscriberCount: parseInt(data.subCountText) || 0,
      });
    }

    if (action === 'artist-songs' && q.channelId) {
      const ucId = q.channelId.startsWith('UC') ? q.channelId : 'UC' + q.channelId;
      const data = await tryFetch(`/api/v1/channels/${ucId}/videos`);
      return res.json((data || []).slice(0, parseInt(q.limit || '100')).map(v => ({
        id: v.videoId || '', title: v.title || 'Unknown',
        artist: v.author || 'Unknown', artistId: ucId.replace('UC', ''),
        album: '', duration: v.lengthSeconds || 0,
        thumbnail: ytThumb(v.videoId), viewCount: v.viewCount || 0,
      })));
    }

    if (action === 'stream' && q.id) {
      const data = await tryFetch(`/api/v1/videos/${q.id}`);
      const audioStreams = (data.adaptiveFormats || []).filter(f => f.type && f.type.startsWith('audio/'));
      if (!audioStreams.length) return res.status(404).json({ error: 'No audio' });
      const best = audioStreams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];

      const upstream = await fetch(best.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Referer': 'https://www.youtube.com/',
          'Origin': 'https://www.youtube.com',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!upstream.ok) return res.status(502).json({ error: 'Upstream failed' });

      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'audio/webm');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=3600');

      const reader = upstream.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) { res.end(); return; }
          res.write(value);
        }
      };
      pump().catch(() => res.end());
      req.on('close', () => { try { reader.cancel(); } catch {} });
      return;
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (e) {
    console.error('API error:', e.message);
    res.status(500).json({ error: e.message || 'Server error' });
  }
};
