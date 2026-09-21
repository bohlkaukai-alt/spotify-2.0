const express = require('express');
const cors = require('cors');
const { exec, spawn } = require('child_process');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

// yt-dlp path – adjust if needed
const YTDLP = process.env.YTDLP_PATH || 'yt-dlp';

app.use(cors());
app.use(express.json());

// Serve frontend build
const frontendBuild = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendBuild));

// ─── Health ────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ─── Search: Songs ─────────────────────────────────────
app.get('/api/search', (req, res) => {
  const { q, limit = 25 } = req.query;
  if (!q) return res.status(400).json({ error: 'q is required' });

  const n = Math.min(parseInt(limit), 50);
  const cmd = `"${YTDLP}" "ytsearch${n}:${q}" --dump-json --flat-playlist --no-download --no-warnings`;

  exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
    if (err) return res.status(500).json({ error: 'Search failed' });

    const results = stdout.trim().split('\n').filter(Boolean).flatMap((line) => {
      try {
        const d = JSON.parse(line);
        if (!d.id || !d.title) return [];
        return [{
          id: d.id,
          title: d.title,
          artist: d.uploader || d.channel || d.creator || 'Unknown',
          artistId: extractChannelId(d.channel_id, d.uploader_id),
          album: d.album || '',
          duration: d.duration || 0,
          thumbnail: thumb(d.thumbnails),
          viewCount: d.view_count || 0,
        }];
      } catch { return []; }
    });

    res.json(results);
  });
});

// ─── Search: Artists (channels) ────────────────────────
app.get('/api/search-artists', (req, res) => {
  const { q, limit = 10 } = req.query;
  if (!q) return res.status(400).json({ error: 'q is required' });

  const n = Math.min(parseInt(limit), 20);
  // Search with "artist" suffix to bias towards music channels
  const cmd = `"${YTDLP}" "ytsearch${n * 3}:${q} music" --dump-json --flat-playlist --no-download --no-warnings`;

  exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
    if (err) return res.status(500).json({ error: 'Artist search failed' });

    const channelMap = new Map();

    stdout.trim().split('\n').filter(Boolean).forEach((line) => {
      try {
        const d = JSON.parse(line);
        const chId = d.channel_id || d.uploader_id;
        const chName = d.channel || d.uploader;
        if (!chId || !chName || channelMap.has(chId)) return;

        // Only keep channels that look like music artists
        channelMap.set(chId, {
          id: chId,
          name: chName,
          thumbnail: thumb(d.thumbnails),
          subscriberCount: d.channel_follower_count || 0,
        });
      } catch {}
    });

    // Sort by subscriber count, take top results
    const sorted = [...channelMap.values()]
      .sort((a, b) => b.subscriberCount - a.subscriberCount)
      .slice(0, n);

    res.json(sorted);
  });
});

// ─── All songs from a channel/artist ───────────────────
app.get('/api/artist/:channelId/songs', (req, res) => {
  const { channelId } = req.params;
  const { limit = 100 } = req.query;
  const n = Math.min(parseInt(limit), 200);

  // Get channel URL and dump all videos
  const channelUrl = `https://www.youtube.com/channel/${channelId}/videos`;
  const cmd = `"${YTDLP}" "${channelUrl}" --dump-json --flat-playlist --no-download --no-warnings --playlist-end ${n}`;

  exec(cmd, { maxBuffer: 20 * 1024 * 1024 }, (err, stdout) => {
    if (err) {
      // Fallback: try user URL format
      const fallbackUrl = `https://www.youtube.com/@${channelId}/videos`;
      const cmd2 = `"${YTDLP}" "${fallbackUrl}" --dump-json --flat-playlist --no-download --no-warnings --playlist-end ${n}`;
      return exec(cmd2, { maxBuffer: 20 * 1024 * 1024 }, (err2, stdout2) => {
        if (err2) return res.status(500).json({ error: 'Failed to fetch artist songs' });
        res.json(parseChannelVideos(stdout2));
      });
    }
    res.json(parseChannelVideos(stdout));
  });
});

// ─── Artist info ───────────────────────────────────────
app.get('/api/artist/:channelId', (req, res) => {
  const { channelId } = req.params;
  const channelUrl = `https://www.youtube.com/channel/${channelId}`;
  const cmd = `"${YTDLP}" "${channelUrl}" --dump-json --no-download --no-warnings --playlist-items 1`;

  exec(cmd, { maxBuffer: 5 * 1024 * 1024 }, (err, stdout) => {
    if (err) {
      const fallbackUrl = `https://www.youtube.com/@${channelId}`;
      const cmd2 = `"${YTDLP}" "${fallbackUrl}" --dump-json --no-download --no-warnings --playlist-items 1`;
      return exec(cmd2, { maxBuffer: 5 * 1024 * 1024 }, (err2, stdout2) => {
        if (err2) return res.status(500).json({ error: 'Failed to get artist info' });
        try {
          const d = JSON.parse(stdout2.trim().split('\n')[0]);
          res.json({
            id: channelId,
            name: d.channel || d.uploader || 'Unknown',
            thumbnail: thumb(d.thumbnails),
            subscriberCount: d.channel_follower_count || 0,
            description: d.description || '',
          });
        } catch { res.status(500).json({ error: 'Parse error' }); }
      });
    }
    try {
      const d = JSON.parse(stdout.trim().split('\n')[0]);
      res.json({
        id: channelId,
        name: d.channel || d.uploader || 'Unknown',
        thumbnail: thumb(d.thumbnails),
        subscriberCount: d.channel_follower_count || 0,
        description: d.description || '',
      });
    } catch { res.status(500).json({ error: 'Parse error' }); }
  });
});

// ─── Stream audio ──────────────────────────────────────
app.get('/api/stream/:id', (req, res) => {
  const { id } = req.params;
  const url = `https://youtube.com/watch?v=${id}`;

  const args = [
    '--no-playlist',
    '-f', 'bestaudio',
    '-o', '-',
    '--no-warnings',
    url,
  ];

  let headersSent = false;

  const ytDlp = spawn(YTDLP, args, { stdio: ['ignore', 'pipe', 'pipe'] });

  ytDlp.stdout.on('data', (chunk) => {
    if (!headersSent) {
      res.setHeader('Content-Type', 'audio/webm');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      headersSent = true;
    }
    res.write(chunk);
  });

  ytDlp.stderr.on('data', () => {}); // ignore stderr (progress etc)

  ytDlp.on('close', () => {
    if (!headersSent) {
      res.status(500).json({ error: 'No audio data received' });
    }
    res.end();
  });

  ytDlp.on('error', (err) => {
    console.error('yt-dlp error:', err.message);
    if (!headersSent) {
      res.status(500).json({ error: 'Failed to start stream' });
    }
    res.end();
  });

  req.on('close', () => {
    ytDlp.kill('SIGTERM');
  });
});

// ─── Track info ────────────────────────────────────────
app.get('/api/track/:id', (req, res) => {
  const cmd = `"${YTDLP}" "https://youtube.com/watch?v=${req.params.id}" --dump-json --no-download --no-warnings`;
  exec(cmd, { maxBuffer: 5 * 1024 * 1024 }, (err, stdout) => {
    if (err) return res.status(500).json({ error: 'Failed' });
    try {
      const d = JSON.parse(stdout);
      res.json({
        id: d.id, title: d.title,
        artist: d.uploader || d.channel, artistId: extractChannelId(d.channel_id, d.uploader_id),
        album: d.album || '', duration: d.duration,
        thumbnail: thumb(d.thumbnails),
      });
    } catch { res.status(500).json({ error: 'Parse error' }); }
  });
});

// ─── Helpers ───────────────────────────────────────────
function thumb(thumbnails) {
  if (!thumbnails?.length) return '';
  return thumbnails[thumbnails.length - 1]?.url || thumbnails[0]?.url || '';
}

function extractChannelId(channelId, uploaderId) {
  return channelId || uploaderId || '';
}

function parseChannelVideos(stdout) {
  return stdout.trim().split('\n').filter(Boolean).flatMap((line) => {
    try {
      const d = JSON.parse(line);
      if (!d.id || !d.title) return [];
      // Skip playlists, channels, etc – only keep actual videos
      if (d._type === 'playlist' || d._type === 'channel') return [];
      return [{
        id: d.id,
        title: d.title,
        artist: d.channel || d.uploader || 'Unknown',
        artistId: d.channel_id || d.uploader_id || '',
        album: d.album || '',
        duration: d.duration || 0,
        thumbnail: thumb(d.thumbnails),
        viewCount: d.view_count || 0,
      }];
    } catch { return []; }
  });
}

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

// Catch-all: serve frontend for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendBuild, 'index.html'));
});
