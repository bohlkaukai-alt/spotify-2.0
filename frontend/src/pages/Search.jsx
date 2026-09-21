import { useState } from 'react';
import { Search as SearchIcon, Loader2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TrackList from '../components/TrackList';

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

export default function Search() {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const search = async (q) => {
    const searchTerm = q || query;
    if (!searchTerm.trim()) return;
    setQuery(searchTerm);
    setLoading(true);
    setSearched(true);
    try {
      const [tracksRes, artistsRes] = await Promise.all([
        fetch(`/api/search?q=${encodeURIComponent(searchTerm)}&limit=25`),
        fetch(`/api/search-artists?q=${encodeURIComponent(searchTerm)}&limit=6`),
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
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Songs, Künstler, Alben suchen..."
            className="w-full bg-spotify-lighter rounded-full pl-12 pr-6 py-3 text-white
                       placeholder-spotify-text outline-none focus:ring-2 focus:ring-spotify-green text-base transition-shadow" />
        </div>
        <button onClick={() => search()} disabled={loading}
          className="px-8 py-3 bg-spotify-green rounded-full font-semibold text-black hover:scale-105 transition-transform disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin" size={20} /> : 'Suchen'}
        </button>
      </div>

      {/* Categories - shown when not searched */}
      {!searched && !loading && (
        <>
          <h2 className="text-2xl font-bold mb-4">Alle durchstöbern</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {CATEGORIES.map((cat) => (
              <div key={cat.label} onClick={() => search(cat.query)}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
                style={{ background: cat.color }}>
                <span className="absolute top-4 left-4 text-xl font-bold">{cat.label}</span>
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-black/20 rotate-25 transform translate-x-4 translate-y-2 rounded" />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* No results */}
      {!loading && searched && tracks.length === 0 && artists.length === 0 && (
        <div className="text-center py-20 text-spotify-text">
          <p className="text-xl font-semibold mb-2">Keine Ergebnisse</p>
          <p>Probiere einen anderen Suchbegriff</p>
        </div>
      )}

      {/* Artists */}
      {!loading && artists.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Künstler</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {artists.map((artist) => (
              <div key={artist.id} onClick={() => navigate(`/artist/${artist.id}`)}
                className="bg-spotify-lighter p-4 rounded-lg cursor-pointer hover:bg-spotify-hover transition-colors group">
                <div className="aspect-square rounded-full overflow-hidden mb-3 shadow-lg">
                  {artist.thumbnail ? (
                    <img src={artist.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
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
      {!loading && tracks.length > 0 && <TrackList tracks={tracks} title="Songs" />}
    </div>
  );
}
