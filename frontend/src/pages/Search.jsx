import { useState } from 'react';
import { Search as SearchIcon, Loader2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TrackList from '../components/TrackList';
import { searchSongs, searchArtists } from '../lib/api';

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
      const [tracksData, artistsData] = await Promise.all([
        searchSongs(searchTerm, 25),
        searchArtists(searchTerm, 6),
      ]);
      setTracks(tracksData);
      setArtists(artistsData);
    } catch (err) {
      setTracks([]);
      setArtists([]);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="flex-1 relative">
          <SearchIcon size={18} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-spotify-text" />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Songs, Künstler suchen..."
            className="w-full bg-spotify-lighter rounded-full pl-10 sm:pl-12 pr-4 sm:pr-6 py-2.5 sm:py-3 text-white
                       placeholder-spotify-text outline-none focus:ring-2 focus:ring-spotify-green text-sm sm:text-base" />
        </div>
        <button onClick={() => search()} disabled={loading}
          className="px-4 sm:px-8 py-2.5 sm:py-3 bg-spotify-green rounded-full font-semibold text-black hover:scale-105 disabled:opacity-50 text-sm sm:text-base">
          {loading ? <Loader2 className="animate-spin" size={20} /> : 'Suchen'}
        </button>
      </div>

      {!searched && !loading && (
        <>
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Alle durchstöbern</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {CATEGORIES.map((cat) => (
              <div key={cat.label} onClick={() => search(cat.query)}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
                style={{ background: cat.color }}>
                <span className="absolute top-3 left-3 sm:top-4 sm:left-4 text-base sm:text-xl font-bold">{cat.label}</span>
                <div className="absolute bottom-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-black/20 rotate-25 transform translate-x-2 translate-y-2 sm:translate-x-4 sm:translate-y-2 rounded" />
              </div>
            ))}
          </div>
        </>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && searched && tracks.length === 0 && artists.length === 0 && (
        <div className="text-center py-20 text-spotify-text">
          <p className="text-xl font-semibold mb-2">Keine Ergebnisse</p>
        </div>
      )}

      {!loading && artists.length > 0 && (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Künstler</h2>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {artists.map((artist) => (
              <div key={artist.id} onClick={() => navigate(`/artist/${artist.id}`)}
                className="bg-spotify-lighter p-3 sm:p-4 rounded-lg cursor-pointer hover:bg-spotify-hover transition-colors group">
                <div className="aspect-square rounded-full overflow-hidden mb-2 sm:mb-3 shadow-lg">
                  {artist.thumbnail ? (
                    <img src={artist.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
                  ) : (
                    <div className="w-full h-full bg-spotify-dark flex items-center justify-center"><User size={32} className="text-spotify-text" /></div>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-medium truncate text-center">{artist.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && tracks.length > 0 && <TrackList tracks={tracks} title="Songs" />}
    </div>
  );
}
