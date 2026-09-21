import { useState, useEffect } from 'react';
import { Play, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import usePlayerStore from '../store/playerStore';
import db from '../lib/db';

export default function Home() {
  const [recentTracks, setRecentTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setTrack, setQueue } = usePlayerStore();
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [pl, favs] = await Promise.all([db.playlists.toArray(), db.favorites.orderBy('addedAt').reverse().limit(20).toArray()]);
      setPlaylists(pl);
      const tracks = favs.map((f) => ({ id: f.trackId, title: f.title, artist: f.artist, thumbnail: f.thumbnail }));
      setRecentTracks(tracks);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const playTrack = (track) => { setQueue(recentTracks); setTrack(track); if (window.__ytPlay) window.__ytPlay(track.id); };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Guten Morgen';
    if (h < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">{getGreeting()}</h1>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && recentTracks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-8">
          {recentTracks.slice(0, 6).map((track) => (
            <div key={track.id}
              className="flex items-center bg-[#ffffff10] hover:bg-[#ffffff20] rounded-md overflow-hidden cursor-pointer group transition-colors"
              onDoubleClick={() => playTrack(track)} onClick={() => playTrack(track)}>
              <img src={track.thumbnail} className="w-12 h-12 shrink-0" alt="" />
              <span className="px-3 text-sm font-medium truncate flex-1">{track.title}</span>
              <button className="w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center mr-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-105 shrink-0 sm:hidden">
                <Play size={16} fill="black" className="text-black ml-0.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && playlists.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Deine Playlists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {playlists.map((pl) => (
              <div key={pl.id} onClick={() => navigate(`/playlist/${pl.id}`)}
                className="bg-spotify-lighter p-3 sm:p-4 rounded-lg cursor-pointer hover:bg-spotify-hover transition-colors">
                <div className="aspect-square rounded bg-spotify-dark flex items-center justify-center mb-3">
                  <Music size={36} className="text-spotify-text" />
                </div>
                <p className="text-sm font-medium truncate">{pl.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && recentTracks.length === 0 && playlists.length === 0 && (
        <div className="text-center py-20 text-spotify-text">
          <Music size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-xl font-semibold mb-2">Noch nichts hier</p>
          <p>Like Songs oder erstelle Playlists</p>
        </div>
      )}
    </div>
  );
}
