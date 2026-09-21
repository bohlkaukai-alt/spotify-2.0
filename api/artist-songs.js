const { exec } = require('child_process');
const { ensureYtDlp } = require('./_ytdlp');

function parseVideos(stdout) {
  return stdout.trim().split('\n').filter(Boolean).flatMap((line) => {
    try {
      const d = JSON.parse(line);
      if (!d.id || !d.title || d._type === 'playlist' || d._type === 'channel') return [];
      return [{ id: d.id, title: d.title, artist: d.channel || d.uploader || 'Unknown',
        artistId: d.channel_id || d.uploader_id || '', album: d.album || '',
        duration: d.duration || 0, thumbnail: d.thumbnails?.[d.thumbnails.length - 1]?.url || '',
        viewCount: d.view_count || 0 }];
    } catch { return []; }
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { channelId, limit = 100 } = req.query;
  if (!channelId) return res.status(400).json({ error: 'channelId required' });

  try {
    const ytdlp = await ensureYtDlp();
    const n = Math.min(parseInt(limit), 200);
    const url = `https://www.youtube.com/channel/${channelId}/videos`;
    const cmd = `"${ytdlp}" "${url}" --dump-json --flat-playlist --no-download --no-warnings --playlist-end ${n}`;

    return new Promise((resolve) => {
      exec(cmd, { maxBuffer: 20 * 1024 * 1024 }, (err, stdout) => {
        if (err) {
          const fb = `"${ytdlp}" "https://www.youtube.com/@${channelId}/videos" --dump-json --flat-playlist --no-download --no-warnings --playlist-end ${n}`;
          return exec(fb, { maxBuffer: 20 * 1024 * 1024 }, (e2, out2) => {
            if (e2) { res.status(500).json({ error: 'Failed' }); return resolve(); }
            res.json(parseVideos(out2)); resolve();
          });
        }
        res.json(parseVideos(stdout)); resolve();
      });
    });
  } catch (e) { res.status(500).json({ error: 'Init failed' }); }
};
