import { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, Loader2, User, X, Clock, Trash2, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TrackList from '../components/TrackList';
import { searchSongs, searchArtists } from '../lib/api';

const CATEGORIES = [
  { label: 'Pop', query: 'pop hits best songs', color: '#E13300' },
  { label: 'Hip-Hop', query: 'hip hop rap best songs', color: '#BA5D07' },
  { label: 'Rock', query: 'rock best songs all time', color: '#E91429' },
  { label: 'Electronic', query: 'electronic dance music best', color: '#1E3264' },
  { label: 'R&B', query: 'r&b soul best songs', color: '#DC148C' },
  { label: 'Deutschrap', query: 'deutschrap beste songs', color: '#503750' },
  { label: 'Schlager', query: 'schlager beste hits', color: '#477D95' },
  { label: 'Klassik', query: 'classical music best pieces', color: '#1E3264' },
  { label: 'Jazz', query: 'jazz classics best', color: '#503750' },
  { label: 'Metal', query: 'metal best songs all time', color: '#E91429' },
  { label: 'Indie', query: 'indie best songs', color: '#1E90FF' },
  { label: 'Lofi', query: 'lofi hip hop beats', color: '#006450' },
];

const HISTORY_KEY = 'spotify_search_history';

export default function Search() {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [history, setHistory] = useState([]);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (term) => {
    const updated = [term, ...history.filter(h => h !== term)].slice(0, 15);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const clearHistory = () => { setHistory([]); localStorage.removeItem(HISTORY_KEY); };
  const removeFromHistory = (term) => {
    const updated = history.filter(h => h !== term);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const search = async (q) => {
    const searchTerm = q || query;
    if (!searchTerm.trim()) return;
    setQuery(searchTerm);
    setFocused(false);
    setLoading(true);
    setSearched(true);
    saveToHistory(searchTerm);
    try {
      const [tracksData, artistsData] = await Promise.all([
        searchSongs(searchTerm, 25),
        searchArtists(searchTerm, 6),
      ]);
      setTracks(tracksData);
      setArtists(artistsData);
    } catch { setTracks([]); setArtists([]); }
    setLoading(false);
  };

  const resetSearch = () => { setSearched(false); setTracks([]); setArtists([]); setQuery(''); inputRef.current?.focus(); };

  return (
    <div className="pb-28 md:pb-6">
      {/* Search Bar */}
      <div className="sticky top-0 z-30 bg-[#121212]/80 backdrop-blur-xl pt-1 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => searched ? resetSearch() : navigate(-1)}
            className="md:hidden w-10 h-10 flex items-center justify-center shrink-0">
            <ChevronLeft size={24} className="text-white" />
          </button>
          <div className="flex-1 relative">
            <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/50" />
            <input ref={inputRef} type="text" value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 200)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="Was möchtest du wiedergeben?"
              className="w-full bg-white rounded-full pl-12 pr-12 py-3 text-sm text-black font-medium
                         placeholder-black/50 outline-none focus:ring-2 focus:ring-white/30" />
            {query && (
              <button onClick={() => { setQuery(''); if (searched) resetSearch(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-black/50 hover:text-black transition-colors">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* No Search: History + Categories */}
      {!searched && !loading && (
        <div className="space-y-8">
          {history.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold text-white">Letzte Suchen</h2>
                <button onClick={clearHistory}
                  className="text-sm font-bold text-[var(--text-dim)] hover:text-white transition-colors hover:underline">
                  Alles löschen
                </button>
              </div>
              <div className="space-y-0.5">
                {history.map((term) => (
                  <div key={term}
                    className="flex items-center gap-4 px-3 py-2.5 rounded-md hover:bg-[#1a1a1a] cursor-pointer group transition-colors"
                    onClick={() => search(term)}>
                    <div className="w-12 h-12 rounded-md bg-[#282828] flex items-center justify-center shrink-0 group-hover:bg-[#3e3e3e] transition-colors">
                      <Clock size={18} className="text-[var(--text-dim)]" />
                    </div>
                    <span className="text-sm font-medium text-white flex-1 truncate">{term}</span>
                    <button onClick={(e) => { e.stopPropagation(); removeFromHistory(term); }}
                      className="text-[var(--text-dim)] hover:text-white opacity-0 group-hover:opacity-100 transition-all p-2 rounded-full hover:bg-[#282828]">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {history.length === 0 && (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold text-white mb-2">Songs suchen</h2>
              <p className="text-sm text-[var(--text-dim)]">Finde deine Lieblingssongs</p>
            </div>
          )}

          {/* Categories */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Alle durchstöbern</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {CATEGORIES.map((cat) => (
                <div key={cat.label} onClick={() => search(cat.query)}
                  className="relative aspect-[1.2] rounded-lg overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
                  style={{ background: `linear-gradient(135deg, ${cat.color}, ${cat.color}cc)` }}>
                  <span className="absolute top-4 left-4 text-xl font-bold text-white z-10">{cat.label}</span>
                  <div className="absolute bottom-0 right-0 w-24 h-24 sm:w-32 sm:h-32 rounded-tl-xl bg-black/20 rotate-25 transform translate-x-4 translate-y-4 shadow-xl" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={32} className="animate-spin text-white" />
        </div>
      )}

      {/* No Results */}
      {!loading && searched && tracks.length === 0 && artists.length === 0 && (
        <div className="text-center py-20">
          <p className="text-xl font-bold text-white mb-2">Nichts gefunden für „{query}"</p>
          <p className="text-sm text-[var(--text-dim)]">Überprüfe die Schreibweise oder versuch einen anderen Suchbegriff.</p>
        </div>
      )}

      {/* Artists */}
      {!loading && artists.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Künstler</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {artists.map((artist) => (
              <div key={artist.id} onClick={() => navigate(`/artist/${artist.id}`)}
                className="bg-[#181818] p-4 rounded-lg cursor-pointer hover:bg-[#282828] transition-colors group">
                <div className="aspect-square rounded-full overflow-hidden mb-4 shadow-lg shadow-black/40">
                  {artist.thumbnail ? (
                    <img src={artist.thumbnail} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full bg-[#282828] flex items-center justify-center">
                      <User size={40} className="text-[var(--text-dim)]" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-bold text-white truncate text-center">{artist.name}</p>
                <p className="text-xs text-[var(--text-dim)] text-center mt-1">Künstler</p>
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
