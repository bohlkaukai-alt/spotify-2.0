import { useState, useEffect } from 'react';
import { X, Heart, ListPlus, Play, Pause, SkipBack, SkipForward, ChevronDown } from 'lucide-react';
import usePlayerStore from '../store/playerStore';
import db from '../lib/db';

export default function FullscreenView({ onClose }) {
  const { currentTrack, isPlaying, togglePlay, nextTrack, prevTrack, setProgress, setDuration } = usePlayerStore();
  const [progress, setLocalProgress] = useState(0);
  const [duration, setLocalDuration] = useState(0);
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
    const iv = setInterval(() => {
      const st = usePlayerStore.getState();
      setLocalProgress(st.progress || 0);
      setLocalDuration(st.duration || 0);
    }, 500);
    return () => clearInterval(iv);
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
    setToast('Zur Playlist hinzugefügt!');
    setTimeout(() => setToast(''), 2000);
  };

  const seek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pct * (duration || 0);
    if (window.__ytSeek) window.__ytSeek(newTime);
    setLocalProgress(newTime);
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-[#1a1a2e] via-spotify-black to-spotify-black flex flex-col sm:hidden">
      {toast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-spotify-green text-black px-4 py-2 rounded-full text-sm font-medium z-50 animate-pulse">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <button onClick={onClose} className="text-spotify-text hover:text-white">
          <ChevronDown size={28} />
        </button>
        <span className="text-xs text-spotify-text uppercase tracking-wider">Jetzt abgespielt</span>
        <button onClick={() => setShowPlaylistMenu(!showPlaylistMenu)} className="text-spotify-text hover:text-white">
          <ListPlus size={24} />
        </button>
      </div>

      {showPlaylistMenu && (
        <div className="absolute top-14 right-4 bg-[#282828] rounded-lg shadow-xl z-50 w-56 py-2 max-h-64 overflow-y-auto">
          <p className="px-4 py-2 text-xs text-spotify-text uppercase">Zur Playlist hinzufügen</p>
          {playlists.length === 0 && <p className="px-4 py-2 text-sm text-spotify-text">Keine Playlists</p>}
          {playlists.map(pl => (
            <button key={pl.id} onClick={() => addToPlaylist(pl.id)}
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#ffffff10] truncate">
              {pl.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-8 py-4">
        <img src={currentTrack.thumbnail} alt="" className="w-full max-w-xs aspect-square rounded-lg object-cover shadow-2xl" />
      </div>

      <div className="px-8 mb-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-4">
            <h2 className="text-xl font-bold truncate">{currentTrack.title}</h2>
            <p className="text-sm text-spotify-text truncate">{currentTrack.artist}</p>
          </div>
          <button onClick={toggleLike} className="shrink-0">
            <Heart size={24} className={liked ? 'text-spotify-green' : 'text-spotify-text'}
              fill={liked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <div className="px-8 mb-4">
        <div className="w-full h-1 bg-[#4d4d4d] rounded-full cursor-pointer" onClick={seek}>
          <div className="h-full bg-white rounded-full relative" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow" />
          </div>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-spotify-text">{fmt(progress)}</span>
          <span className="text-[10px] text-spotify-text">{duration ? `-${fmt(duration - progress)}` : '0:00'}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-8 pb-12 px-8">
        <SkipBack size={28} className="text-white cursor-pointer" onClick={prevTrack} />
        <button onClick={togglePlay}
          className="w-16 h-16 bg-white rounded-full flex items-center justify-center active:scale-95">
          {isPlaying
            ? <Pause size={32} className="text-black" fill="black" />
            : <Play size={32} className="text-black ml-1" fill="black" />}
        </button>
        <SkipForward size={28} className="text-white cursor-pointer" onClick={nextTrack} />
      </div>
    </div>
  );
}
