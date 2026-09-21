const BASE = '/api';

export async function searchSongs(query, limit = 25) {
  const r = await fetch(`${BASE}?action=search&q=${encodeURIComponent(query)}&limit=${limit}`);
  return r.json();
}

export async function searchArtists(query, limit = 10) {
  const r = await fetch(`${BASE}?action=search-artists&q=${encodeURIComponent(query)}&limit=${limit}`);
  return r.json();
}

export async function getArtistInfo(channelId) {
  const r = await fetch(`${BASE}?action=artist-info&channelId=${channelId}`);
  return r.json();
}

export async function getArtistSongs(channelId, limit = 100) {
  const r = await fetch(`${BASE}?action=artist-songs&channelId=${channelId}&limit=${limit}`);
  return r.json();
}

export async function getStreamUrl(id) {
  const r = await fetch(`${BASE}?action=stream&id=${id}`);
  const data = await r.json();
  return data.url;
}

export async function downloadTrack(track) {
  const url = await getStreamUrl(track.id);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${track.artist} - ${track.title}.mp3`.replace(/[\/\\:]/g, '_');
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
