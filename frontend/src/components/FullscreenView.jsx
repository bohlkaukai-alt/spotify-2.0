import { useState, useEffect } from 'react';
import { Heart, ListPlus, Play, Pause, SkipBack, SkipForward, ChevronDown, Repeat, Repeat1, Shuffle } from 'lucide-react';
import usePlayerStore from '../store/playerStore';
import db from '../lib/db';

export default function FullscreenView({ onClose }) {
  const { currentTrack, isPlaying, togglePlay, nextTrack, prevTrack, repeat, shuffle,
    setRepeat, setShuffle } = usePlayerStore();
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
    document.body.style.overflow = 'hidden';
    const iv = setInterval(() => {
      const st = usePlayerStore.getState();
      setLocalProgress(st.progress || 0);
      setLocalDuration(st.duration || 0);
    }, 500);
    return () => { document.body.style.overflow = ''; clearInterval(iv); };
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

  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;

  if (!currentTrack) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col"
      style={{
        backgroundColor: '#121212',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>

      {toast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-spotify-green text-black px-4 py-2 rounded-full text-sm font-medium z-50 shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-3 pb-1 shrink-0" style={{ paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)' }}>
        <button onClick={onClose} className="text-white p-1">
          <ChevronDown size={30} />
        </button>
        <span className="text-[11px] text-spotify-text uppercase tracking-widest font-medium">Jetzt abgespielt</span>
        <div className="relative">
          <button onClick={() => setShowPlaylistMenu(!showPlaylistMenu)} className="text-white p-1">
            <ListPlus size={24} />
          </button>
          {showPlaylistMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowPlaylistMenu(false)} />
              <div className="absolute top-full right-0 mt-1 bg-[#282828] rounded-lg shadow-2xl z-50 w-56 py-2 max-h-64 overflow-y-auto">
                <p className="px-4 py-2 text-xs text-spotify-text uppercase font-medium">Zur Playlist</p>
                {playlists.length === 0 && <p className="px-4 py-2 text-sm text-spotify-text">Keine Playlists</p>}
                {playlists.map(pl => (
                  <button key={pl.id} onClick={() => addToPlaylist(pl.id)}
                    className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#ffffff15] truncate">
                    {pl.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Album Art */}
      <div className="flex-1 flex items-center justify-center px-10 min-h-0">
        <img src={currentTrack.thumbnail} alt=""
          className="w-full max-w-[320px] aspect-square rounded-xl object-cover shadow-2xl" />
      </div>

      {/* Track Info + Like */}
      <div className="px-6 mb-3 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-white truncate leading-tight">{currentTrack.title}</h2>
            <p className="text-sm text-spotify-text truncate mt-0.5">{currentTrack.artist}</p>
          </div>
          <button onClick={toggleLike} className="shrink-0 p-1">
            <Heart size={26} className={liked ? 'text-spotify-green' : 'text-spotify-text'}
              fill={liked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 mb-2 shrink-0">
        <div className="w-full h-1.5 bg-[#4d4d4d] rounded-full cursor-pointer" onClick={seek}>
          <div className="h-full bg-white rounded-full relative transition-all"
            style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md" />
          </div>
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[11px] text-spotify-text tabular-nums">{fmt(progress)}</span>
          <span className="text-[11px] text-spotify-text tabular-nums">{duration ? `-${fmt(duration - progress)}` : '0:00'}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-10 pb-6 shrink-0"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 24px), 24px)' }}>
        <button onClick={setShuffle}
          className={shuffle ? 'text-spotify-green' : 'text-spotify-text'}>
          <Shuffle size={20} />
        </button>
        <button onClick={prevTrack} className="text-white active:scale-90 transition-transform">
          <SkipBack size={32} fill="white" />
        </button>
        <button onClick={togglePlay}
          className="w-16 h-16 bg-white rounded-full flex items-center justify-center active:scale-95 shadow-lg">
          {isPlaying
            ? <Pause size={30} className="text-black" fill="black" />
            : <Play size={30} className="text-black ml-1" fill="black" />}
        </button>
        <button onClick={nextTrack} className="text-white active:scale-90 transition-transform">
          <SkipForward size={32} fill="white" />
        </button>
        <button onClick={setRepeat}
          className={repeat !== 'off' ? 'text-spotify-green' : 'text-spotify-text'}>
          <RepeatIcon size={20} />
        </button>
      </div>
    </div>
  );
}
