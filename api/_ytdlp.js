const fs = require('fs');
const { exec } = require('child_process');

const YTDLP_PATH = '/tmp/yt-dlp';

async function ensureYtDlp() {
  if (fs.existsSync(YTDLP_PATH)) return YTDLP_PATH;
  return new Promise((resolve, reject) => {
    exec(`curl -L -o ${YTDLP_PATH} https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux && chmod +x ${YTDLP_PATH}`, { timeout: 60000 }, (err) => {
      if (err) reject(err);
      else resolve(YTDLP_PATH);
    });
  });
}

module.exports = { ensureYtDlp, YTDLP_PATH };
