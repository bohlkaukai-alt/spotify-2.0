import { useState, useEffect, useRef } from 'react';
import { Play, Clock, Heart, MoreHorizontal, ListPlus, Trash2, SkipForward, Pause } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import usePlayerStore from '../store/playerStore';
import db from '../lib/db';

export default function TrackList({ tracks, title, playlistId, onRemoveTrack }) {
  const { currentTrack, isPlaying, setTrack, setQueue, togglePlay } = usePlayerStore();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState(new Set());
  const [menuTrack, setMenuTrack] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const menuRef = useRef(null);

  useEffect(() => { loadFavorites(); }, []);
  useEffect(() => { loadFavorites(); }, [tracks]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuTrack(null);
    };
    if (menuTrack) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuTrack]);

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
    if (currentTrack?.id === track.id) { togglePlay(); }
    else { setQueue(tracks); setTrack(track); }
  };

  const openMenu = (e, track) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ x: Math.min(rect.left, window.innerWidth - 240), y: rect.bottom + 4 });
    setMenuTrack(menuTrack?.id === track.id ? null : track);
  };

  const playNext = (track) => { usePlayerStore.getState().playNext(track); setMenuTrack(null); };

  const removeFavorite = async (track) => {
    const existing = await db.favorites.where('trackId').equals(track.id).first();
    if (existing) await db.favorites.delete(existing.id);
    setFavorites((prev) => { const n = new Set(prev); n.delete(track.id); return n; });
    setMenuTrack(null);
  };

  const fmt = (s) => { if (!s) return '—'; return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`; };

  return (
    <div>
      {title && <h2 className="text-xl font-bold text-white mb-4">{title}</h2>}

      {/* Desktop Header */}
      <div className="hidden sm:grid grid-cols-[16px_4fr_3fr_minmax(100px,1fr)] gap-4 px-4 py-2
                      text-[var(--text-dim)] text-[11px] uppercase tracking-wider border-b border-[#282828] mb-2">
        <span className="text-right">#</span><span>Title</span><span>Album</span>
        <span className="flex justify-end"><Clock size={14} /></span>
      </div>

      <div>
        {tracks.map((track, i) => {
          const isCurrent = currentTrack?.id === track.id;
          return (
            <div key={track.id}
              className={`flex items-center gap-3 sm:gap-4 px-4 py-2 rounded-md cursor-pointer group
                ${isCurrent ? 'bg-[#1a1a1a]' : 'hover:bg-[#1a1a1a]'}`}
              onClick={() => handlePlay(track)}>

              {/* Number / Play */}
              <span className="text-[var(--text-dim)] text-sm w-6 text-center shrink-0 hidden sm:block group-hover:hidden tabular-nums">
                {isCurrent && isPlaying ? (
                  <span className="playing-indicator flex items-end justify-center h-4">
                    <span /><span /><span /><span />
                  </span>
                ) : i + 1}
              </span>
              <button className="hidden sm:block group-hover:block text-white w-6 text-center shrink-0" onClick={(e) => { e.stopPropagation(); handlePlay(track); }}>
                {isCurrent && isPlaying ? <Pause size={14} fill="white" className="mx-auto" /> : <Play size={14} fill="white" className="mx-auto" />}
              </button>

              {/* Thumbnail + Info */}
              <img src={track.thumbnail}
                className={`w-10 h-10 rounded object-cover shrink-0 ${isCurrent ? 'shadow-md' : ''}`} alt="" />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${isCurrent ? 'text-[var(--green)]' : 'text-white'}`}>{track.title}</p>
                <p className="text-xs text-[var(--text-dim)] truncate hover:underline cursor-pointer hover:text-white"
                  onClick={(e) => { e.stopPropagation(); if (track.artistId) navigate(`/artist/${track.artistId}`); }}>
                  {track.artist}
                </p>
              </div>

              {/* Album (desktop) */}
              <span className="text-sm text-[var(--text-dim)] truncate hidden md:block">{track.album || '—'}</span>

              {/* Duration + Actions */}
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={(e) => toggleFavorite(e, track)}
                  className={`transition-colors ${favorites.has(track.id) ? 'text-[var(--green)]' : 'text-transparent group-hover:text-[var(--text-dim)] hover:text-white'}`}>
                  <Heart size={14} fill={favorites.has(track.id) ? 'currentColor' : 'none'} />
                </button>
                <span className="text-sm text-[var(--text-dim)] tabular-nums hidden sm:block">{fmt(track.duration)}</span>
                <button onClick={(e) => openMenu(e, track)}
                  className="text-[var(--text-dim)] hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Context Menu */}
      {menuTrack && (
        <div ref={menuRef}
          className="fixed z-[150] bg-[#282828] rounded-lg shadow-2xl py-2 w-60 animate-fadeIn"
          style={{ left: menuPos.x, top: menuPos.y }}>
          <div className="px-4 py-2 border-b border-[#3e3e3e]">
            <p className="text-sm font-bold text-white truncate">{menuTrack.title}</p>
            <p className="text-xs text-[var(--text-dim)] truncate">{menuTrack.artist}</p>
          </div>

          <button onClick={() => playNext(menuTrack)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-[#3e3e3e] transition-colors">
            <SkipForward size={16} className="text-[var(--text-dim)]" />
            Als nächstes abspielen
          </button>

          {favorites.has(menuTrack.id) ? (
            <button onClick={() => removeFavorite(menuTrack)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-[#3e3e3e] transition-colors">
              <Trash2 size={16} className="text-[var(--text-dim)]" />
              Aus Liked Songs entfernen
            </button>
          ) : (
            <button onClick={() => { toggleFavorite(new Event('click'), menuTrack); setMenuTrack(null); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-[#3e3e3e] transition-colors">
              <Heart size={16} className="text-[var(--text-dim)]" />
              Zu Liked Songs hinzufügen
            </button>
          )}

          {playlistId && (
            <button onClick={() => { onRemoveTrack?.(menuTrack); setMenuTrack(null); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-[#3e3e3e] transition-colors">
              <Trash2 size={16} className="text-[var(--text-dim)]" />
              Aus Playlist entfernen
            </button>
          )}

          <button onClick={() => { navigator.clipboard.writeText(menuTrack.title + ' ' + menuTrack.artist); setMenuTrack(null); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-[#3e3e3e] transition-colors">
            <ListPlus size={16} className="text-[var(--text-dim)]" />
            Song-Name kopieren
          </button>
        </div>
      )}
    </div>
  );
}
