const { exec } = require('child_process');
const { ensureYtDlp } = require('./_ytdlp');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q, limit = 25 } = req.query;
  if (!q) return res.status(400).json({ error: 'q is required' });

  try {
    const ytdlp = await ensureYtDlp();
    const n = Math.min(parseInt(limit), 50);
    const cmd = `"${ytdlp}" "ytsearch${n}:${q}" --dump-json --flat-playlist --no-download --no-warnings`;

    return new Promise((resolve) => {
      exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
        if (err) { res.status(500).json({ error: 'Search failed' }); return resolve(); }
        const results = stdout.trim().split('\n').filter(Boolean).flatMap((line) => {
          try {
            const d = JSON.parse(line);
            if (!d.id || !d.title) return [];
            return [{ id: d.id, title: d.title, artist: d.uploader || d.channel || 'Unknown',
              artistId: d.channel_id || d.uploader_id || '', album: d.album || '',
              duration: d.duration || 0, thumbnail: d.thumbnails?.[d.thumbnails.length - 1]?.url || '',
              viewCount: d.view_count || 0 }];
          } catch { return []; }
        });
        res.json(results);
        resolve();
      });
    });
  } catch (e) { res.status(500).json({ error: 'Init failed' }); }
};
