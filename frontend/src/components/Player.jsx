import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle, Volume, Volume1, Volume2, Maximize2 } from 'lucide-react';
import usePlayerStore from '../store/playerStore';

export default function Player({ onFullscreen }) {
  const { currentTrack, isPlaying, volume, repeat, shuffle, progress, duration,
    togglePlay, nextTrack, prevTrack, cycleRepeat, setShuffle, setVolume, setProgress, setDuration } = usePlayerStore();
  const audioRef = useRef(null);
  const playerRef = useRef(null);
  const ytPlayer = useRef(null);
  const lastTrackId = useRef(null);
  const [ytReady, setYtReady] = useState(false);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('timeupdate', () => { if (!audio.seeking) setProgress(audio.currentTime); });
    audio.addEventListener('ended', () => {
      const st = usePlayerStore.getState();
      if (st.repeat === 'one') { audio.currentTime = 0; audio.play(); }
      else st.nextTrack();
    });
    audio.addEventListener('playing', () => usePlayerStore.getState().setIsPlaying(true));
    return () => { audio.pause(); audio.removeAttribute('src'); audio.load(); };
  }, []);

  useEffect(() => {
    if (window.YT && window.YT.Player) { initYT(); return; }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => { setYtReady(true); initYT(); };
  }, []);

  useEffect(() => { if (ytReady && !ytPlayer.current && playerRef.current) initYT(); }, [ytReady]);

  const initYT = () => {
    if (ytPlayer.current || !playerRef.current) return;
    try {
      ytPlayer.current = new window.YT.Player(playerRef.current, {
        height: '1', width: '1',
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, modestbranding: 1, rel: 0, playsinline: 1 },
        events: {
          onReady: () => setYtReady(true),
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              const st = usePlayerStore.getState();
              if (st.repeat === 'one') { ytPlayer.current.seekTo(0, true); ytPlayer.current.playVideo(); }
              else st.nextTrack();
            }
          },
        },
      });
    } catch {}
  };

  useEffect(() => {
    if (!currentTrack) return;
    if (lastTrackId.current === currentTrack.id) return;
    lastTrackId.current = currentTrack.id;
    const loadTrack = async () => {
      if (currentTrack.streamUrl && audioRef.current) {
        try {
          audioRef.current.src = currentTrack.streamUrl;
          audioRef.current.load();
          await audioRef.current.play();
          usePlayerStore.getState().setIsPlaying(true);
          updateMediaSession(currentTrack);
          return;
        } catch {}
      }
      setProgress(0);
      updateMediaSession(currentTrack);
      if (ytPlayer.current && ytReady) {
        ytPlayer.current.loadVideoById({ videoId: currentTrack.id, suggestedQuality: 'small' });
      }
    };
    loadTrack();
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!currentTrack) return;
    const hasStream = currentTrack.streamUrl && audioRef.current?.src;
    if (hasStream) { if (isPlaying) audioRef.current.play().catch(() => {}); else audioRef.current.pause(); }
    else if (ytPlayer.current && ytReady) { if (isPlaying) ytPlayer.current.playVideo(); else ytPlayer.current.pauseVideo(); }
  }, [isPlaying, currentTrack, ytReady]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    if (ytPlayer.current) ytPlayer.current.setVolume(volume * 100);
  }, [volume]);

  useEffect(() => {
    window.__ytSeek = (time) => {
      if (audioRef.current?.src && currentTrack?.streamUrl) { audioRef.current.currentTime = time; setProgress(time); }
      else if (ytPlayer.current) { ytPlayer.current.seekTo(time, true); setProgress(time); }
    };
  }, [currentTrack?.streamUrl]);

  useEffect(() => {
    const handle = () => {
      if (document.visibilityState !== 'visible') return;
      const st = usePlayerStore.getState();
      if (!st.isPlaying) return;
      const hasStream = st.currentTrack?.streamUrl && audioRef.current?.src;
      if (hasStream && audioRef.current?.paused && !audioRef.current.ended) audioRef.current.play().catch(() => {});
      if (!hasStream && ytPlayer.current) { const s = ytPlayer.current.getPlayerState?.(); if (s !== 1) ytPlayer.current.playVideo(); }
    };
    document.addEventListener('visibilitychange', handle);
    return () => document.removeEventListener('visibilitychange', handle);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const iv = setInterval(() => {
      const st = usePlayerStore.getState();
      if (!st.isPlaying) return;
      const hasStream = st.currentTrack?.streamUrl && audioRef.current?.src;
      if (hasStream && audioRef.current?.paused && !audioRef.current.ended) audioRef.current.play().catch(() => {});
      if (!hasStream && ytPlayer.current) { const s = ytPlayer.current.getPlayerState?.(); if (s === 2 || s === -1) ytPlayer.current.playVideo(); }
    }, 2000);
    return () => clearInterval(iv);
  }, [isPlaying]);

  useEffect(() => {
    const ctxRef = { current: null }, oscRef = { current: null };
    const keepAlive = () => {
      if (ctxRef.current) return;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        ctxRef.current = ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0;
        osc.connect(gain); gain.connect(ctx.destination); osc.start();
        oscRef.current = osc;
      } catch {}
    };
    document.addEventListener('touchstart', keepAlive, { once: true });
    document.addEventListener('click', keepAlive, { once: true });
    return () => {
      document.removeEventListener('touchstart', keepAlive);
      document.removeEventListener('click', keepAlive);
      oscRef.current?.stop(); ctxRef.current?.close();
    };
  }, []);

  const updateMediaSession = (track) => {
    if (!('mediaSession' in navigator) || !track) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title, artist: track.artist,
      artwork: track.thumbnail ? [{ src: track.thumbnail, sizes: '300x300', type: 'image/jpeg' }] : [],
    });
  };

  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;
    updateMediaSession(currentTrack);
    navigator.mediaSession.setActionHandler('play', () => usePlayerStore.getState().setIsPlaying(true));
    navigator.mediaSession.setActionHandler('pause', () => usePlayerStore.getState().setIsPlaying(false));
    navigator.mediaSession.setActionHandler('previoustrack', () => usePlayerStore.getState().prevTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => usePlayerStore.getState().nextTrack());
  }, [currentTrack]);

  useEffect(() => {
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  const fmt = (s) => { if (!s || isNaN(s)) return '0:00'; return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`; };
  const remaining = duration - progress;
  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;
  const VolumeIcon = volume === 0 ? Volume : volume < 0.5 ? Volume1 : Volume2;

  const seekTo = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const t = pct * (duration || 0);
    if (window.__ytSeek) window.__ytSeek(t);
    setProgress(t);
  };

  return (
    <>
      <div ref={playerRef} style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', pointerEvents: 'none' }} />

      {/* Desktop Player Bar */}
      <div className="hidden md:flex h-[72px] bg-[#181818] border-t border-[#282828] items-center px-4 z-50 shrink-0">
        {currentTrack ? (
          <>
            <div className="flex items-center gap-3 w-[30%] min-w-0">
              <img src={currentTrack.thumbnail} className="w-14 h-14 rounded-md object-cover shadow-md" alt="" />
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-white truncate hover:underline cursor-pointer">{currentTrack.title}</p>
                <p className="text-[11px] text-[var(--text-dim)] truncate hover:underline cursor-pointer hover:text-white">{currentTrack.artist}</p>
              </div>
            </div>
            <div className="flex flex-col items-center flex-1 max-w-[45%]">
              <div className="flex items-center gap-4 mb-1.5">
                <button onClick={setShuffle}
                  className={`transition-colors ${shuffle ? 'text-[var(--green)]' : 'text-[var(--text-dim)] hover:text-white'}`}>
                  <Shuffle size={16} />
                </button>
                <button onClick={prevTrack} className="text-[var(--text-dim)] hover:text-white transition-colors">
                  <SkipBack size={16} fill="currentColor" />
                </button>
                <button onClick={togglePlay}
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                  {isPlaying ? <Pause size={16} className="text-black" fill="black" />
                    : <Play size={16} className="text-black ml-0.5" fill="black" />}
                </button>
                <button onClick={nextTrack} className="text-[var(--text-dim)] hover:text-white transition-colors">
                  <SkipForward size={16} fill="currentColor" />
                </button>
                <button onClick={cycleRepeat}
                  className={`transition-colors ${repeat !== 'off' ? 'text-[var(--green)]' : 'text-[var(--text-dim)] hover:text-white'}`}>
                  <RepeatIcon size={16} />
                </button>
              </div>
              <div className="flex items-center gap-2 w-full">
                <span className="text-[11px] text-[var(--text-dim)] w-10 text-right tabular-nums">{fmt(progress)}</span>
                <div className="flex-1 h-1 bg-[#4d4d4d] rounded-full cursor-pointer group hover:h-1.5 transition-all" onClick={seekTo}>
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
              <button onClick={onFullscreen} className="text-[var(--text-dim)] hover:text-white transition-colors">
                <Maximize2 size={14} />
              </button>
              <VolumeIcon size={14} className="text-[var(--text-dim)]" />
              <div className="w-24 h-1 bg-[#4d4d4d] rounded-full cursor-pointer group hover:h-1.5 transition-all"
                onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setVolume((e.clientX - r.left) / r.width); }}>
                <div className="h-full bg-white group-hover:bg-[var(--green)] rounded-full relative transition-colors"
                  style={{ width: `${volume * 100}%` }}>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow" />
                </div>
              </div>
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
        <div className="md:hidden fixed left-0 right-0 z-50 bg-[#382a2a] border-t border-white/5"
          style={{ bottom: '52px', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          onClick={onFullscreen}>
          <div className="h-[56px] flex items-center gap-3 px-3">
            <img src={currentTrack.thumbnail} className="w-10 h-10 rounded-md object-cover shadow" alt="" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-white truncate">{currentTrack.title}</p>
              <p className="text-[11px] text-[var(--text-dim)] truncate">{currentTrack.artist}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="w-8 h-8 flex items-center justify-center">
              {isPlaying ? <Pause size={20} className="text-white" fill="white" />
                : <Play size={20} className="text-white ml-0.5" fill="white" />}
            </button>
          </div>
          <div className="h-[2px] bg-[#4d4d4d]">
            <div className="h-full bg-white transition-all"
              style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
          </div>
        </div>
      )}
    </>
  );
}
