import { useState, useEffect } from 'react';
import { Play, Clock, Heart, Download, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import usePlayerStore from '../store/playerStore';
import db from '../lib/db';
import { downloadTrack } from '../utils/download';

export default function TrackList({ tracks, title }) {
  const { setTrack, setQueue } = usePlayerStore();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => { loadFavorites(); }, []);
  useEffect(() => { loadFavorites(); }, [tracks]);

  const loadFavorites = async () => {
    const favs = await db.favorites.toArray();
    setFavorites(new Set(favs.map((f) => f.trackId)));
  };

  const toggleFavorite = async (e, track) => {
    e.stopPropagation();
    if (favorites.has(track.id)) {
      const existing = await db.favorites.where('trackId').equals(track.id).first();
      if (existing) await db.favorites.delete(existing.id);
      setFavorites((prev) => { const n = new Set(prev); n.delete(track.id); return n; });
    } else {
      await db.favorites.add({ trackId: track.id, title: track.title, artist: track.artist, thumbnail: track.thumbnail, addedAt: new Date() });
      setFavorites((prev) => new Set(prev).add(track.id));
    }
  };

  const handlePlay = (track) => {
    setQueue(tracks);
    setTrack(track);
  };

  const fmt = (s) => {
    if (!s) return '—';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="px-4 sm:px-6 pb-24">
      {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}

      {/* Header - hidden on mobile */}
      <div className="hidden sm:grid grid-cols-[16px_4fr_3fr_minmax(100px,1fr)_minmax(80px,1fr)] gap-4 px-4 py-2
                      text-spotify-text text-xs uppercase tracking-wider border-b border-[#282828] mb-2">
        <span>#</span><span>Title</span><span>Album</span>
        <span className="flex justify-end"><Clock size={14} /></span><span></span>
      </div>

      {tracks.map((track, i) => (
        <div key={track.id}
          className="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2 rounded-md hover:bg-[#ffffff10]
                     cursor-pointer group active:bg-[#ffffff20]"
          onClick={() => handlePlay(track)}>

          {/* Number / Play icon */}
          <span className="text-spotify-text text-sm w-6 text-center shrink-0 hidden sm:block group-hover:hidden">{i + 1}</span>
          <button className="hidden sm:block group-hover:block text-white w-6 text-center shrink-0" onClick={(e) => e.stopPropagation()}>
            <Play size={14} fill="white" className="mx-auto" />
          </button>

          {/* Thumbnail + Info */}
          <img src={track.thumbnail} className="w-10 h-10 rounded shrink-0" alt="" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{track.title}</p>
            <p className="text-xs text-spotify-text truncate"
              onClick={(e) => { e.stopPropagation(); if (track.artistId) navigate(`/artist/${track.artistId}`); }}>
              {track.artist}
            </p>
          </div>

          {/* Album - hidden on mobile */}
          <span className="text-sm text-spotify-text truncate hidden md:block flex-1">{track.album || '—'}</span>

          {/* Duration */}
          <span className="text-sm text-spotify-text tabular-nums shrink-0">{fmt(track.duration)}</span>

          {/* Actions - visible on hover / always on mobile */}
          <div className="flex items-center gap-2 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => toggleFavorite(e, track)}
              className={favorites.has(track.id) ? 'text-spotify-green' : 'text-spotify-text hover:text-white'}>
              <Heart size={14} fill={favorites.has(track.id) ? 'currentColor' : 'none'} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); usePlayerStore.getState().addToQueue(track); }}
              className="text-spotify-text hover:text-white hidden sm:block">
              <Plus size={14} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); downloadTrack(track); }}
              className="text-spotify-text hover:text-white hidden sm:block">
              <Download size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
