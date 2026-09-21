const { exec } = require('child_process');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q, limit = 10 } = req.query;
  if (!q) return res.status(400).json({ error: 'q is required' });

  const n = Math.min(parseInt(limit), 20);
  const cmd = `yt-dlp "ytsearch${n * 3}:${q} music" --dump-json --flat-playlist --no-download --no-warnings`;

  return new Promise((resolve) => {
    exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
      if (err) { res.status(500).json({ error: 'Artist search failed' }); return resolve(); }

      const channelMap = new Map();
      stdout.trim().split('\n').filter(Boolean).forEach((line) => {
        try {
          const d = JSON.parse(line);
          const chId = d.channel_id || d.uploader_id;
          const chName = d.channel || d.uploader;
          if (!chId || !chName || channelMap.has(chId)) return;
          channelMap.set(chId, {
            id: chId, name: chName,
            thumbnail: d.thumbnails?.[d.thumbnails.length - 1]?.url || '',
            subscriberCount: d.channel_follower_count || 0,
          });
        } catch {}
      });

      const sorted = [...channelMap.values()]
        .sort((a, b) => b.subscriberCount - a.subscriberCount)
        .slice(0, n);

      res.json(sorted);
      resolve();
    });
  });
};
