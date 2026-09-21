import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle, Heart } from 'lucide-react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import Library from './pages/Library';
import Playlist from './pages/Playlist';
import Artist from './pages/Artist';
import usePlayerStore from './store/playerStore';
import db from './lib/db';

export default function App() {
  const [fullscreen, setFullscreen] = useState(false);
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout onFullscreen={() => setFullscreen(true)} />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/library" element={<Library />} />
          <Route path="/playlist/:id" element={<Playlist />} />
          <Route path="/artist/:channelId" element={<Artist />} />
        </Route>
      </Routes>
      {fullscreen && currentTrack && <FullscreenView onClose={() => setFullscreen(false)} />}
    </BrowserRouter>
  );
}

function FullscreenView({ onClose }) {
  const [isFav, setIsFav] = useState(false);
  const {
    currentTrack, isPlaying, progress, duration, shuffle, repeat,
    togglePlay, setProgress, nextTrack, prevTrack, setShuffle, cycleRepeat,
  } = usePlayerStore();

  useEffect(() => {
    if (!currentTrack) return;
    db.favorites.where('trackId').equals(currentTrack.id).first().then((f) => setIsFav(!!f));
  }, [currentTrack?.id]);

  const toggleFav = async () => {
    if (!currentTrack) return;
    if (isFav) {
      const ex = await db.favorites.where('trackId').equals(currentTrack.id).first();
      if (ex) await db.favorites.delete(ex.id);
    } else {
      await db.favorites.add({ trackId: currentTrack.id, title: currentTrack.title,
        artist: currentTrack.artist, thumbnail: currentTrack.thumbnail, addedAt: new Date() });
    }
    setIsFav(!isFav);
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  const seek = (e) => {
    const v = Number(e.target.value);
    setProgress(v);
    const audio = document.querySelector('audio');
    if (audio) audio.currentTime = v;
  };

  const rem = duration - progress;
  const RepIcon = repeat === 'one' ? Repeat1 : Repeat;

  return (
    <div className="fixed inset-0 z-[200] bg-gradient-to-b from-[#1a1a2e] to-spotify-black flex flex-col items-center justify-between p-8">
      <div className="w-full flex justify-start">
        <button onClick={onClose} className="text-spotify-text hover:text-white text-3xl font-light">&times;</button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {currentTrack?.thumbnail ? (
          <img src={currentTrack.thumbnail} className="w-[320px] h-[320px] rounded-lg shadow-2xl object-cover" alt="" />
        ) : (
          <div className="w-[320px] h-[320px] bg-spotify-lighter rounded-lg flex items-center justify-center text-spotify-text text-8xl">♫</div>
        )}
      </div>

      <div className="w-full max-w-[700px] flex flex-col items-center gap-5 pb-4">
        <div className="w-full flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold truncate">{currentTrack?.title}</p>
            <p className="text-spotify-text text-lg">{currentTrack?.artist}</p>
          </div>
          <button onClick={toggleFav} className="ml-4 shrink-0">
            <Heart size={24} className={isFav ? 'text-spotify-green fill-spotify-green' : 'text-spotify-text hover:text-white'} />
          </button>
        </div>

        <div className="w-full flex items-center gap-3">
          <span className="text-xs text-spotify-text w-10 text-right tabular-nums">{fmt(progress)}</span>
          <input type="range" min="0" max={duration || 0} value={progress} onChange={seek}
            className="flex-1 h-1 player-slider" />
          <span className="text-xs text-spotify-text w-10 tabular-nums">-{fmt(rem > 0 ? rem : 0)}</span>
        </div>

        <div className="flex items-center gap-8">
          <button onClick={setShuffle} className={shuffle ? 'text-spotify-green' : 'text-spotify-text hover:text-white'}><Shuffle size={22} /></button>
          <button onClick={prevTrack} className="text-white hover:scale-110 transition-transform"><SkipBack size={28} fill="currentColor" /></button>
          <button onClick={togglePlay} className="w-14 h-14 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform">
            {isPlaying ? <Pause size={28} className="text-black" fill="black" /> : <Play size={28} className="text-black ml-1" fill="black" />}
          </button>
          <button onClick={nextTrack} className="text-white hover:scale-110 transition-transform"><SkipForward size={28} fill="currentColor" /></button>
          <button onClick={cycleRepeat} className={repeat !== 'off' ? 'text-spotify-green' : 'text-spotify-text hover:text-white'}><RepIcon size={22} /></button>
        </div>
      </div>
    </div>
  );
}
