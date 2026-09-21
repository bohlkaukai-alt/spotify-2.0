const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const INSTANCES = ['https://invidious.f5.si', 'https://iv.datura.network', 'https://invidious.nerdvpn.de'];

async function tryFetch(path) {
  for (const inst of INSTANCES) {
    try {
      const r = await fetch(`${inst}${path}`, { signal: AbortSignal.timeout(8000) });
      if (r.ok) return await r.json();
    } catch {}
  }
  throw new Error('All Invidious instances failed');
}

const frontendBuild = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendBuild));

app.get('/api', async (req, res) => {
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
        thumbnail: v.videoThumbnails?.[0]?.url || '', viewCount: v.viewCount || 0,
      })));
    }
    if (action === 'search-artists' && q.q) {
      const data = await tryFetch(`/api/v1/search?q=${encodeURIComponent(q.q)}&type=channel`);
      return res.json((Array.isArray(data) ? data : []).slice(0, parseInt(q.limit || '10')).map(ch => ({
        id: ch.authorId || '', name: ch.author || 'Unknown',
        thumbnail: ch.authorThumbnails?.[0]?.url || '', subscriberCount: parseInt(ch.subCountText) || 0,
      })));
    }
    if (action === 'artist-info' && q.channelId) {
      const ucId = q.channelId.startsWith('UC') ? q.channelId : 'UC' + q.channelId;
      const data = await tryFetch(`/api/v1/channels/${ucId}`);
      return res.json({ id: ucId, name: data.author || 'Unknown',
        thumbnail: data.authorThumbnails?.[0]?.url || '', subscriberCount: parseInt(data.subCountText) || 0 });
    }
    if (action === 'artist-songs' && q.channelId) {
      const ucId = q.channelId.startsWith('UC') ? q.channelId : 'UC' + q.channelId;
      const data = await tryFetch(`/api/v1/channels/${ucId}/videos`);
      return res.json((data || []).slice(0, parseInt(q.limit || '100')).map(v => ({
        id: v.videoId || '', title: v.title || 'Unknown',
        artist: v.author || 'Unknown', artistId: ucId.replace('UC', ''),
        album: '', duration: v.lengthSeconds || 0,
        thumbnail: v.videoThumbnails?.[0]?.url || '', viewCount: v.viewCount || 0,
      })));
    }
    if (action === 'stream' && q.id) {
      const data = await tryFetch(`/api/v1/videos/${q.id}`);
      const audioStreams = (data.adaptiveFormats || []).filter(f => f.type && f.type.startsWith('audio/'));
      if (!audioStreams.length) return res.status(404).json({ error: 'No audio' });
      const best = audioStreams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
      return res.json({ url: best.url, type: best.type || 'audio/webm' });
    }
    res.status(400).json({ error: 'Invalid action' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('*', (req, res) => res.sendFile(path.join(frontendBuild, 'index.html')));
app.listen(PORT, () => console.log(`Backend on :${PORT}`));
