import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle, Volume, Volume1, Volume2, Maximize2 } from 'lucide-react';
import usePlayerStore from '../store/playerStore';
import { getStreamUrl } from '../lib/api';

export default function Player({ onFullscreen }) {
  const { currentTrack, isPlaying, volume, repeat, shuffle, progress, duration, repeatMode,
    togglePlay, nextTrack, prevTrack, cycleRepeat, setShuffle, setVolume, setProgress, setDuration } = usePlayerStore();
  const audioRef = useRef(null);
  const [audioReady, setAudioReady] = useState(false);
  const lastTrackId = useRef(null);

  // Create hidden audio element on mount
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });
    audio.addEventListener('timeupdate', () => {
      setProgress(audio.currentTime);
    });
    audio.addEventListener('ended', () => {
      const st = usePlayerStore.getState();
      if (st.repeat === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else {
        st.nextTrack();
      }
    });
    audio.addEventListener('error', (e) => {
      console.warn('Audio error, trying YouTube fallback:', e);
    });

    setAudioReady(true);
    return () => { audio.pause(); audio.src = ''; };
  }, []);

  // When track changes, load and play via audio element
  useEffect(() => {
    if (!audioReady || !audioRef.current || !currentTrack) return;
    if (lastTrackId.current === currentTrack.id) return;

    lastTrackId.current = currentTrack.id;
    const audio = audioRef.current;

    const playTrack = async () => {
      try {
        const res = await fetch(getStreamUrl(currentTrack.id));
        const data = await res.json();
        if (data.url) {
          audio.src = data.url;
          audio.load();
          await audio.play();
          usePlayerStore.getState().setIsPlaying(true);
        }
      } catch (err) {
        console.warn('Audio stream failed:', err);
      }
    };

    playTrack();
  }, [currentTrack?.id, audioReady]);

  // Play/pause sync
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack]);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Visibility change: resume audio when page becomes visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && audioRef.current) {
        const st = usePlayerStore.getState();
        if (st.isPlaying && audioRef.current.paused) {
          audioRef.current.play().catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Heartbeat: keep audio alive
  useEffect(() => {
    if (!isPlaying || !audioRef.current) return;
    const heartbeat = setInterval(() => {
      if (audioRef.current && audioRef.current.paused && !audioRef.current.ended) {
        audioRef.current.play().catch(() => {});
      }
    }, 2000);
    return () => clearInterval(heartbeat);
  }, [isPlaying]);

  // Media Session API: lock screen + background controls
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      artwork: [{ src: currentTrack.thumbnail, sizes: '300x300', type: 'image/jpeg' }],
    });

    navigator.mediaSession.setActionHandler('play', () => {
      usePlayerStore.getState().setIsPlaying(true);
      audioRef.current?.play().catch(() => {});
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      usePlayerStore.getState().setIsPlaying(false);
      audioRef.current?.pause();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => usePlayerStore.getState().prevTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => usePlayerStore.getState().nextTrack());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime != null && audioRef.current) {
        audioRef.current.currentTime = details.seekTime;
        setProgress(details.seekTime);
      }
    });
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - (details.seekOffset || 10));
      }
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + (details.seekOffset || 10));
      }
    });

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [currentTrack, isPlaying]);

  // Global seek function for FullscreenView
  useEffect(() => {
    window.__ytSeek = (time) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
        setProgress(time);
      }
    };
  }, []);

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  const remaining = duration - progress;
  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;
  const VolumeIcon = volume === 0 ? Volume : volume < 0.5 ? Volume1 : Volume2;

  const seekTo = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const newTime = pct * (duration || 0);
    audioRef.current.currentTime = newTime;
    setProgress(newTime);
  };

  const repeatLabel = repeat === 'all' ? 'Playlist wiederholen' : repeat === 'one' ? 'Song wiederholen' : 'Wiederholen';

  return (
    <>
      {/* Desktop Player */}
      <div className="hidden sm:flex h-[72px] bg-[#0d0d0d] border-t border-[#1f1f1f] items-center px-4 z-50 shrink-0 gradient-border">
        {currentTrack ? (
          <>
            <div className="flex items-center gap-3 w-[30%] min-w-0 cursor-pointer group" onClick={onFullscreen}>
              <img src={currentTrack.thumbnail}
                className="w-14 h-14 rounded-lg object-cover shadow-lg group-hover:shadow-xl transition-shadow" alt="" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate group-hover:text-[var(--green)] transition-colors">{currentTrack.title}</p>
                <p className="text-xs text-[var(--text-dim)] truncate">{currentTrack.artist}</p>
              </div>
            </div>
            <div className="flex flex-col items-center flex-1 w-auto">
              <div className="flex items-center gap-4 mb-1">
                <button onClick={setShuffle}
                  className={`transition-colors ${shuffle ? 'text-[var(--green)]' : 'text-[var(--text-dim)] hover:text-white'}`}>
                  <Shuffle size={16} />
                </button>
                <button onClick={prevTrack} className="text-[var(--text)] hover:text-white transition-colors">
                  <SkipBack size={18} fill="currentColor" />
                </button>
                <button onClick={togglePlay}
                  className="w-9 h-9 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md">
                  {isPlaying ? <Pause size={18} className="text-black" fill="black" />
                    : <Play size={18} className="text-black ml-0.5" fill="black" />}
                </button>
                <button onClick={nextTrack} className="text-[var(--text)] hover:text-white transition-colors">
                  <SkipForward size={18} fill="currentColor" />
                </button>
                <button onClick={cycleRepeat} title={repeatLabel}
                  className={`transition-colors ${repeat !== 'off' ? 'text-[var(--green)]' : 'text-[var(--text-dim)] hover:text-white'}`}>
                  <RepeatIcon size={16} />
                </button>
              </div>
              <div className="flex items-center gap-2 w-full max-w-md">
                <span className="text-[11px] text-[var(--text-dim)] w-10 text-right tabular-nums">{fmt(progress)}</span>
                <div className="player-slider flex-1 h-1 bg-[#3e3e3e] rounded-full cursor-pointer group" onClick={seekTo}>
                  <div className="h-full bg-white group-hover:bg-[var(--green)] rounded-full relative transition-colors"
                    style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow" />
                  </div>
                </div>
                <span className="text-[11px] text-[var(--text-dim)] w-10 tabular-nums">
                  {duration ? `-${fmt(remaining > 0 ? remaining : 0)}` : '0:00'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 w-[30%] justify-end">
              <VolumeIcon size={16} className="text-[var(--text-dim)]" />
              <div className="player-slider w-24 h-1 bg-[#3e3e3e] rounded-full cursor-pointer group"
                onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setVolume((e.clientX - r.left) / r.width); }}>
                <div className="h-full bg-white group-hover:bg-[var(--green)] rounded-full relative transition-colors"
                  style={{ width: `${volume * 100}%` }}>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow" />
                </div>
              </div>
              <button onClick={onFullscreen} className="text-[var(--text-dim)] hover:text-white transition-colors ml-1">
                <Maximize2 size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <p className="text-[var(--text-dim)] text-sm">Song auswählen zum Abspielen</p>
          </div>
        )}
      </div>

      {/* Mobile Mini Player */}
      {currentTrack && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 glass gradient-border"
          onClick={onFullscreen}>
          <div className="h-[56px] flex items-center gap-3 px-3">
            <img src={currentTrack.thumbnail} className="w-10 h-10 rounded-lg object-cover shadow" alt="" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{currentTrack.title}</p>
              <p className="text-[11px] text-[var(--text-dim)] truncate">{currentTrack.artist}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="w-10 h-10 flex items-center justify-center">
              {isPlaying ? <Pause size={22} className="text-white" fill="white" />
                : <Play size={22} className="text-white ml-0.5" fill="white" />}
            </button>
          </div>
          {/* Progress line */}
          <div className="h-[2px] bg-[#3e3e3e]">
            <div className="h-full bg-[var(--green)] transition-all duration-500"
              style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
          </div>
        </div>
      )}
    </>
  );
}
