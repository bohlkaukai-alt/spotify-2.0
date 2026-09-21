import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import usePlayerStore from '../store/playerStore';
import db from '../lib/db';

export default function Home() {
  const { setTrack, setQueue } = usePlayerStore();
  const navigate = useNavigate();
  const [recentTracks, setRecentTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('Guten Morgen');
    else if (h < 18) setGreeting('Guten Tag');
    else setGreeting('Guten Abend');
    loadData();
  }, []);

  const loadData = async () => {
    const favs = await db.favorites.orderBy('addedAt').reverse().limit(10).toArray();
    const tracks = favs.map(f => ({
      id: f.trackId, title: f.title, artist: f.artist, thumbnail: f.thumbnail, artistId: '', album: '', duration: 0,
    }));
    setRecentTracks(tracks);
    const pls = await db.playlists.toArray();
    setPlaylists(pls);
  };

  const playTrack = (track) => {
    setQueue(recentTracks);
    setTrack(track);
    if (window.__ytPlay) window.__ytPlay(track.id);
  };

  return (
    <div className="p-4 sm:p-6 pb-28">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 animate-fadeUp">{greeting}</h1>

      {/* Recent Tracks */}
      {recentTracks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 animate-fadeUp" style={{ animationDelay: '0.05s' }}>Zuletzt geliked</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 stagger">
            {recentTracks.slice(0, 10).map((track) => (
              <div key={track.id}
                onClick={() => playTrack(track)}
                className="bg-[#141414] rounded-xl p-3 cursor-pointer card-hover group animate-fadeUp flex items-center gap-3">
                <img src={track.thumbnail} className="w-12 h-12 rounded-lg object-cover shadow-lg shrink-0 group-hover:shadow-xl transition-shadow" alt="" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-[var(--green)] transition-colors">{track.title}</p>
                  <p className="text-xs text-[var(--text-dim)] truncate">{track.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Playlists */}
      {playlists.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 animate-fadeUp" style={{ animationDelay: '0.1s' }}>Playlists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 stagger">
            {playlists.map((pl) => (
              <div key={pl.id}
                onClick={() => navigate(`/playlist/${pl.id}`)}
                className="bg-[#141414] rounded-xl p-4 cursor-pointer card-hover group text-center">
                <div className="aspect-square rounded-lg bg-[#1a1a1a] flex items-center justify-center mb-3 text-3xl group-hover:text-[var(--green)] transition-colors">
                  ♫
                </div>
                <p className="text-sm font-semibold truncate">{pl.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentTracks.length === 0 && playlists.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-center animate-fadeUp">
          <div className="text-6xl mb-6 opacity-20">♫</div>
          <p className="text-lg font-semibold mb-2">Willkommen bei Spotify 2.0</p>
          <p className="text-sm text-[var(--text-dim)] max-w-xs">Suche nach Songs und starte das Abenteuer. Deine Favoriten erscheinen hier.</p>
        </div>
      )}
    </div>
  );
}
