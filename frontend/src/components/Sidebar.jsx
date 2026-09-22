import { Home, Search, Library, Plus, Heart, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import db from '../lib/db';
import { useAuth } from '../lib/auth';

export default function Sidebar() {
  const [playlists, setPlaylists] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => { loadPlaylists(); }, []);
  const loadPlaylists = async () => { setPlaylists(await db.playlists.toArray()); };

  const createPlaylist = async () => {
    const name = prompt('Playlist-Name:');
    if (!name) return;
    await db.playlists.add({ name, createdAt: new Date() });
    loadPlaylists();
  };

  return (
    <div className="w-[300px] flex flex-col gap-2 shrink-0">
      <div className="bg-[#121212] rounded-lg px-3 py-2">
        <nav className="flex flex-col gap-0.5">
          <button onClick={() => navigate('/')}
            className={`flex items-center gap-4 px-3 py-2.5 rounded-md text-sm font-bold transition-colors
              ${location.pathname === '/' ? 'text-white' : 'text-[var(--text-dim)] hover:text-white'}`}>
            <Home size={24} />Startseite
          </button>
          <button onClick={() => navigate('/search')}
            className={`flex items-center gap-4 px-3 py-2.5 rounded-md text-sm font-bold transition-colors
              ${location.pathname === '/search' ? 'text-white' : 'text-[var(--text-dim)] hover:text-white'}`}>
            <Search size={24} />Suchen
          </button>
        </nav>
      </div>

      <div className="bg-[#121212] rounded-lg flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <button onClick={() => navigate('/library')}
            className={`flex items-center gap-3 text-sm font-bold transition-colors
              ${location.pathname === '/library' ? 'text-white' : 'text-[var(--text-dim)] hover:text-white'}`}>
            <Library size={24} />
            <span>Deine Bibliothek</span>
          </button>
          <button onClick={createPlaylist}
            className="w-8 h-8 flex items-center justify-center text-[var(--text-dim)] hover:text-white hover:bg-[#1a1a1a] rounded-full transition-all">
            <Plus size={18} />
          </button>
        </div>

        <button onClick={() => navigate('/library')}
          className="flex items-center gap-3 px-4 py-2 mx-2 rounded-md hover:bg-[#1a1a1a] transition-colors group">
          <div className="w-12 h-12 rounded-md bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex items-center justify-center shrink-0 shadow-md">
            <Heart size={16} className="text-white" fill="white" />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-sm font-medium text-white truncate">Lieblingssongs</p>
            <p className="text-xs text-[var(--text-dim)] truncate flex items-center gap-1">
              <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12" className="text-[#1ed760] shrink-0">
                <path d="M15.724 4.22A4.313 4.313 0 0 0 12.192.814a4.269 4.269 0 0 0-3.622 1.13.837.837 0 0 1-1.14 0 4.272 4.272 0 0 0-6.38 5.57l5.593 7.434a1.12 1.12 0 0 0 1.79-.003l5.597-7.44a4.29 4.29 0 0 0 1.494-3.295z"/>
              </svg>
              Playlist
            </p>
          </div>
        </button>

        <div className="flex-1 overflow-y-auto px-2 pb-2" style={{ scrollbarWidth: 'thin' }}>
          {playlists.map((pl) => (
            <button key={pl.id} onClick={() => navigate(`/playlist/${pl.id}`)}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-md transition-colors group
                ${location.pathname === `/playlist/${pl.id}` ? 'bg-[#1a1a1a]' : 'hover:bg-[#1a1a1a]'}`}>
              <div className="w-12 h-12 rounded-md bg-[#282828] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16" className="text-[var(--text-dim)]">
                  <path d="M15.25 8a.75.75 0 0 1-.75.75H8.75v5.75a.75.75 0 0 1-1.5 0V8.75H1.5a.75.75 0 0 1 0-1.5h5.75V1.5a.75.75 0 0 1 1.5 0v5.75h5.75a.75.75 0 0 1 .75.75z"/>
                </svg>
              </div>
              <div className="min-w-0 text-left">
                <p className="text-sm font-medium text-white truncate">{pl.name}</p>
                <p className="text-xs text-[var(--text-dim)] truncate">Playlist</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
