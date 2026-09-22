import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import db from '../lib/db';
import usePlayerStore from '../store/playerStore';

const GRADIENTS = [
  'from-[#1e3264] to-[#121212]',
  'from-[#503750] to-[#121212]',
  'from-[#1e90ff] to-[#121212]',
  'from-[#e13300] to-[#121212]',
  'from-[#006450] to-[#121212]',
  'from-[#ba5d07] to-[#121212]',
  'from-[#dc148c] to-[#121212]',
  'from-[#477d95] to-[#121212]',
];

export default function Home() {
  const [favorites, setFavorites] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const navigate = useNavigate();
  const setTrack = usePlayerStore((s) => s.setTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);

  useEffect(() => {
    db.favorites.orderBy('addedAt').reverse().limit(6).then(setFavorites);
    db.playlists.toArray().then(setPlaylists);
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Guten Morgen';
    if (h < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  const quickAccess = [...favorites.slice(0, 4), ...playlists.slice(0, 4 - Math.min(favorites.length, 4))];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <h1 className="text-2xl sm:text-3xl font-bold text-white">{greeting()}</h1>

      {/* Quick Access Grid */}
      {quickAccess.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {quickAccess.map((item, i) => (
            <button key={item.id || i}
              onClick={() => {
                if (item.trackId) {
                  db.favorites.toArray().then(favs => {
                    const track = favs.find(f => f.id === item.id);
                    if (track) {
                      setQueue(favs.map(f => ({ id: f.trackId, title: f.title, artist: f.artist, thumbnail: f.thumbnail, streamUrl: null })));
                      setTrack({ id: item.trackId, title: item.title, artist: item.artist, thumbnail: item.thumbnail, streamUrl: null });
                    }
                  });
                } else {
                  navigate(`/playlist/${item.id}`);
                }
              }}
              className="flex items-center gap-0 bg-[#282828]/60 hover:bg-[#3e3e3e]/80 rounded-md overflow-hidden transition-colors group">
              <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 bg-[#282828] flex items-center justify-center overflow-hidden">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : item.trackId ? (
                  <svg viewBox="0 0 16 16" fill="currentColor" width="20" height="20" className="text-[var(--text-dim)]">
                    <path d="M15.724 4.22A4.313 4.313 0 0 0 12.192.814a4.269 4.269 0 0 0-3.622 1.13.837.837 0 0 1-1.14 0 4.272 4.272 0 0 0-6.38 5.57l5.593 7.434a1.12 1.12 0 0 0 1.79-.003l5.597-7.44a4.29 4.29 0 0 0 1.494-3.295z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 16 16" fill="currentColor" width="20" height="20" className="text-[var(--text-dim)]">
                    <path d="M15.25 8a.75.75 0 0 1-.75.75H8.75v5.75a.75.75 0 0 1-1.5 0V8.75H1.5a.75.75 0 0 1 0-1.5h5.75V1.5a.75.75 0 0 1 1.5 0v5.75h5.75a.75.75 0 0 1 .75.75z"/>
                  </svg>
                )}
              </div>
              <span className="px-3 text-sm font-bold text-white truncate">{item.title || item.name || 'Lieblingssongs'}</span>
            </button>
          ))}
        </div>
      )}

      {/* Recently Liked */}
      {favorites.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white hover:underline cursor-pointer"
              onClick={() => navigate('/library')}>Zuletzt gelikte Songs</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {favorites.map((fav) => (
              <div key={fav.id}
                className="bg-[#181818] p-4 rounded-lg hover:bg-[#282828] cursor-pointer transition-all group relative"
                onClick={() => {
                  db.favorites.toArray().then(favs => {
                    const tracks = favs.map(f => ({ id: f.trackId, title: f.title, artist: f.artist, thumbnail: f.thumbnail, streamUrl: null }));
                    setQueue(tracks);
                    setTrack(tracks.find(t => t.id === fav.trackId) || tracks[0]);
                  });
                }}>
                <div className="relative mb-4">
                  <img src={fav.thumbnail} alt="" className="w-full aspect-square object-cover rounded-md shadow-lg" />
                  <button className="absolute bottom-2 right-2 w-12 h-12 bg-[var(--green)] rounded-full flex items-center justify-center
                    shadow-lg shadow-black/40 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      db.favorites.toArray().then(favs => {
                        const tracks = favs.map(f => ({ id: f.trackId, title: f.title, artist: f.artist, thumbnail: f.thumbnail, streamUrl: null }));
                        setQueue(tracks);
                        setTrack(tracks.find(t => t.id === fav.trackId) || tracks[0]);
                      });
                    }}>
                    <svg viewBox="0 0 16 16" fill="black" width="20" height="20">
                      <path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/>
                    </svg>
                  </button>
                </div>
                <p className="text-sm font-bold text-white truncate">{fav.title}</p>
                <p className="text-xs text-[var(--text-dim)] truncate mt-1">{fav.artist}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Playlists */}
      {playlists.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white hover:underline cursor-pointer"
              onClick={() => navigate('/library')}>Deine Playlists</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {playlists.map((pl) => (
              <div key={pl.id}
                className="bg-[#181818] p-4 rounded-lg hover:bg-[#282828] cursor-pointer transition-all group relative"
                onClick={() => navigate(`/playlist/${pl.id}`)}>
                <div className="relative mb-4">
                  <div className="w-full aspect-square object-cover rounded-md shadow-lg bg-[#282828] flex items-center justify-center">
                    <svg viewBox="0 0 16 16" fill="currentColor" width="48" height="48" className="text-[var(--text-dim)]">
                      <path d="M15.25 8a.75.75 0 0 1-.75.75H8.75v5.75a.75.75 0 0 1-1.5 0V8.75H1.5a.75.75 0 0 1 0-1.5h5.75V1.5a.75.75 0 0 1 1.5 0v5.75h5.75a.75.75 0 0 1 .75.75z"/>
                    </svg>
                  </div>
                  <button className="absolute bottom-2 right-2 w-12 h-12 bg-[var(--green)] rounded-full flex items-center justify-center
                    shadow-lg shadow-black/40 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <svg viewBox="0 0 16 16" fill="black" width="20" height="20">
                      <path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/>
                    </svg>
                  </button>
                </div>
                <p className="text-sm font-bold text-white truncate">{pl.name}</p>
                <p className="text-xs text-[var(--text-dim)] truncate mt-1">Playlist</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {favorites.length === 0 && playlists.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-20 h-20 rounded-full bg-[#282828] flex items-center justify-center">
            <svg viewBox="0 0 16 16" fill="currentColor" width="32" height="32" className="text-white">
              <path d="M15.724 4.22A4.313 4.313 0 0 0 12.192.814a4.269 4.269 0 0 0-3.622 1.13.837.837 0 0 1-1.14 0 4.272 4.272 0 0 0-6.38 5.57l5.593 7.434a1.12 1.12 0 0 0 1.79-.003l5.597-7.44a4.29 4.29 0 0 0 1.494-3.295z"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Songs hier ablegen</h2>
          <p className="text-sm text-[var(--text-dim)]">Songs und Podcasts, die dir gefallen, findest du hier.</p>
          <button onClick={() => navigate('/search')}
            className="mt-2 px-8 py-3 bg-white rounded-full text-sm font-bold text-black hover:scale-105 transition-transform">
            Songs suchen
          </button>
        </div>
      )}
    </div>
  );
}
