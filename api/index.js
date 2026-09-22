const AUDIUS_HOST = 'https://discoveryprovider.audius.co';
const AUDIUS_APP = 'spotify2';

function ytThumb(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

function parseDuration(s) {
  const parts = s.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

function parseCount(s) {
  if (!s) return 0;
  s = s.toLowerCase().replace(/,/g, '');
  if (s.includes('m')) return Math.round(parseFloat(s) * 1_000_000);
  if (s.includes('k')) return Math.round(parseFloat(s) * 1_000);
  return parseInt(s.replace(/[^0-9]/g, '') || '0');
}

async function ytSearch(query, limit = 25) {
  const body = {
    context: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20250101.00.00',
        hl: 'en',
        gl: 'US',
      },
    },
    query: query,
    params: 'EgIQAQ%3D%3D',
  };

  const resp = await fetch('https://www.youtube.com/youtubei/v1/search?key=AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  const items = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
  return items
    .filter(i => i.videoRenderer)
    .slice(0, limit)
    .map(i => {
      const v = i.videoRenderer;
      const videoId = v.videoId;
      return {
        id: videoId,
        title: v.title?.runs?.map(r => r.text).join('') || 'Unknown',
        artist: v.ownerText?.runs?.[0]?.text || v.longBylineText?.runs?.[0]?.text || 'Unknown',
        artistId: v.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || '',
        album: '',
        duration: v.lengthText?.simpleText ? parseDuration(v.lengthText.simpleText) : 0,
        thumbnail: v.thumbnail?.thumbnails?.pop()?.url || ytThumb(videoId),
        viewCount: parseInt(v.viewCountText?.simpleText?.replace(/[^0-9]/g, '') || '0'),
        source: 'youtube',
        streamUrl: null,
      };
    });
}

async function ytSearchChannels(query, limit = 10) {
  const body = {
    context: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20250101.00.00',
        hl: 'en',
        gl: 'US',
      },
    },
    query: query,
    params: 'EgIQAg%3D%3D',
  };

  const resp = await fetch('https://www.youtube.com/youtubei/v1/search?key=AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  const items = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
  return items
    .filter(i => i.channelRenderer)
    .slice(0, limit)
    .map(i => {
      const ch = i.channelRenderer;
      return {
        id: ch.channelId,
        name: ch.title?.simpleText || ch.title?.runs?.map(r => r.text).join('') || 'Unknown',
        thumbnail: ch.thumbnail?.thumbnails?.pop()?.url || '',
        subscriberCount: parseCount(ch.subscriberCountText?.simpleText || ''),
      };
    });
}

async function ytChannelInfo(channelId) {
  const body = {
    context: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20250101.00.00',
        hl: 'en',
        gl: 'US',
      },
    },
    browseId: channelId,
  };

  const resp = await fetch('https://www.youtube.com/youtubei/v1/browse?key=AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  const header = data.header?.c4TabbedHeaderRenderer || data.metadata?.channelMetadataRenderer || {};
  return {
    id: channelId,
    name: header.title || header.name || 'Unknown',
    thumbnail: header.avatar?.thumbnails?.[0]?.url || '',
    subscriberCount: parseCount(header.subscriberCountText?.simpleText || header.subscriberCountText || ''),
  };
}

async function ytChannelVideos(channelId, limit = 50) {
  const body = {
    context: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20250101.00.00',
        hl: 'en',
        gl: 'US',
      },
    },
    browseId: channelId,
  };

  const resp = await fetch('https://www.youtube.com/youtubei/v1/browse?key=AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  const tab = data.contents?.twoColumnBrowseResultsRenderer?.tabs?.find(t =>
    t.tabRenderer?.title === 'Videos' || t.tabRenderer?.selected
  );
  const items = tab?.tabRenderer?.content?.richGridRenderer?.contents || [];
  return items
    .filter(i => i.richItemRenderer?.content?.videoRenderer)
    .slice(0, limit)
    .map(i => {
      const v = i.richItemRenderer.content.videoRenderer;
      return {
        id: v.videoId,
        title: v.title?.runs?.map(r => r.text).join('') || 'Unknown',
        artist: v.ownerText?.runs?.[0]?.text || 'Unknown',
        artistId: channelId,
        album: '',
        duration: v.lengthText?.simpleText ? parseDuration(v.lengthText.simpleText) : 0,
        thumbnail: v.thumbnail?.thumbnails?.pop()?.url || ytThumb(v.videoId),
        viewCount: parseInt(v.viewCountText?.simpleText?.replace(/[^0-9]/g, '') || '0'),
        source: 'youtube',
        streamUrl: null,
      };
    });
}

async function audiusSearchTracks(query, limit = 10) {
  try {
    const r = await fetch(`${AUDIUS_HOST}/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=${AUDIUS_APP}&limit=${limit}`);
    if (!r.ok) return [];
    const d = await r.json();
    return (d.data || []).map(t => ({
      id: t.id,
      title: t.title || 'Unknown',
      artist: t.user?.name || 'Unknown',
      artistId: t.user?.id || '',
      source: 'audius',
      streamUrl: `${AUDIUS_HOST}/v1/tracks/${t.id}/stream?app_name=${AUDIUS_APP}`,
      thumbnail: t.artwork?.['480x480'] || t.artwork?.['150x150'] || '',
      duration: t.duration || 0,
    }));
  } catch { return []; }
}

async function audiusSearchArtists(query, limit = 10) {
  try {
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
  } catch { return []; }
}

async function audiusArtistInfo(artistId) {
  try {
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
  } catch { return null; }
}

async function audiusArtistTracks(artistId, limit = 50) {
  try {
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
  } catch { return []; }
}

function normalizeTitle(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const q = req.query;
  const action = q.action;

  try {
    if (action === 'search' && q.q) {
      const [ytResults, audiusResults] = await Promise.all([
        ytSearch(q.q, parseInt(q.limit || '25')),
        audiusSearchTracks(q.q, 10),
      ]);

      const enriched = ytResults.map(ytTrack => {
        const match = audiusResults.find(a =>
          normalizeTitle(a.title).includes(normalizeTitle(ytTrack.title)) &&
          normalizeTitle(a.artist).includes(normalizeTitle(ytTrack.artist))
        );
        if (match) {
          return { ...ytTrack, streamUrl: match.streamUrl, source: 'hybrid' };
        }
        const partial = audiusResults.find(a =>
          normalizeTitle(a.title).includes(normalizeTitle(ytTrack.title)) ||
          normalizeTitle(ytTrack.title).includes(normalizeTitle(a.title))
        );
        if (partial) {
          return { ...ytTrack, streamUrl: partial.streamUrl, source: 'hybrid' };
        }
        return ytTrack;
      });

      return res.json(enriched);
    }

    if (action === 'search-artists' && q.q) {
      const [ytArtists, audiusArtists] = await Promise.all([
        ytSearchChannels(q.q, parseInt(q.limit || '10')),
        audiusSearchArtists(q.q, 5),
      ]);

      const seen = new Set();
      const merged = [];
      for (const a of [...ytArtists, ...audiusArtists]) {
        const key = normalizeTitle(a.name);
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(a);
        }
      }
      return res.json(merged.slice(0, parseInt(q.limit || '10')));
    }

    if (action === 'artist-info' && q.channelId) {
      if (q.channelId.length < 12) {
        const info = await audiusArtistInfo(q.channelId);
        if (info) return res.json(info);
      }
      const info = await ytChannelInfo(q.channelId);
      return res.json(info);
    }

    if (action === 'artist-songs' && q.channelId) {
      if (q.channelId.length < 12) {
        const songs = await audiusArtistTracks(q.channelId, parseInt(q.limit || '50'));
        if (songs.length > 0) return res.json(songs);
      }
      const songs = await ytChannelVideos(q.channelId, parseInt(q.limit || '50'));
      return res.json(songs);
    }

    if (action === 'stream' && q.id) {
      const url = `${AUDIUS_HOST}/v1/tracks/${q.id}/stream?app_name=${AUDIUS_APP}`;
      return res.status(200).json({ url, type: 'audio/mpeg' });
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (e) {
    console.error('API error:', e.message);
    res.status(500).json({ error: e.message || 'Server error' });
  }
};
