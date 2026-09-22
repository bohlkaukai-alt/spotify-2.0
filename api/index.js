function ytThumb(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

// YouTube innertube: extract audio stream URL directly
async function getYouTubeAudioUrl(videoId) {
  const body = {
    context: {
      client: {
        clientName: 'ANDROID',
        clientVersion: '19.09.37',
        androidSdkVersion: 30,
        hl: 'en',
        gl: 'US',
        utcOffsetMinutes: 0,
      },
    },
    videoId: videoId,
    contentCheckOk: true,
    racyCheckOk: true,
  };

  const resp = await fetch('https://www.youtube.com/youtubei/v1/player?key=AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w&prettyPrint=false', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip',
      'X-Youtube-Client-Name': '3',
      'X-Youtube-Client-Version': '19.09.37',
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json();
  if (data.playabilityStatus && data.playabilityStatus.status !== 'OK') {
    throw new Error(data.playabilityStatus.reason || 'Video not playable');
  }

  const formats = [...(data.streamingData?.formats || []), ...(data.streamingData?.adaptiveFormats || [])];
  const audioFormats = formats.filter(f => f.mimeType && f.mimeType.startsWith('audio/'));
  if (audioFormats.length === 0) throw new Error('No audio formats found');

  // Pick highest bitrate
  audioFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
  const best = audioFormats[0];
  return best.url || best.signatureCipher;
}

async function ytSearch(query, limit = 25) {
  const body = {
    context: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20240101.00.00',
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
      return {
        id: v.videoId,
        title: v.title?.runs?.map(r => r.text).join('') || 'Unknown',
        artist: v.ownerText?.runs?.[0]?.text || v.longBylineText?.runs?.[0]?.text || 'Unknown',
        artistId: v.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || '',
        album: '',
        duration: v.lengthText?.simpleText ? parseDuration(v.lengthText.simpleText) : 0,
        thumbnail: v.thumbnail?.thumbnails?.pop()?.url || ytThumb(v.videoId),
        viewCount: parseInt(v.viewCountText?.simpleText?.replace(/[^0-9]/g, '') || '0'),
      };
    });
}

async function ytSearchChannels(query, limit = 10) {
  const body = {
    context: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20240101.00.00',
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

async function ytChannelVideos(channelId, limit = 50) {
  const body = {
    context: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20240101.00.00',
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
      };
    });
}

async function ytChannelInfo(channelId) {
  const body = {
    context: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20240101.00.00',
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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const q = req.query;
  const action = q.action;

  try {
    if (action === 'search' && q.q) {
      const results = await ytSearch(q.q, parseInt(q.limit || '25'));
      return res.json(results);
    }

    if (action === 'search-artists' && q.q) {
      const results = await ytSearchChannels(q.q, parseInt(q.limit || '10'));
      return res.json(results);
    }

    if (action === 'artist-info' && q.channelId) {
      const info = await ytChannelInfo(q.channelId);
      return res.json(info);
    }

    if (action === 'artist-songs' && q.channelId) {
      const songs = await ytChannelVideos(q.channelId, parseInt(q.limit || '50'));
      return res.json(songs);
    }

    if (action === 'stream' && q.id) {
      const url = await getYouTubeAudioUrl(q.id);
      return res.status(200).json({ url, type: 'audio/webm' });
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (e) {
    console.error('API error:', e.message);
    res.status(500).json({ error: e.message || 'Server error' });
  }
};
