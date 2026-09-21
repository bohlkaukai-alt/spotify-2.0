import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle, Volume, Volume1, Volume2, Maximize2 } from 'lucide-react';
import usePlayerStore from '../store/playerStore';

export default function Player({ onFullscreen }) {
  const { currentTrack, isPlaying, volume, repeat, shuffle, progress, duration,
    togglePlay, nextTrack, prevTrack, setRepeat, setShuffle, setVolume, setProgress, setDuration } = usePlayerStore();
  const playerRef = useRef(null);
  const ytPlayer = useRef(null);
  const [ready, setReady] = useState(false);

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
            if (st.repeat === 'one') { ytPlayer.current.seekTo(0, true); ytPlayer.current.playVideo(); }
            else st.nextTrack();
          }
        },
      },
    });
  }, [ready]);

  const ytPlay = useCallback((videoId) => {
    if (!ytPlayer.current) return;
    ytPlayer.current.loadVideoById({ videoId, suggestedQuality: 'small' });
    setProgress(0);
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

  const seekTo = (e) => {
    if (!ytPlayer.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    ytPlayer.current.seekTo(pct * duration, true);
    setProgress(pct * duration);
  };

  return (
    <>
      <div ref={playerRef} style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }} />
      <div className="h-[64px] sm:h-[72px] bg-spotify-black border-t border-[#282828] flex flex-col sm:flex-row items-center px-2 sm:px-4 z-50 shrink-0">
        {currentTrack ? (
          <>
            <div className="flex items-center gap-3 w-full sm:w-[30%] min-w-0 mb-2 sm:mb-0 cursor-pointer" onClick={onFullscreen}>
              <img src={currentTrack.thumbnail} className="w-10 h-10 sm:w-14 sm:h-14 rounded object-cover shrink-0" alt="" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">{currentTrack.title}</p>
                <p className="text-[10px] sm:text-xs text-spotify-text truncate">{currentTrack.artist}</p>
              </div>
            </div>
            <div className="flex flex-col items-center flex-1 w-full sm:w-auto">
              <div className="flex items-center gap-2 sm:gap-4 mb-0.5 sm:mb-1">
                <Shuffle size={14} className={`cursor-pointer hidden sm:block ${shuffle ? 'text-spotify-green' : 'text-spotify-text hover:text-white'}`} onClick={setShuffle} />
                <SkipBack size={16} className="cursor-pointer text-spotify-text hover:text-white" onClick={prevTrack} />
                <button onClick={togglePlay} className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center hover:scale-105">
                  {isPlaying ? <Pause size={16} className="text-black" fill="black" /> : <Play size={16} className="text-black ml-0.5" fill="black" />}
                </button>
                <SkipForward size={16} className="cursor-pointer text-spotify-text hover:text-white" onClick={nextTrack} />
                <RepeatIcon size={14} className={`cursor-pointer hidden sm:block ${repeat !== 'off' ? 'text-spotify-green' : 'text-spotify-text hover:text-white'}`} onClick={setRepeat} />
              </div>
              <div className="flex items-center gap-2 w-full max-w-md">
                <span className="text-[10px] sm:text-xs text-spotify-text w-8 sm:w-10 text-right">{fmt(progress)}</span>
                <div className="player-slider flex-1 h-1 bg-[#4d4d4d] rounded-full cursor-pointer group" onClick={seekTo}>
                  <div className="h-full bg-white group-hover:bg-spotify-green rounded-full relative" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow" />
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs text-spotify-text w-8 sm:w-10">{duration ? `-${fmt(remaining)}` : '0:00'}</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 w-[30%] justify-end">
              <VolumeIcon size={14} className="text-spotify-text" />
              <div className="player-slider w-24 h-1 bg-[#4d4d4d] rounded-full cursor-pointer group" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setVolume((e.clientX - r.left) / r.width); }}>
                <div className="h-full bg-white group-hover:bg-spotify-green rounded-full relative" style={{ width: `${volume * 100}%` }}>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow" />
                </div>
              </div>
              <Maximize2 size={14} className="text-spotify-text hover:text-white cursor-pointer" onClick={onFullscreen} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <p className="text-spotify-text text-sm">Song auswählen zum Abspielen</p>
          </div>
        )}
      </div>
    </>
  );
}
