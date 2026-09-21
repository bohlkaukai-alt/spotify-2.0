import { useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle, X, Heart } from 'lucide-react';
import usePlayerStore from '../store/playerStore';
import db from '../lib/db';
import { useState } from 'react';

export default function FullscreenPlayer({ onClose }) {
  const audio = useRef(null);
  const [isFav, setIsFav] = useState(false);
  const {
    currentTrack, isPlaying, volume, progress, duration, shuffle, repeat,
    togglePlay, setProgress, setDuration, nextTrack, prevTrack,
    setShuffle, cycleRepeat,
  } = usePlayerStore();

  useEffect(() => {
    if (currentTrack) checkFavorite();
  }, [currentTrack?.id]);

  const checkFavorite = async () => {
    if (!currentTrack) return;
    const existing = await db.favorites.where('trackId').equals(currentTrack.id).first();
    setIsFav(!!existing);
  };

  const toggleFavorite = async () => {
    if (!currentTrack) return;
    if (isFav) {
      const existing = await db.favorites.where('trackId').equals(currentTrack.id).first();
      if (existing) await db.favorites.delete(existing.id);
    } else {
      await db.favorites.add({
        trackId: currentTrack.id, title: currentTrack.title,
        artist: currentTrack.artist, thumbnail: currentTrack.thumbnail, addedAt: new Date(),
      });
    }
    setIsFav(!isFav);
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const remaining = duration - progress;
  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-[#1a1a2e] to-spotify-black flex flex-col items-center justify-between p-8">
      {/* Top bar */}
      <div className="w-full flex items-center justify-between">
        <button onClick={onClose} className="text-spotify-text hover:text-white transition-colors">
          <X size={28} />
        </button>
        <span className="text-sm font-semibold text-spotify-text">Wird abgespielt aus YouTube Music</span>
        <div className="w-7" />
      </div>

      {/* Album Art */}
      <div className="flex-1 flex items-center justify-center">
        {currentTrack?.thumbnail ? (
          <img
            src={currentTrack.thumbnail}
            className="w-[340px] h-[340px] rounded-lg shadow-2xl object-cover"
            alt=""
          />
        ) : (
          <div className="w-[340px] h-[340px] bg-spotify-lighter rounded-lg flex items-center justify-center text-spotify-text text-8xl">
            ♫
          </div>
        )}
      </div>

      {/* Track Info + Controls */}
      <div className="w-full max-w-[700px] flex flex-col items-center gap-6">
        {/* Title */}
        <div className="w-full flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold truncate">{currentTrack?.title}</p>
            <p className="text-spotify-text text-lg">{currentTrack?.artist}</p>
          </div>
          <button onClick={toggleFavorite} className="ml-4 shrink-0">
            <Heart size={24} className={isFav ? 'text-spotify-green fill-spotify-green' : 'text-spotify-text hover:text-white'} />
          </button>
        </div>

        {/* Progress */}
        <div className="w-full flex items-center gap-3">
          <span className="text-xs text-spotify-text w-10 text-right tabular-nums">{formatTime(progress)}</span>
          <input type="range" min="0" max={duration || 0} value={progress}
            onChange={(e) => { const v = Number(e.target.value); setProgress(v); }}
            className="flex-1 h-1" />
          <span className="text-xs text-spotify-text w-10 tabular-nums">-{formatTime(remaining > 0 ? remaining : 0)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-8">
          <button onClick={setShuffle} className={`transition-colors ${shuffle ? 'text-spotify-green' : 'text-spotify-text hover:text-white'}`}>
            <Shuffle size={22} />
          </button>
          <button onClick={prevTrack} className="text-white hover:scale-110 transition-transform">
            <SkipBack size={28} fill="currentColor" />
          </button>
          <button onClick={togglePlay} className="w-14 h-14 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform">
            {isPlaying ? <Pause size={28} className="text-black" fill="black" /> : <Play size={28} className="text-black ml-1" fill="black" />}
          </button>
          <button onClick={nextTrack} className="text-white hover:scale-110 transition-transform">
            <SkipForward size={28} fill="currentColor" />
          </button>
          <button onClick={cycleRepeat} className={`transition-colors ${repeat !== 'off' ? 'text-spotify-green' : 'text-spotify-text hover:text-white'}`}>
            <RepeatIcon size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
