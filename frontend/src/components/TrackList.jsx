import { useState, useEffect } from 'react';
import { Play, Clock, Heart, Download, Plus, Pause } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import usePlayerStore from '../store/playerStore';
import db from '../lib/db';

export default function TrackList({ tracks, title }) {
  const { currentTrack, isPlaying, setTrack, setQueue, togglePlay } = usePlayerStore();
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
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      setQueue(tracks);
      setTrack(track);
      if (window.__ytPlay) window.__ytPlay(track.id);
    }
  };

  const fmt = (s) => {
    if (!s) return '—';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="px-4 sm:px-6 pb-28">
      {title && <h2 className="text-2xl font-bold mb-4 animate-fadeUp">{title}</h2>}

      <div className="hidden sm:grid grid-cols-[16px_4fr_3fr_minmax(100px,1fr)_minmax(80px,1fr)] gap-4 px-4 py-2
                      text-[var(--text-dim)] text-[11px] uppercase tracking-wider border-b border-[#1f1f1f] mb-2 animate-fadeIn">
        <span>#</span><span>Title</span><span>Album</span>
        <span className="flex justify-end"><Clock size={14} /></span><span></span>
      </div>

      <div className="stagger">
        {tracks.map((track, i) => {
          const isCurrent = currentTrack?.id === track.id;
          return (
            <div key={track.id}
              className={`track-row flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 rounded-lg cursor-pointer group
                ${isCurrent ? 'bg-[#1a1a1a]' : 'hover:bg-[#141414]'}`}
              onClick={() => handlePlay(track)}>

              <span className="text-[var(--text-dim)] text-sm w-6 text-center shrink-0 hidden sm:block group-hover:hidden tabular-nums">
                {isCurrent && isPlaying ? (
                  <span className="playing-indicator flex items-end justify-center h-4">
                    <span /><span /><span /><span />
                  </span>
                ) : i + 1}
              </span>
              <button className="hidden sm:block group-hover:block text-white w-6 text-center shrink-0" onClick={(e) => { e.stopPropagation(); handlePlay(track); }}>
                {isCurrent && isPlaying
                  ? <Pause size={14} fill="white" className="mx-auto" />
                  : <Play size={14} fill="white" className="mx-auto" />}
              </button>

              <img src={track.thumbnail}
                className={`w-10 h-10 rounded-lg object-cover shrink-0 transition-shadow ${isCurrent ? 'shadow-lg shadow-black/40' : ''}`} alt="" />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${isCurrent ? 'text-[var(--green)]' : 'text-white'}`}>{track.title}</p>
                <p className="text-xs text-[var(--text-dim)] truncate"
                  onClick={(e) => { e.stopPropagation(); if (track.artistId) navigate(`/artist/${track.artistId}`); }}>
                  {track.artist}
                </p>
              </div>

              <span className="text-sm text-[var(--text-dim)] truncate hidden md:block flex-1">{track.album || '—'}</span>

              <span className="text-sm text-[var(--text-dim)] tabular-nums shrink-0">{fmt(track.duration)}</span>

              <div className="flex items-center gap-2 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                <button onClick={(e) => toggleFavorite(e, track)}
                  className={`transition-colors ${favorites.has(track.id) ? 'text-[var(--green)]' : 'text-[var(--text-dim)] hover:text-white'}`}>
                  <Heart size={14} fill={favorites.has(track.id) ? 'currentColor' : 'none'} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); usePlayerStore.getState().addToQueue(track); }}
                  className="text-[var(--text-dim)] hover:text-white hidden sm:block transition-colors">
                  <Plus size={14} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); }}
                  className="text-[var(--text-dim)] hover:text-white hidden sm:block transition-colors">
                  <Download size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
