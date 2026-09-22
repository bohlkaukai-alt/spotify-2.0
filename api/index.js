const ytdl = require('@distube/ytdl-core');

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
      // Use YouTube search via innertube
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q.q)}`;
      const info = await ytdl.search(q.q, { limit: parseInt(q.limit || '25') });
      const results = info.map(v => ({
        id: v.id || '', title: v.name || 'Unknown',
        artist: v.uploader?.name || 'Unknown', artistId: v.uploader?.id || '',
        album: '', duration: v.duration || 0,
        thumbnail: v.thumbnails?.[0]?.url || ytThumb(v.id), viewCount: v.views || 0,
      }));
      return res.json(results);
    }

    if (action === 'search-artists' && q.q) {
      // Search for channels - use yt-dlp search
      try {
        const results = await ytdl.search(q.q, { limit: parseInt(q.limit || '10'), type: 'video' });
        const channels = [];
        const seen = new Set();
        for (const v of results) {
          if (v.uploader?.id && !seen.has(v.uploader.id)) {
            seen.add(v.uploader.id);
            channels.push({
              id: v.uploader.id, name: v.uploader.name || 'Unknown',
              thumbnail: v.uploader.thumbnails?.[0]?.url || v.thumbnails?.[0]?.url || '',
              subscriberCount: 0,
            });
          }
        }
        return res.json(channels);
      } catch {
        return res.json([]);
      }
    }

    if (action === 'artist-info' && q.channelId) {
      try {
        const channelUrl = `https://www.youtube.com/channel/${q.channelId}`;
        const info = await ytdl.getInfo(channelUrl);
        return res.json({
          id: q.channelId, name: info.videoDetails?.author?.name || 'Unknown',
          thumbnail: info.videoDetails?.author?.thumbnails?.[0]?.url || '',
          subscriberCount: 0,
        });
      } catch {
        return res.json({ id: q.channelId, name: 'Unknown', thumbnail: '', subscriberCount: 0 });
      }
    }

    if (action === 'artist-songs' && q.channelId) {
      try {
        const channelUrl = `https://www.youtube.com/channel/${q.channelId}/videos`;
        const results = await ytdl.search(`channel:${q.channelId}`, { limit: parseInt(q.limit || '50') });
        return res.json(results.map(v => ({
          id: v.id || '', title: v.name || 'Unknown',
          artist: v.uploader?.name || 'Unknown', artistId: q.channelId,
          album: '', duration: v.duration || 0,
          thumbnail: v.thumbnails?.[0]?.url || ytThumb(v.id), viewCount: v.views || 0,
        })));
      } catch {
        return res.json([]);
      }
    }

    if (action === 'stream' && q.id) {
      try {
        const videoUrl = `https://www.youtube.com/watch?v=${q.id}`;
        const info = await ytdl.getInfo(videoUrl, {
          quality: 'highestaudio',
          filter: 'audioonly',
        });
        const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
        if (format && format.url) {
          return res.status(200).json({ url: format.url, type: format.mimeType || 'audio/webm' });
        }
        return res.status(404).json({ error: 'No audio format found' });
      } catch (err) {
        console.error('ytdl stream error:', err.message);
        return res.status(500).json({ error: 'Stream extraction failed: ' + err.message });
      }
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (e) {
    console.error('API error:', e.message);
    res.status(500).json({ error: e.message || 'Server error' });
  }
};
