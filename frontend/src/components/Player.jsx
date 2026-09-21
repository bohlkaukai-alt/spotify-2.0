import { useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle, Volume2 } from 'lucide-react';
import usePlayerStore from '../store/playerStore';

export default function Player() {
  const audio = useRef(null);
  const {
    currentTrack, isPlaying, volume, progress, duration, shuffle, repeat,
    togglePlay, setProgress, setDuration, nextTrack, prevTrack, setVolume,
    setShuffle, cycleRepeat,
  } = usePlayerStore();

  useEffect(() => {
    if (currentTrack && audio.current) {
      audio.current.src = `/api/stream/${currentTrack.id}`;
      audio.current.play().catch(() => {});
    }
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!audio.current) return;
    isPlaying ? audio.current.play().catch(() => {}) : audio.current.pause();
  }, [isPlaying]);

  useEffect(() => {
    if (audio.current) audio.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        artwork: [{ src: currentTrack.thumbnail, sizes: '300x300', type: 'image/jpeg' }],
      });
      navigator.mediaSession.setActionHandler('play', () => usePlayerStore.getState().togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => usePlayerStore.getState().togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => usePlayerStore.getState().prevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => usePlayerStore.getState().nextTrack());
    }
  }, [currentTrack]);

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;

  return (
    <div className="h-[72px] bg-spotify-black border-t border-[#282828] flex items-center px-4 z-50 shrink-0">
      <audio
        ref={audio}
        onTimeUpdate={(e) => setProgress(e.target.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onEnded={nextTrack}
      />

      {/* Track Info */}
      <div className="flex items-center gap-3 w-[30%] min-w-[180px]">
        {currentTrack?.thumbnail ? (
          <img src={currentTrack.thumbnail} className="w-14 h-14 rounded" alt="" />
        ) : (
          <div className="w-14 h-14 bg-spotify-lighter rounded flex items-center justify-center text-spotify-text">
            ♫
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate hover:underline cursor-pointer">
            {currentTrack?.title || 'Kein Song ausgewählt'}
          </p>
          <p className="text-xs text-spotify-text truncate hover:underline cursor-pointer">
            {currentTrack?.artist || '—'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 flex flex-col items-center max-w-[722px] gap-1">
        <div className="flex items-center gap-4">
          <button
            onClick={setShuffle}
            className={`transition-colors ${shuffle ? 'text-spotify-green' : 'text-spotify-text hover:text-white'}`}
          >
            <Shuffle size={16} />
          </button>
          <button onClick={prevTrack} className="text-spotify-text hover:text-white transition-colors">
            <SkipBack size={20} fill="currentColor" />
          </button>
          <button
            onClick={togglePlay}
            className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <Pause size={16} className="text-black" fill="black" />
            ) : (
              <Play size={16} className="text-black ml-0.5" fill="black" />
            )}
          </button>
          <button onClick={nextTrack} className="text-spotify-text hover:text-white transition-colors">
            <SkipForward size={20} fill="currentColor" />
          </button>
          <button
            onClick={cycleRepeat}
            className={`transition-colors ${repeat !== 'off' ? 'text-spotify-green' : 'text-spotify-text hover:text-white'}`}
          >
            <RepeatIcon size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 w-full">
          <span className="text-[11px] text-spotify-text w-10 text-right tabular-nums">
            {formatTime(progress)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={progress}
            onChange={(e) => {
              const v = Number(e.target.value);
              setProgress(v);
              if (audio.current) audio.current.currentTime = v;
            }}
            className="flex-1"
          />
          <span className="text-[11px] text-spotify-text w-10 tabular-nums">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume */}
      <div className="w-[30%] flex justify-end items-center gap-2 min-w-[180px]">
        <Volume2 size={16} className="text-spotify-text" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-24"
        />
      </div>
    </div>
  );
}
