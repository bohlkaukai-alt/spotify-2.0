const AUDIUS_HOST = 'https://discoveryprovider.audius.co';
const AUDIUS_APP = 'spotify2';

async function audiusSearch(query, limit = 25) {
  const r = await fetch(`${AUDIUS_HOST}/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=${AUDIUS_APP}&limit=${limit}`);
  if (!r.ok) return [];
  const d = await r.json();
  return (d.data || []).map(t => ({
    id: t.id,
    title: t.title || 'Unknown',
    artist: t.user?.name || 'Unknown',
    artistId: t.user?.id || '',
    artistHandle: t.user?.handle || '',
    album: '',
    duration: t.duration || 0,
    thumbnail: t.artwork?.['480x480'] || t.artwork?.['150x150'] || `https://ui.audius.co/${t.user?.id}.png`,
    viewCount: t.play_count || 0,
    source: 'audius',
    streamUrl: `${AUDIUS_HOST}/v1/tracks/${t.id}/stream?app_name=${AUDIUS_APP}`,
  }));
}

async function audiusStreamUrl(trackId) {
  return `${AUDIUS_HOST}/v1/tracks/${trackId}/stream?app_name=${AUDIUS_APP}`;
}

async function audiusSearchArtists(query, limit = 10) {
  const r = await fetch(`${AUDIUS_HOST}/v1/users/search?query=${encodeURIComponent(query)}&app_name=${AUDIUS_APP}&limit=${limit}`);
  if (!r.ok) return [];
  const d = await r.json();
  return (d.data || []).map(u => ({
    id: u.id,
    name: u.name || 'Unknown',
    thumbnail: `https://ui.audius.co/${u.id}.png`,
    subscriberCount: 0,
    handle: u.handle || '',
  }));
}

async function audiusArtistInfo(artistId) {
  const r = await fetch(`${AUDIUS_HOST}/v1/users/${artistId}?app_name=${AUDIUS_APP}`);
  if (!r.ok) return null;
  const d = await r.json();
  const u = d.data;
  if (!u) return null;
  return {
    id: u.id,
    name: u.name || 'Unknown',
    thumbnail: `https://ui.audius.co/${u.id}.png`,
    subscriberCount: 0,
    handle: u.handle || '',
  };
}

async function audiusArtistTracks(artistId, limit = 50) {
  const r = await fetch(`${AUDIUS_HOST}/v1/users/${artistId}/tracks?app_name=${AUDIUS_APP}&limit=${limit}`);
  if (!r.ok) return [];
  const d = await r.json();
  return (d.data || []).map(t => ({
    id: t.id,
    title: t.title || 'Unknown',
    artist: t.user?.name || 'Unknown',
    artistId: t.user?.id || '',
    album: '',
    duration: t.duration || 0,
    thumbnail: t.artwork?.['480x480'] || t.artwork?.['150x150'] || `https://ui.audius.co/${t.user?.id}.png`,
    viewCount: t.play_count || 0,
    source: 'audius',
    streamUrl: `${AUDIUS_HOST}/v1/tracks/${t.id}/stream?app_name=${AUDIUS_APP}`,
  }));
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const q = req.query;
  const action = q.action;

  try {
    if (action === 'search' && q.q) {
      const results = await audiusSearch(q.q, parseInt(q.limit || '25'));
      return res.json(results);
    }

    if (action === 'search-artists' && q.q) {
      const results = await audiusSearchArtists(q.q, parseInt(q.limit || '10'));
      return res.json(results);
    }

    if (action === 'artist-info' && q.channelId) {
      const info = await audiusArtistInfo(q.channelId);
      return res.json(info || { id: q.channelId, name: 'Unknown', thumbnail: '', subscriberCount: 0 });
    }

    if (action === 'artist-songs' && q.channelId) {
      const songs = await audiusArtistTracks(q.channelId, parseInt(q.limit || '50'));
      return res.json(songs);
    }

    if (action === 'stream' && q.id) {
      const url = await audiusStreamUrl(q.id);
      return res.status(200).json({ url, type: 'audio/mpeg' });
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (e) {
    console.error('API error:', e.message);
    res.status(500).json({ error: e.message || 'Server error' });
  }
};
