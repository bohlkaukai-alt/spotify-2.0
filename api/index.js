const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://api.piped.projectsegfault.com',
];

const INVIDIOUS_INSTANCES = [
  'https://invidious.f5.si',
  'https://iv.datura.network',
  'https://invidious.nerdvpn.de',
];

function ytThumb(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

async function tryFetch(urls, timeout = 10000) {
  for (const url of urls) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(timeout) });
      if (r.ok) return await r.json();
    } catch {}
  }
  return null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const q = req.query;
  const action = q.action;

  try {
    if (action === 'search' && q.q) {
      // Try Piped first, then Invidious
      let data = await tryFetch(
        PIPED_INSTANCES.map(i => `${i}/search?q=${encodeURIComponent(q.q)}&filter=videos`)
      );
      if (data && data.items) {
        return res.json(data.items.filter(v => v.type === 'stream').slice(0, parseInt(q.limit || '25')).map(v => ({
          id: v.url?.replace('/watch?v=', '') || v.id || '', title: v.title || 'Unknown',
          artist: v.uploaderName || 'Unknown', artistId: v.uploaderUrl?.replace('/channel/', '') || '',
          album: '', duration: v.duration || 0,
          thumbnail: v.thumbnailUrl || ytThumb(v.url?.replace('/watch?v=', '') || v.id), viewCount: v.views || 0,
        })));
      }
      // Fallback to Invidious
      data = await tryFetch(
        INVIDIOUS_INSTANCES.map(i => `${i}/api/v1/search?q=${encodeURIComponent(q.q)}&type=video&sort_by=relevance`)
      );
      if (Array.isArray(data)) {
        return res.json(data.filter(v => v.type === 'video').slice(0, parseInt(q.limit || '25')).map(v => ({
          id: v.videoId || '', title: v.title || 'Unknown',
          artist: v.author || 'Unknown', artistId: (v.authorId || '').replace('UC', ''),
          album: '', duration: v.lengthSeconds || 0,
          thumbnail: ytThumb(v.videoId), viewCount: v.viewCount || 0,
        })));
      }
      return res.json([]);
    }

    if (action === 'search-artists' && q.q) {
      let data = await tryFetch(
        PIPED_INSTANCES.map(i => `${i}/search?q=${encodeURIComponent(q.q)}&filter=channels`)
      );
      if (data && data.items) {
        return res.json(data.items.slice(0, parseInt(q.limit || '10')).map(ch => ({
          id: ch.url?.replace('/channel/', '') || '', name: ch.name || 'Unknown',
          thumbnail: ch.thumbnailUrl || '', subscriberCount: ch.subscribers || 0,
        })));
      }
      data = await tryFetch(
        INVIDIOUS_INSTANCES.map(i => `${i}/api/v1/search?q=${encodeURIComponent(q.q)}&type=channel`)
      );
      if (Array.isArray(data)) {
        return res.json(data.slice(0, parseInt(q.limit || '10')).map(ch => ({
          id: ch.authorId || '', name: ch.author || 'Unknown',
          thumbnail: ch.authorThumbnails?.[ch.authorThumbnails.length - 1]?.url || '',
          subscriberCount: parseInt(ch.subCountText) || 0,
        })));
      }
      return res.json([]);
    }

    if (action === 'artist-info' && q.channelId) {
      const ucId = q.channelId.startsWith('UC') ? q.channelId : 'UC' + q.channelId;
      let data = await tryFetch(PIPED_INSTANCES.map(i => `${i}/channel/${ucId}`));
      if (data) {
        return res.json({
          id: ucId, name: data.name || 'Unknown',
          thumbnail: data.avatarUrl || '', subscriberCount: data.subscribers || 0,
        });
      }
      data = await tryFetch(INVIDIOUS_INSTANCES.map(i => `${i}/api/v1/channels/${ucId}`));
      if (data) {
        return res.json({
          id: ucId, name: data.author || 'Unknown',
          thumbnail: data.authorThumbnails?.[data.authorThumbnails.length - 1]?.url || '',
          subscriberCount: parseInt(data.subCountText) || 0,
        });
      }
      return res.json({ id: ucId, name: 'Unknown', thumbnail: '', subscriberCount: 0 });
    }

    if (action === 'artist-songs' && q.channelId) {
      const ucId = q.channelId.startsWith('UC') ? q.channelId : 'UC' + q.channelId;
      let data = await tryFetch(PIPED_INSTANCES.map(i => `${i}/channel/${ucId}/videos`));
      if (data && data.content) {
        return res.json(data.content.slice(0, parseInt(q.limit || '100')).map(v => ({
          id: v.url?.replace('/watch?v=', '') || '', title: v.title || 'Unknown',
          artist: v.uploaderName || 'Unknown', artistId: ucId.replace('UC', ''),
          album: '', duration: v.duration || 0,
          thumbnail: v.thumbnailUrl || '', viewCount: v.views || 0,
        })));
      }
      data = await tryFetch(INVIDIOUS_INSTANCES.map(i => `${i}/api/v1/channels/${ucId}/videos`));
      if (data) {
        const items = Array.isArray(data) ? data : (data.videos || []);
        return res.json(items.slice(0, parseInt(q.limit || '100')).map(v => ({
          id: v.videoId || '', title: v.title || 'Unknown',
          artist: v.author || 'Unknown', artistId: ucId.replace('UC', ''),
          album: '', duration: v.lengthSeconds || 0,
          thumbnail: ytThumb(v.videoId), viewCount: v.viewCount || 0,
        })));
      }
      return res.json([]);
    }

    if (action === 'stream' && q.id) {
      // Try Piped first (much more reliable)
      let data = await tryFetch(PIPED_INSTANCES.map(i => `${i}/streams/${q.id}`));
      if (data && data.audioStreams && data.audioStreams.length) {
        const best = data.audioStreams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
        if (best.url) {
          return res.status(200).json({ url: best.url, type: best.mimeType || 'audio/webm' });
        }
      }
      // Fallback to Invidious
      data = await tryFetch(INVIDIOUS_INSTANCES.map(i => `${i}/api/v1/videos/${q.id}`));
      if (data && data.adaptiveFormats) {
        const audioStreams = data.adaptiveFormats.filter(f => f.type && f.type.startsWith('audio/'));
        if (audioStreams.length) {
          const best = audioStreams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
          return res.status(200).json({ url: best.url, type: best.type || 'audio/webm' });
        }
      }
      return res.status(404).json({ error: 'No audio stream available' });
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (e) {
    console.error('API error:', e.message);
    res.status(500).json({ error: e.message || 'Server error' });
  }
};
