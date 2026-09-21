const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const PIPED = 'https://pipedapi.kavin.rocks';

// Serve frontend build
const frontendBuild = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendBuild));

// Search
app.get('/api/search', async (req, res) => {
  const { q, limit = 25 } = req.query;
  if (!q) return res.status(400).json({ error: 'q required' });
  try {
    const r = await fetch(`${PIPED}/streams/${encodeURIComponent(q)}?filter=music_songs`);
    if (!r.ok) {
      const r2 = await fetch(`${PIPED}/search?q=${encodeURIComponent(q)}&filter=videos`);
      const data = await r2.json();
      return res.json((data.items || []).slice(0, parseInt(limit)).map(mapVideo));
    }
    const data = await r.json();
    res.json((data.items || []).slice(0, parseInt(limit)).map(mapVideo));
  } catch (e) {
    try {
      const r = await fetch(`${PIPED}/search?q=${encodeURIComponent(q)}&filter=videos`);
      const data = await r.json();
      res.json((data.items || []).slice(0, parseInt(limit)).map(mapVideo));
    } catch { res.status(500).json({ error: 'Search failed' }); }
  }
});

// Search artists
app.get('/api/search-artists', async (req, res) => {
  const { q, limit = 10 } = req.query;
  if (!q) return res.status(400).json({ error: 'q required' });
  try {
    const r = await fetch(`${PIPED}/search?q=${encodeURIComponent(q)}&filter=channels`);
    const data = await r.json();
    res.json((data.items || []).slice(0, parseInt(limit)).map(ch => ({
      id: ch.url?.split('/channel/')?.[1] || ch.url?.split('/@')?.[1] || ch.uid || '',
      name: ch.name || 'Unknown',
      thumbnail: ch.thumbnail || '',
      subscriberCount: ch.subscribers || 0,
    })));
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// Artist info
app.get('/api/artist-info', async (req, res) => {
  const { channelId } = req.query;
  if (!channelId) return res.status(400).json({ error: 'channelId required' });
  try {
    const r = await fetch(`${PIPED}/channel/${channelId}`);
    const data = await r.json();
    res.json({
      id: channelId, name: data.name || 'Unknown',
      thumbnail: data.thumbnail || '', subscriberCount: data.subscribers || 0,
      description: data.description || '',
    });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// Artist songs
app.get('/api/artist-songs', async (req, res) => {
  const { channelId, limit = 100 } = req.query;
  if (!channelId) return res.status(400).json({ error: 'channelId required' });
  try {
    const r = await fetch(`${PIPED}/channel/${channelId}`);
    const data = await r.json();
    const videos = (data.relatedStreams || []).filter(v => v.type === 'stream');
    res.json(videos.slice(0, parseInt(limit)).map(mapVideo));
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// Stream audio
app.get('/api/stream', async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });
  try {
    const r = await fetch(`${PIPED}/streams/${id}`);
    const data = await r.json();
    const audioStreams = data.audioStreams || [];
    if (!audioStreams.length) return res.status(404).json({ error: 'No audio' });
    const best = audioStreams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
    const streamUrl = best.url;
    const proxy = await fetch(streamUrl);
    res.setHeader('Content-Type', proxy.headers.get('content-type') || 'audio/webm');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache');
    const reader = proxy.body.getReader();
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) { res.end(); return; }
        res.write(value);
      }
    };
    pump().catch(() => res.end());
    req.on('close', () => { try { reader.cancel(); } catch {} });
  } catch (e) { res.status(500).json({ error: 'Stream failed' }); }
});

function mapVideo(v) {
  return {
    id: v.url?.split('v=')?.[1] || v.url?.split('/')?.pop() || v.uid || '',
    title: v.title || 'Unknown',
    artist: v.uploaderName || v.uploader || 'Unknown',
    artistId: v.uploaderUrl?.split('/channel/')?.[1] || v.uploaderUrl?.split('/@')?.[1] || '',
    album: '', duration: v.duration || 0,
    thumbnail: v.thumbnail || '', viewCount: v.views || 0,
  };
}

// Catch-all
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendBuild, 'index.html'));
});

app.listen(PORT, () => console.log(`Backend on :${PORT}`));
