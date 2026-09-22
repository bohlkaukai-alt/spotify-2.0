import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Heart } from 'lucide-react';
import db from '../lib/db';
import usePlayerStore from '../store/playerStore';

export default function Library() {
  const [favorites, setFavorites] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const navigate = useNavigate();
  const setTrack = usePlayerStore((s) => s.setTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);

  useEffect(() => {
    db.favorites.orderBy('addedAt').reverse().then(setFavorites);
    db.playlists.toArray().then(setPlaylists);
  }, []);

  return (
    <div className="pb-28 md:pb-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="md:hidden w-10 h-10 flex items-center justify-center">
          <ChevronLeft size={24} className="text-white" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Deine Bibliothek</h1>
      </div>

      {/* Liked Songs */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Lieblingssongs</h2>
        {favorites.length === 0 ? (
          <p className="text-sm text-[var(--text-dim)]">Noch keine Songs geliked</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {favorites.map((fav) => (
              <div key={fav.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-[#1a1a1a] cursor-pointer group transition-colors"
                onClick={() => {
                  db.favorites.toArray().then(favs => {
                    const tracks = favs.map(f => ({ id: f.trackId, title: f.title, artist: f.artist, thumbnail: f.thumbnail, streamUrl: null }));
                    setQueue(tracks);
                    setTrack(tracks.find(t => t.id === fav.trackId) || tracks[0]);
                  });
                }}>
                <img src={fav.thumbnail} alt="" className="w-12 h-12 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{fav.title}</p>
                  <p className="text-xs text-[var(--text-dim)] truncate">{fav.artist}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Playlists */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Playlists</h2>
        {playlists.length === 0 ? (
          <p className="text-sm text-[var(--text-dim)]">Noch keine Playlists erstellt</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {playlists.map((pl) => (
              <div key={pl.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-[#1a1a1a] cursor-pointer group transition-colors"
                onClick={() => navigate(`/playlist/${pl.id}`)}>
                <div className="w-12 h-12 rounded-md bg-[#282828] flex items-center justify-center">
                  <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16" className="text-[var(--text-dim)]">
                    <path d="M15.25 8a.75.75 0 0 1-.75.75H8.75v5.75a.75.75 0 0 1-1.5 0V8.75H1.5a.75.75 0 0 1 0-1.5h5.75V1.5a.75.75 0 0 1 1.5 0v5.75h5.75a.75.75 0 0 1 .75.75z"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{pl.name}</p>
                  <p className="text-xs text-[var(--text-dim)]">Playlist</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
