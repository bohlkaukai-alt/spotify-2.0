import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import Library from './pages/Library';
import Playlist from './pages/Playlist';
import Artist from './pages/Artist';
import FullscreenView from './components/FullscreenView';
import usePlayerStore from './store/playerStore';

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
