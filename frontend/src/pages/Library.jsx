import { useState, useEffect } from 'react';
import { Heart, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import db from '../lib/db';
import TrackList from '../components/TrackList';

export default function Library() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const favs = await db.favorites.orderBy('addedAt').reverse().toArray();
    setFavorites(favs.map((f) => ({
      id: f.trackId,
      title: f.title,
      artist: f.artist,
      thumbnail: f.thumbnail,
    })));
    setLoading(false);
  };

  return (
    <div className="p-4 sm:p-6 pb-28">
      <div className="flex items-center gap-4 mb-6 animate-fadeUp">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[#1a1a1a] hover:bg-[#242424] transition-colors shrink-0">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div className="w-14 h-14 bg-gradient-to-br from-[#503750] to-[#DC148C] rounded-xl flex items-center justify-center shadow-lg shrink-0">
          <Heart size={24} fill="white" className="text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">Deine Favoriten</h1>
          <p className="text-sm text-[var(--text-dim)]">{favorites.length} Songs</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[var(--green)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-dim)] animate-fadeUp">
          <Heart size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-semibold mb-1 text-white">Noch keine Favoriten</p>
          <p className="text-sm">Herz-Klicke auf Songs, um sie hier zu speichern</p>
        </div>
      ) : (
        <TrackList tracks={favorites} />
      )}
    </div>
  );
}
