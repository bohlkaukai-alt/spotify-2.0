import { useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle, Volume, Volume1, Volume2, Maximize2 } from 'lucide-react';
import usePlayerStore from '../store/playerStore';
import { getStreamUrl } from '../lib/api';

export default function Player({ onFullscreen }) {
  const audio = useRef(null);
  const {
    currentTrack, isPlaying, volume, progress, duration, shuffle, repeat,
    togglePlay, setProgress, setDuration, nextTrack, prevTrack, setVolume,
    setShuffle, cycleRepeat,
  } = usePlayerStore();

  useEffect(() => {
    if (!currentTrack || !audio.current) return;
    const el = audio.current;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(getStreamUrl(currentTrack.id));
        const data = await res.json();
        if (cancelled) return;
        el.src = data.url;
        el.load();
        const onReady = () => { el.play().catch(() => {}); };
        el.addEventListener('loadeddata', onReady, { once: true });
        return () => el.removeEventListener('loadeddata', onReady);
      } catch {}
    };
    load();
    return () => { cancelled = true; };
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!audio.current) return;
    if (isPlaying) audio.current.play().catch(() => {});
    else audio.current.pause();
  }, [isPlaying]);

  useEffect(() => { if (audio.current) audio.current.volume = volume; }, [volume]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title, artist: currentTrack.artist,
      artwork: [{ src: currentTrack.thumbnail, sizes: '300x300', type: 'image/jpeg' }],
    });
    navigator.mediaSession.setActionHandler('play', () => usePlayerStore.getState().togglePlay());
    navigator.mediaSession.setActionHandler('pause', () => usePlayerStore.getState().togglePlay());
    navigator.mediaSession.setActionHandler('previoustrack', () => usePlayerStore.getState().prevTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => usePlayerStore.getState().nextTrack());
  }, [currentTrack]);

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  const remaining = duration - progress;
  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;
  const VolumeIcon = volume === 0 ? Volume : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="h-[64px] sm:h-[72px] bg-spotify-black border-t border-[#282828] flex flex-col sm:flex-row items-center px-2 sm:px-4 z-50 shrink-0">
      <audio ref={audio} crossOrigin="anonymous"
        onTimeUpdate={(e) => setProgress(e.target.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onEnded={nextTrack}
      />

      {/* Mobile: track info + play button */}
      <div className="sm:hidden w-full flex items-center gap-2 py-1">
        {currentTrack?.thumbnail ? (
          <img src={currentTrack.thumbnail} className="w-10 h-10 rounded shrink-0" alt="" onClick={onFullscreen} />
        ) : (
          <div className="w-10 h-10 bg-spotify-lighter rounded shrink-0 flex items-center justify-center text-spotify-text text-xs">♫</div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium truncate">{currentTrack?.title || 'Kein Song'}</p>
          <p className="text-[10px] text-spotify-text truncate">{currentTrack?.artist || '—'}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={prevTrack} className="text-spotify-text p-1"><SkipBack size={16} fill="currentColor" /></button>
          <button onClick={togglePlay} className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            {isPlaying ? <Pause size={14} className="text-black" fill="black" /> : <Play size={14} className="text-black ml-0.5" fill="black" />}
          </button>
          <button onClick={nextTrack} className="text-spotify-text p-1"><SkipForward size={16} fill="currentColor" /></button>
        </div>
      </div>

      {/* Mobile: progress bar */}
      <div className="sm:hidden w-full flex items-center gap-1 px-1 pb-1">
        <span className="text-[9px] text-spotify-text w-7 text-right tabular-nums">{fmt(progress)}</span>
        <input type="range" min="0" max={duration || 0} value={progress}
          onChange={(e) => { const v = Number(e.target.value); setProgress(v); if (audio.current) audio.current.currentTime = v; }}
          className="flex-1 player-slider" style={{ height: '2px' }} />
        <span className="text-[9px] text-spotify-text w-7 tabular-nums">-{fmt(remaining > 0 ? remaining : 0)}</span>
      </div>

      {/* Desktop layout */}
      <div className="hidden sm:flex items-center w-full">
        {/* Track Info */}
        <div className="flex items-center gap-3 w-[30%] min-w-[180px]">
          {currentTrack?.thumbnail ? (
            <img src={currentTrack.thumbnail} className="w-14 h-14 rounded cursor-pointer" alt="" onClick={onFullscreen} />
          ) : (
            <div className="w-14 h-14 bg-spotify-lighter rounded flex items-center justify-center text-spotify-text">♫</div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{currentTrack?.title || 'Kein Song'}</p>
            <p className="text-xs text-spotify-text truncate">{currentTrack?.artist || '—'}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 flex flex-col items-center max-w-[722px] gap-1">
          <div className="flex items-center gap-4">
            <button onClick={setShuffle} className={`transition-colors ${shuffle ? 'text-spotify-green' : 'text-spotify-text hover:text-white'}`}><Shuffle size={16} /></button>
            <button onClick={prevTrack} className="text-spotify-text hover:text-white"><SkipBack size={20} fill="currentColor" /></button>
            <button onClick={togglePlay} className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-105">
              {isPlaying ? <Pause size={16} className="text-black" fill="black" /> : <Play size={16} className="text-black ml-0.5" fill="black" />}
            </button>
            <button onClick={nextTrack} className="text-spotify-text hover:text-white"><SkipForward size={20} fill="currentColor" /></button>
            <button onClick={cycleRepeat} className={`transition-colors ${repeat !== 'off' ? 'text-spotify-green' : 'text-spotify-text hover:text-white'}`}><RepeatIcon size={16} /></button>
          </div>
          <div className="flex items-center gap-2 w-full">
            <span className="text-[11px] text-spotify-text w-10 text-right tabular-nums">{fmt(progress)}</span>
            <input type="range" min="0" max={duration || 0} value={progress}
              onChange={(e) => { const v = Number(e.target.value); setProgress(v); if (audio.current) audio.current.currentTime = v; }}
              className="flex-1 player-slider" />
            <span className="text-[11px] text-spotify-text w-10 tabular-nums">-{fmt(remaining > 0 ? remaining : 0)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="w-[30%] flex justify-end items-center gap-2 min-w-[180px]">
          <button onClick={onFullscreen} className="text-spotify-text hover:text-white mr-1"><Maximize2 size={16} /></button>
          <VolumeIcon size={16} className="text-spotify-text shrink-0" />
          <input type="range" min="0" max="1" step="0.01" value={volume}
            onChange={(e) => setVolume(Number(e.target.value))} className="w-24 player-slider" />
        </div>
      </div>
    </div>
  );
}
