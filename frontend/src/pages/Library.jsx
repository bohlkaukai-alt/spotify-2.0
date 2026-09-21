import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import db from '../lib/db';
import TrackList from '../components/TrackList';

export default function Library() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-500
                        rounded flex items-center justify-center">
          <Heart size={32} fill="white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Deine Favoriten</h1>
          <p className="text-spotify-text">{favorites.length} Songs</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20 text-spotify-text">
          <Heart size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-xl font-semibold mb-2">Noch keine Favoriten</p>
          <p>Herz-Klicke auf Songs, um sie hier zu speichern</p>
        </div>
      ) : (
        <TrackList tracks={favorites} />
      )}
    </div>
  );
}
