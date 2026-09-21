const { spawn } = require('child_process');
const { ensureYtDlp } = require('./_ytdlp');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });

  try {
    const ytdlp = await ensureYtDlp();
    const url = `https://youtube.com/watch?v=${id}`;
    const args = ['--no-playlist', '-f', 'bestaudio', '-o', '-', '--no-warnings', url];

    let headersSent = false;
    const ytDlp = spawn(ytdlp, args, { stdio: ['ignore', 'pipe', 'pipe'] });

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
    ytDlp.on('close', () => { if (!headersSent) res.status(500).json({ error: 'No audio' }); res.end(); });
    ytDlp.on('error', () => { if (!headersSent) res.status(500).json({ error: 'Failed' }); res.end(); });
    req.on('close', () => ytDlp.kill('SIGTERM'));
  } catch (e) { res.status(500).json({ error: 'Init failed' }); }
};

export const config = { api: { responseLimit: false } };
