const { spawn } = require('child_process');
const { ensureYtDlp } = require('./_ytdlp');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });

  let ytDlpProc = null;

  try {
    const ytdlp = await ensureYtDlp();
    const url = `https://youtube.com/watch?v=${id}`;
    const args = ['--no-playlist', '-f', 'bestaudio', '-o', '-', '--no-warnings', url];

    ytDlpProc = spawn(ytdlp, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let headersSent = false;

    ytDlpProc.stdout.on('data', (chunk) => {
      if (!headersSent) {
        res.writeHead(200, {
          'Content-Type': 'audio/webm',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-cache',
          'Transfer-Encoding': 'chunked',
        });
        headersSent = true;
      }
      res.write(chunk);
    });

    ytDlpProc.stderr.on('data', () => {});

    ytDlpProc.on('close', () => {
      if (!headersSent) res.status(500).json({ error: 'No audio data' });
      res.end();
    });

    ytDlpProc.on('error', (err) => {
      console.error('yt-dlp error:', err.message);
      if (!headersSent) res.status(500).json({ error: 'Failed to start' });
      res.end();
    });

    req.on('close', () => { if (ytDlpProc) ytDlpProc.kill('SIGTERM'); });
  } catch (e) {
    console.error('Stream init error:', e.message);
    if (!res.headersSent) res.status(500).json({ error: 'Init failed' });
  }
};
