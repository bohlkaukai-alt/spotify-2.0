import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle, Volume, Volume1, Volume2, Maximize2 } from 'lucide-react';
import usePlayerStore from '../store/playerStore';

export default function Player({ onFullscreen }) {
  const { currentTrack, isPlaying, volume, repeat, shuffle, progress, duration,
    togglePlay, nextTrack, prevTrack, cycleRepeat, setShuffle, setVolume, setProgress, setDuration } = usePlayerStore();
  const playerRef = useRef(null);
  const ytPlayer = useRef(null);
  const audioCtxRef = useRef(null);
  const oscillatorRef = useRef(null);
  const [ready, setReady] = useState(false);

  // YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) { setReady(true); return; }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !playerRef.current || ytPlayer.current) return;
    ytPlayer.current = new window.YT.Player(playerRef.current, {
      height: '1', width: '1',
      playerVars: { autoplay: 0, controls: 0, disablekb: 1, modestbranding: 1, rel: 0, playsinline: 1 },
      events: {
        onStateChange: (e) => {
          if (e.data === window.YT.PlayerState.ENDED) {
            const st = usePlayerStore.getState();
            if (st.repeat === 'one') {
              ytPlayer.current.seekTo(0, true);
              ytPlayer.current.playVideo();
            } else {
              st.nextTrack();
            }
          }
        },
      },
    });
  }, [ready]);

  // Keep Web Audio API context alive for background playback
  useEffect(() => {
    const keepAlive = () => {
      if (audioCtxRef.current) return;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current = ctx;
        // Create silent oscillator to keep context alive
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        oscillatorRef.current = osc;
      } catch (e) {}
    };
    // Start on first user interaction
    document.addEventListener('touchstart', keepAlive, { once: true });
    document.addEventListener('click', keepAlive, { once: true });
    return () => {
      document.removeEventListener('touchstart', keepAlive);
      document.removeEventListener('click', keepAlive);
      oscillatorRef.current?.stop();
      audioCtxRef.current?.close();
    };
  }, []);

  // Resume AudioContext on visibility change
  useEffect(() => {
    const handle = () => {
      if (document.visibilityState === 'visible' && audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };
    document.addEventListener('visibilitychange', handle);
    return () => document.removeEventListener('visibilitychange', handle);
  }, []);

  // Play track
  const ytPlay = useCallback((videoId) => {
    if (!ytPlayer.current) return;
    ytPlayer.current.loadVideoById({ videoId, suggestedQuality: 'small' });
    usePlayerStore.getState().setProgress(0);
  }, []);

  useEffect(() => { window.__ytPlay = ytPlay; }, [ytPlay]);

  useEffect(() => {
    window.__ytSeek = (time) => {
      if (ytPlayer.current) ytPlayer.current.seekTo(time, true);
    };
  }, []);

  useEffect(() => {
    if (!ytPlayer.current) return;
    if (isPlaying) ytPlayer.current.playVideo();
    else ytPlayer.current.pauseVideo();
  }, [isPlaying]);

  useEffect(() => { if (ytPlayer.current) ytPlayer.current.setVolume(volume * 100); }, [volume]);

  useEffect(() => {
    if (!ytPlayer.current || !isPlaying) return;
    const iv = setInterval(() => {
      if (ytPlayer.current?.getCurrentTime) {
        setProgress(ytPlayer.current.getCurrentTime());
        setDuration(ytPlayer.current.getDuration());
      }
    }, 500);
    return () => clearInterval(iv);
  }, [isPlaying]);

  // Visibility change: resume playback
  useEffect(() => {
    const handle = () => {
      if (document.visibilityState !== 'visible') return;
      const st = usePlayerStore.getState();
      if (st.isPlaying && ytPlayer.current) {
        const state = ytPlayer.current.getPlayerState?.();
        if (state !== 1) { // not already playing
          ytPlayer.current.playVideo();
        }
      }
      // Resume AudioContext
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };
    document.addEventListener('visibilitychange', handle);
    return () => document.removeEventListener('visibilitychange', handle);
  }, []);

  // Heartbeat: keep playing
  useEffect(() => {
    if (!isPlaying) return;
    const iv = setInterval(() => {
      if (!ytPlayer.current) return;
      const st = usePlayerStore.getState();
      if (!st.isPlaying) return;
      const state = ytPlayer.current.getPlayerState?.();
      // Paused (2) or unstarted (-1) → resume
      if (state === 2 || state === -1) {
        ytPlayer.current.playVideo();
      }
    }, 3000);
    return () => clearInterval(iv);
  }, [isPlaying]);

  // Media Session API
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title, artist: currentTrack.artist,
      artwork: [{ src: currentTrack.thumbnail, sizes: '300x300', type: 'image/jpeg' }],
    });
    navigator.mediaSession.setActionHandler('play', () => {
      usePlayerStore.getState().setIsPlaying(true);
      ytPlayer.current?.playVideo();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      usePlayerStore.getState().setIsPlaying(false);
      ytPlayer.current?.pauseVideo();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => usePlayerStore.getState().prevTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => usePlayerStore.getState().nextTrack());
    navigator.mediaSession.setActionHandler('seekto', (d) => {
      if (d.seekTime != null && ytPlayer.current) {
        ytPlayer.current.seekTo(d.seekTime, true);
        setProgress(d.seekTime);
      }
    });
    navigator.mediaSession.setActionHandler('seekbackward', (d) => {
      if (ytPlayer.current) {
        const t = Math.max(0, (ytPlayer.current.getCurrentTime?.() || 0) - (d.seekOffset || 10));
        ytPlayer.current.seekTo(t, true);
      }
    });
    navigator.mediaSession.setActionHandler('seekforward', (d) => {
      if (ytPlayer.current) {
        const t = (ytPlayer.current.getCurrentTime?.() || 0) + (d.seekOffset || 10);
        ytPlayer.current.seekTo(t, true);
      }
    });
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [currentTrack, isPlaying]);

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  const remaining = duration - progress;
  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;
  const VolumeIcon = volume === 0 ? Volume : volume < 0.5 ? Volume1 : Volume2;

  const seekTo = (e) => {
    if (!ytPlayer.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    ytPlayer.current.seekTo(pct * duration, true);
    setProgress(pct * duration);
  };

  const repeatLabel = repeat === 'all' ? 'Playlist wiederholen' : repeat === 'one' ? 'Song wiederholen' : 'Wiederholen';

  return (
    <>
      <div ref={playerRef} style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }} />

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
          <div className="h-[2px] bg-[#3e3e3e]">
            <div className="h-full bg-[var(--green)] transition-all duration-500"
              style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
          </div>
        </div>
      )}
    </>
  );
}
