import { useState, useEffect } from 'react';
import { Heart, ListPlus, Play, Pause, SkipBack, SkipForward, ChevronDown, Repeat, Repeat1, Shuffle, Share2, Maximize2 } from 'lucide-react';
import usePlayerStore from '../store/playerStore';
import db from '../lib/db';

export default function FullscreenView({ onClose }) {
  const { currentTrack, isPlaying, togglePlay, nextTrack, prevTrack, repeat, shuffle,
    progress, duration, cycleRepeat, setShuffle, setProgress, setDuration } = usePlayerStore();
  const [liked, setLiked] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!currentTrack) return;
    db.favorites.where('trackId').equals(currentTrack.id).first().then(f => setLiked(!!f));
    db.playlists.toArray().then(setPlaylists);
  }, [currentTrack?.id]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const toggleLike = async () => {
    if (!currentTrack) return;
    if (liked) {
      const existing = await db.favorites.where('trackId').equals(currentTrack.id).first();
      if (existing) await db.favorites.delete(existing.id);
    } else {
      await db.favorites.add({
        trackId: currentTrack.id, title: currentTrack.title, artist: currentTrack.artist,
        thumbnail: currentTrack.thumbnail, addedAt: new Date(),
      });
    }
    setLiked(!liked);
    setToast(liked ? 'Entfernt' : 'Gelikt!');
    setTimeout(() => setToast(''), 2000);
  };

  const addToPlaylist = async (plId) => {
    if (!currentTrack) return;
    const existing = await db.playlistTracks.where({ playlistId: plId, trackId: currentTrack.id }).first();
    if (!existing) {
      await db.playlistTracks.add({
        playlistId: plId, trackId: currentTrack.id, title: currentTrack.title,
        artist: currentTrack.artist, thumbnail: currentTrack.thumbnail,
        duration: currentTrack.duration, addedAt: new Date(),
      });
    }
    setShowPlaylistMenu(false);
    setToast('Hinzugefügt!');
    setTimeout(() => setToast(''), 2000);
  };

  const seek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pct * (duration || 0);
    if (window.__ytSeek) window.__ytSeek(newTime);
    setProgress(newTime);
  };

  const fmt = (s) => { if (!s || isNaN(s)) return '0:00'; return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`; };
  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;
  const repeatLabel = repeat === 'all' ? 'Playlist' : repeat === 'one' ? '1 Song' : 'Aus';

  if (!currentTrack) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-gradient-to-b from-[#333] via-[#1a1a1a] to-[#121212] md:from-[#181818] md:via-[#121212] md:to-[#121212]">

      {toast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold z-50 shadow-lg animate-fadeUp">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center active:scale-90 transition-transform">
          <ChevronDown size={28} className="text-white" />
        </button>
        <div className="text-center">
          <p className="text-[10px] text-white/60 uppercase tracking-widest font-medium">Wird abgespielt aus</p>
          <p className="text-xs font-bold text-white">Deine Bibliothek</p>
        </div>
        <div className="relative">
          <button onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
            className="w-10 h-10 flex items-center justify-center active:scale-90 transition-transform">
            <svg viewBox="0 0 16 16" fill="white" width="20" height="20">
              <path d="M3 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm6.5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM16 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
            </svg>
          </button>
          {showPlaylistMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowPlaylistMenu(false)} />
              <div className="absolute top-full right-0 mt-2 bg-[#282828] rounded-xl shadow-2xl z-50 w-64 py-2 animate-fadeUp">
                <p className="px-4 py-2 text-xs text-[var(--text-dim)] uppercase tracking-wider font-medium">Zur Playlist</p>
                {playlists.length === 0 && <p className="px-4 py-2 text-sm text-[var(--text-dim)]">Keine Playlists</p>}
                {playlists.map(pl => (
                  <button key={pl.id} onClick={() => addToPlaylist(pl.id)}
                    className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#3e3e3e] transition-colors truncate">
                    {pl.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Album Art */}
      <div className="flex-[1] flex items-center justify-center px-8 md:px-16 min-h-0">
        <img src={currentTrack.thumbnail} alt=""
          className="w-full max-w-[340px] aspect-square rounded-lg object-cover shadow-2xl" />
      </div>

      {/* Track Info */}
      <div className="px-6 pt-5 pb-2 shrink-0 flex items-end justify-between">
        <div className="min-w-0 flex-1 mr-4">
          <h2 className="text-xl font-bold text-white truncate">{currentTrack.title}</h2>
          <p className="text-sm text-[var(--text-dim)] truncate mt-0.5">{currentTrack.artist}</p>
        </div>
        <button onClick={toggleLike} className="shrink-0 p-1 active:scale-90 transition-transform">
          <Heart size={22} className={liked ? 'text-[var(--green)]' : 'text-[var(--text-dim)]'}
            fill={liked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Progress */}
      <div className="px-6 py-2 shrink-0">
        <div className="w-full h-1.5 bg-[#4d4d4d] rounded-full cursor-pointer group" onClick={seek}>
          <div className="h-full bg-white group-hover:bg-[var(--green)] rounded-full relative transition-all"
            style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[11px] text-[var(--text-dim)] tabular-nums">{fmt(progress)}</span>
          <span className="text-[11px] text-[var(--text-dim)] tabular-nums">{duration ? `-${fmt(duration - progress)}` : '0:00'}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-6 pb-8 pt-1 shrink-0">
        <button onClick={setShuffle}
          className={`p-2 active:scale-90 transition-all ${shuffle ? 'text-[var(--green)]' : 'text-[var(--text-dim)]'}`}>
          <Shuffle size={20} />
        </button>
        <button onClick={prevTrack} className="text-white active:scale-90 transition-transform">
          <SkipBack size={32} fill="currentColor" />
        </button>
        <button onClick={togglePlay}
          className="w-16 h-16 bg-white rounded-full flex items-center justify-center active:scale-95 transition-all shadow-xl">
          {isPlaying
            ? <Pause size={28} className="text-black" fill="black" />
            : <Play size={28} className="text-black ml-1" fill="black" />}
        </button>
        <button onClick={nextTrack} className="text-white active:scale-90 transition-transform">
          <SkipForward size={32} fill="currentColor" />
        </button>
        <button onClick={cycleRepeat}
          className={`p-2 active:scale-90 transition-all relative ${repeat !== 'off' ? 'text-[var(--green)]' : 'text-[var(--text-dim)]'}`}>
          <RepeatIcon size={20} />
          {repeat === 'one' && (
            <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold text-[var(--green)]">1</span>
          )}
        </button>
      </div>
    </div>
  );
}
