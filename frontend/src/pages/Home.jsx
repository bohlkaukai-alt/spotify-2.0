import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import usePlayerStore from '../store/playerStore';

const CATEGORIES = [
  { label: 'Pop', query: 'pop hits 2024 best songs', color: '#E13300' },
  { label: 'Hip-Hop', query: 'hip hop rap best songs 2024', color: '#BA5D07' },
  { label: 'Rock', query: 'rock best songs all time', color: '#E91429' },
  { label: 'Electronic', query: 'electronic dance music best', color: '#1E3264' },
  { label: 'R&B', query: 'r&b soul best songs', color: '#DC148C' },
  { label: 'Deutschrap', query: 'deutschrap beste songs', color: '#503750' },
  { label: 'Schlager', query: 'schlager beste hits', color: '#477D95' },
  { label: 'Klassik', query: 'classical music best pieces', color: '#1E3264' },
  { label: 'Jazz', query: 'jazz classics best', color: '#503750' },
  { label: 'Metal', query: 'metal best songs all time', color: '#E91429' },
  { label: 'Indie', query: 'indie best songs 2024', color: '#1E90FF' },
  { label: 'Lofi', query: 'lofi hip hop beats', color: '#006450' },
];

export default function Home() {
  const [recentTracks, setRecentTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setTrack, setQueue } = usePlayerStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadRecent();
  }, []);

  const loadRecent = async () => {
    try {
      const res = await fetch('/api/search?q=best+music+hits+2024&limit=12');
      const data = await res.json();
      setRecentTracks(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const playTrack = (track) => {
    setQueue(recentTracks);
    setTrack(track);
  };

  const searchCategory = (query) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  // Get greeting based on time
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Guten Morgen';
    if (h < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">{getGreeting()}</h1>

      {/* Quick Play Grid */}
      {recentTracks.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-8">
          {recentTracks.slice(0, 6).map((track) => (
            <div
              key={track.id}
              className="flex items-center bg-[#ffffff10] hover:bg-[#ffffff20] rounded-md
                         overflow-hidden cursor-pointer group transition-colors"
              onDoubleClick={() => playTrack(track)}
            >
              <img src={track.thumbnail} className="w-12 h-12 shrink-0" alt="" />
              <span className="px-3 text-sm font-medium truncate flex-1">{track.title}</span>
              <button
                className="w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center
                           mr-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg
                           hover:scale-105 shrink-0"
                onClick={() => playTrack(track)}
              >
                <Play size={16} fill="black" className="text-black ml-0.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Category Cards */}
      <h2 className="text-2xl font-bold mb-4">Alle durchstöbern</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.label}
            onClick={() => searchCategory(cat.query)}
            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer
                       hover:scale-[1.02] transition-transform"
            style={{ background: cat.color }}
          >
            <span className="absolute top-4 left-4 text-xl font-bold">{cat.label}</span>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-black/20 rotate-25 transform translate-x-4 translate-y-2 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
