import { useState } from 'react';
import { Search as SearchIcon, Loader2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TrackList from '../components/TrackList';

export default function Search() {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const [tracksRes, artistsRes] = await Promise.all([
        fetch(`/api/search?q=${encodeURIComponent(query)}&limit=25`),
        fetch(`/api/search-artists?q=${encodeURIComponent(query)}&limit=6`),
      ]);
      if (tracksRes.ok) setTracks(await tracksRes.json());
      if (artistsRes.ok) setArtists(await artistsRes.json());
    } catch (err) {
      console.error('Suche fehlgeschlagen:', err);
      setTracks([]);
      setArtists([]);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      {/* Search Bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-spotify-text" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Songs, Künstler, Alben suchen..."
            className="w-full bg-spotify-lighter rounded-full pl-12 pr-6 py-3 text-white
                       placeholder-spotify-text outline-none focus:ring-2 focus:ring-spotify-green
                       text-base transition-shadow"
          />
        </div>
        <button
          onClick={search}
          disabled={loading}
          className="px-8 py-3 bg-spotify-green rounded-full font-semibold text-black
                     hover:scale-105 transition-transform disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : 'Suchen'}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* No results */}
      {!loading && searched && tracks.length === 0 && artists.length === 0 && (
        <div className="text-center py-20 text-spotify-text">
          <p className="text-xl font-semibold mb-2">Keine Ergebnisse gefunden</p>
          <p>Probiere einen anderen Suchbegriff</p>
        </div>
      )}

      {/* Artists row */}
      {!loading && artists.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Künstler</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {artists.map((artist) => (
              <div
                key={artist.id}
                onClick={() => navigate(`/artist/${artist.id}`)}
                className="bg-spotify-lighter p-4 rounded-lg cursor-pointer
                           hover:bg-spotify-hover transition-colors group"
              >
                <div className="aspect-square rounded-full overflow-hidden mb-3 shadow-lg">
                  {artist.thumbnail ? (
                    <img
                      src={artist.thumbnail}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      alt=""
                    />
                  ) : (
                    <div className="w-full h-full bg-spotify-dark flex items-center justify-center">
                      <User size={48} className="text-spotify-text" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium truncate text-center">{artist.name}</p>
                <p className="text-xs text-spotify-text text-center">Künstler</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tracks */}
      {!loading && tracks.length > 0 && (
        <TrackList tracks={tracks} title="Songs" />
      )}

      {/* Initial state */}
      {!searched && !loading && (
        <div className="text-center py-20 text-spotify-text">
          <SearchIcon size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">Tippe einen Song oder Künstler ein</p>
          <p className="text-sm mt-2">Und du kannst sofort alles anhören</p>
        </div>
      )}
    </div>
  );
}
