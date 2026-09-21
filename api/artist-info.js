const { exec } = require('child_process');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { channelId } = req.query;
  if (!channelId) return res.status(400).json({ error: 'channelId is required' });

  const channelUrl = `https://www.youtube.com/channel/${channelId}`;
  const cmd = `yt-dlp "${channelUrl}" --dump-json --no-download --no-warnings --playlist-items 1`;

  return new Promise((resolve) => {
    exec(cmd, { maxBuffer: 5 * 1024 * 1024 }, (err, stdout) => {
      if (err) {
        const fallbackUrl = `https://www.youtube.com/@${channelId}`;
        const cmd2 = `yt-dlp "${fallbackUrl}" --dump-json --no-download --no-warnings --playlist-items 1`;
        return exec(cmd2, { maxBuffer: 5 * 1024 * 1024 }, (err2, stdout2) => {
          if (err2) { res.status(500).json({ error: 'Failed' }); return resolve(); }
          try {
            const d = JSON.parse(stdout2.trim().split('\n')[0]);
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
};
