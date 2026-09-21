import { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, Loader2, User, X, Clock, Trash2 } from 'lucide-react';
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

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

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
    } catch (err) {
      setTracks([]);
      setArtists([]);
    }
    setLoading(false);
  };

  const resetSearch = () => {
    setSearched(false);
    setTracks([]);
    setArtists([]);
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="p-4 sm:p-6 pb-28">
      {/* Search Bar */}
      <div className="relative mb-6 animate-fadeUp">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
            <input ref={inputRef} type="text" value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { setFocused(true); }}
              onBlur={() => setTimeout(() => setFocused(false), 200)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="Songs, Künstler suchen..."
              className="w-full bg-[#1a1a1a] rounded-full pl-12 pr-10 py-3.5 text-white
                         placeholder-[var(--text-dim)] outline-none text-sm
                         border border-transparent focus:border-[var(--green)] focus:bg-[#1f1f1f]
                         transition-all duration-300 search-glow" />
            {query && (
              <button onClick={() => { setQuery(''); if (searched) resetSearch(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-white transition-colors">
                <X size={16} />
              </button>
            )}
          </div>
          <button onClick={() => search()} disabled={loading}
            className="px-6 py-3.5 bg-[var(--green)] rounded-full font-semibold text-black text-sm
                       hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-[#1ed760]/20">
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Suchen'}
          </button>
        </div>
      </div>

      {/* ===== NO SEARCH: History + Categories ===== */}
      {!searched && !loading && (
        <div className="space-y-8">

          {/* Search History - PROMINENT */}
          {history.length > 0 && (
            <div className="animate-fadeUp" style={{ animationDelay: '0.05s' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-[var(--green)]" />
                  <h2 className="text-base font-bold">Letzte Suchen</h2>
                </div>
                <button onClick={clearHistory}
                  className="flex items-center gap-1.5 text-[var(--text-dim)] hover:text-white text-xs font-medium transition-colors px-2 py-1 rounded-lg hover:bg-[#1a1a1a]">
                  <Trash2 size={12} />
                  Alles löschen
                </button>
              </div>
              <div className="space-y-1">
                {history.map((term, i) => (
                  <div key={term}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#1a1a1a] cursor-pointer group transition-all duration-200 active:scale-[0.98]"
                    style={{ animationDelay: `${i * 0.03}s` }}
                    onClick={() => search(term)}>
                    <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] flex items-center justify-center shrink-0 group-hover:bg-[var(--green)] transition-colors duration-200">
                      <Clock size={16} className="text-[var(--text-dim)] group-hover:text-black transition-colors duration-200" />
                    </div>
                    <span className="text-sm text-white flex-1 truncate">{term}</span>
                    <button onClick={(e) => { e.stopPropagation(); removeFromHistory(term); }}
                      className="text-[var(--text-dim)] hover:text-white opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-full hover:bg-[#282828]">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State: No history yet */}
          {history.length === 0 && (
            <div className="text-center py-12 animate-fadeUp">
              <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mx-auto mb-4">
                <SearchIcon size={24} className="text-[var(--text-dim)]" />
              </div>
              <p className="text-sm text-[var(--text-dim)]">Such nach deinen Lieblingssongs</p>
            </div>
          )}

          {/* Categories */}
          <div className="animate-fadeUp" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-base font-bold mb-3">Kategorien durchstöbern</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 stagger">
              {CATEGORIES.map((cat) => (
                <div key={cat.label} onClick={() => search(cat.query)}
                  className="relative aspect-[1.4] rounded-xl overflow-hidden cursor-pointer card-hover group"
                  style={{ background: `linear-gradient(135deg, ${cat.color}, ${cat.color}dd)` }}>
                  <span className="absolute top-3 left-4 text-sm font-bold z-10">{cat.label}</span>
                  <div className="absolute bottom-0 right-0 w-20 h-20 sm:w-28 sm:h-28 rounded-tl-xl bg-black/20 rotate-25 transform translate-x-3 translate-y-3" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fadeIn">
          <div className="w-10 h-10 border-2 border-[var(--green)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--text-dim)]">Suche läuft...</p>
        </div>
      )}

      {/* No Results */}
      {!loading && searched && tracks.length === 0 && artists.length === 0 && (
        <div className="text-center py-20 animate-fadeUp">
          <p className="text-xl font-semibold mb-2">Keine Ergebnisse</p>
          <p className="text-sm text-[var(--text-dim)]">Versuch einen anderen Suchbegriff</p>
        </div>
      )}

      {/* Artists */}
      {!loading && artists.length > 0 && (
        <div className="mb-6 animate-fadeUp" style={{ animationDelay: '0.05s' }}>
          <h2 className="text-xl font-bold mb-4">Künstler</h2>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 stagger">
            {artists.map((artist) => (
              <div key={artist.id} onClick={() => navigate(`/artist/${artist.id}`)}
                className="bg-[#141414] p-4 rounded-xl cursor-pointer card-hover group">
                <div className="aspect-square rounded-full overflow-hidden mb-3 shadow-lg">
                  {artist.thumbnail ? (
                    <img src={artist.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                  ) : (
                    <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
                      <User size={32} className="text-[var(--text-dim)]" />
                    </div>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-medium truncate text-center">{artist.name}</p>
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
