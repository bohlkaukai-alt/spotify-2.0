const { spawn } = require('child_process');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id is required' });

  const url = `https://youtube.com/watch?v=${id}`;
  const args = ['--no-playlist', '-f', 'bestaudio', '-o', '-', '--no-warnings', url];

  let headersSent = false;
  const ytDlp = spawn('yt-dlp', args, { stdio: ['ignore', 'pipe', 'pipe'] });

  ytDlp.stdout.on('data', (chunk) => {
    if (!headersSent) {
      res.setHeader('Content-Type', 'audio/webm');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'no-cache');
      headersSent = true;
    }
    res.write(chunk);
  });

  ytDlp.stderr.on('data', () => {});

  ytDlp.on('close', () => {
    if (!headersSent) res.status(500).json({ error: 'No audio data' });
    res.end();
  });

  ytDlp.on('error', () => {
    if (!headersSent) res.status(500).json({ error: 'Stream failed' });
    res.end();
  });

  req.on('close', () => ytDlp.kill('SIGTERM'));
};

export const config = {
  api: { responseLimit: false },
};
