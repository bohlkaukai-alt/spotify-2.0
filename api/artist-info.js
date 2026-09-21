const { exec } = require('child_process');
const { ensureYtDlp } = require('./_ytdlp');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { channelId } = req.query;
  if (!channelId) return res.status(400).json({ error: 'channelId required' });

  try {
    const ytdlp = await ensureYtDlp();
    const url = `https://www.youtube.com/channel/${channelId}`;
    const cmd = `"${ytdlp}" "${url}" --dump-json --no-download --no-warnings --playlist-items 1`;

    return new Promise((resolve) => {
      exec(cmd, { maxBuffer: 5 * 1024 * 1024 }, (err, stdout) => {
        if (err) {
          const fb = `"${ytdlp}" "https://www.youtube.com/@${channelId}" --dump-json --no-download --no-warnings --playlist-items 1`;
          return exec(fb, { maxBuffer: 5 * 1024 * 1024 }, (e2, out2) => {
            if (e2) { res.status(500).json({ error: 'Failed' }); return resolve(); }
            try {
              const d = JSON.parse(out2.trim().split('\n')[0]);
              res.json({ id: channelId, name: d.channel || d.uploader || 'Unknown',
                thumbnail: d.thumbnails?.[d.thumbnails.length - 1]?.url || '',
                subscriberCount: d.channel_follower_count || 0, description: d.description || '' });
            } catch { res.status(500).json({ error: 'Parse error' }); }
            resolve();
          });
        }
        try {
          const d = JSON.parse(stdout.trim().split('\n')[0]);
          res.json({ id: channelId, name: d.channel || d.uploader || 'Unknown',
            thumbnail: d.thumbnails?.[d.thumbnails.length - 1]?.url || '',
            subscriberCount: d.channel_follower_count || 0, description: d.description || '' });
        } catch { res.status(500).json({ error: 'Parse error' }); }
        resolve();
      });
    });
  } catch (e) { res.status(500).json({ error: 'Init failed' }); }
};
