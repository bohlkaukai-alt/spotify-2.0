const INSTANCES = ['https://invidious.f5.si', 'https://iv.datura.network', 'https://invidious.nerdvpn.de', 'https://yt.cdaut.de'];

async function tryInvidious(path) {
  for (const inst of INSTANCES) {
    try {
      const r = await fetch(`${inst}${path}`, { signal: AbortSignal.timeout(10000) });
      if (r.ok) return { data: await r.json(), inst };
    } catch {}
  }
  throw new Error('All Invidious instances failed');
}

function ytThumb(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const q = req.query;
  const action = q.action;

  try {
    if (action === 'search' && q.q) {
      const { data } = await tryInvidious(`/api/v1/search?q=${encodeURIComponent(q.q)}&type=video&sort_by=relevance`);
      const items = Array.isArray(data) ? data : [];
      return res.json(items.filter(v => v.type === 'video').slice(0, parseInt(q.limit || '25')).map(v => ({
        id: v.videoId || '', title: v.title || 'Unknown',
        artist: v.author || 'Unknown', artistId: (v.authorId || '').replace('UC', ''),
        album: '', duration: v.lengthSeconds || 0,
        thumbnail: ytThumb(v.videoId), viewCount: v.viewCount || 0,
      })));
    }

    if (action === 'search-artists' && q.q) {
      const { data } = await tryInvidious(`/api/v1/search?q=${encodeURIComponent(q.q)}&type=channel`);
      const items = Array.isArray(data) ? data : [];
      return res.json(items.slice(0, parseInt(q.limit || '10')).map(ch => ({
        id: ch.authorId || '', name: ch.author || 'Unknown',
        thumbnail: ch.authorThumbnails?.[ch.authorThumbnails.length - 1]?.url || '',
        subscriberCount: parseInt(ch.subCountText) || 0,
      })));
    }

    if (action === 'artist-info' && q.channelId) {
      const ucId = q.channelId.startsWith('UC') ? q.channelId : 'UC' + q.channelId;
      const { data } = await tryInvidious(`/api/v1/channels/${ucId}`);
      return res.json({
        id: ucId, name: data.author || 'Unknown',
        thumbnail: data.authorThumbnails?.[data.authorThumbnails.length - 1]?.url || '',
        subscriberCount: parseInt(data.subCountText) || 0,
      });
    }

    if (action === 'artist-songs' && q.channelId) {
      const ucId = q.channelId.startsWith('UC') ? q.channelId : 'UC' + q.channelId;
      const { data } = await tryInvidious(`/api/v1/channels/${ucId}/videos`);
      const items = Array.isArray(data) ? data : (data.videos || []);
      return res.json(items.slice(0, parseInt(q.limit || '100')).map(v => ({
        id: v.videoId || '', title: v.title || 'Unknown',
        artist: v.author || 'Unknown', artistId: ucId.replace('UC', ''),
        album: '', duration: v.lengthSeconds || 0,
        thumbnail: ytThumb(v.videoId), viewCount: v.viewCount || 0,
      })));
    }

    if (action === 'stream' && q.id) {
      const { data } = await tryInvidious(`/api/v1/videos/${q.id}`);
      const audioStreams = (data.adaptiveFormats || []).filter(f => f.type && f.type.startsWith('audio/'));
      if (!audioStreams.length) return res.status(404).json({ error: 'No audio' });
      const best = audioStreams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];

      const upstreamRes = await fetch(best.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Referer': 'https://www.youtube.com/',
          'Origin': 'https://www.youtube.com',
        },
      });
      if (!upstreamRes.ok) return res.status(502).json({ error: 'Upstream fail' });

      res.setHeader('Content-Type', upstreamRes.headers.get('content-type') || 'audio/webm');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=3600');

      const reader = upstreamRes.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      } catch {}
      return res.end();
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (e) {
    console.error('API error:', e.message);
    res.status(500).json({ error: e.message || 'Server error' });
  }
};
