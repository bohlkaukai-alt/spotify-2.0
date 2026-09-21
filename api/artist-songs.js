const { exec } = require('child_process');

function parseChannelVideos(stdout) {
  return stdout.trim().split('\n').filter(Boolean).flatMap((line) => {
    try {
      const d = JSON.parse(line);
      if (!d.id || !d.title) return [];
      if (d._type === 'playlist' || d._type === 'channel') return [];
      return [{
        id: d.id, title: d.title,
        artist: d.channel || d.uploader || 'Unknown',
        artistId: d.channel_id || d.uploader_id || '',
        album: d.album || '', duration: d.duration || 0,
        thumbnail: d.thumbnails?.[d.thumbnails.length - 1]?.url || '',
        viewCount: d.view_count || 0,
      }];
    } catch { return []; }
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { channelId } = req.query;
  const limit = Math.min(parseInt(req.query.limit || '100'), 200);
  if (!channelId) return res.status(400).json({ error: 'channelId is required' });

  const channelUrl = `https://www.youtube.com/channel/${channelId}/videos`;
  const cmd = `yt-dlp "${channelUrl}" --dump-json --flat-playlist --no-download --no-warnings --playlist-end ${limit}`;

  return new Promise((resolve) => {
    exec(cmd, { maxBuffer: 20 * 1024 * 1024 }, (err, stdout) => {
      if (err) {
        const fallbackUrl = `https://www.youtube.com/@${channelId}/videos`;
        const cmd2 = `yt-dlp "${fallbackUrl}" --dump-json --flat-playlist --no-download --no-warnings --playlist-end ${limit}`;
        return exec(cmd2, { maxBuffer: 20 * 1024 * 1024 }, (err2, stdout2) => {
          if (err2) { res.status(500).json({ error: 'Failed' }); return resolve(); }
          res.json(parseChannelVideos(stdout2));
          resolve();
        });
      }
      res.json(parseChannelVideos(stdout));
      resolve();
    });
  });
};
