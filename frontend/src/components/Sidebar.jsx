import { Home, Search, Library, Plus, User } from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import db from '../lib/db';
import { useAuth } from '../lib/auth';

export default function Sidebar({ onNavigate }) {
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

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/search', icon: Search, label: 'Suche' },
    { to: '/library', icon: Library, label: 'Bibliothek' },
  ];

  const handleClick = (to) => {
    navigate(to);
    if (onNavigate) onNavigate();
  };

  return (
    <div className="w-64 bg-[#0a0a0a] sm:bg-[#0d0d0d] flex flex-col p-2 gap-1 h-full shrink-0 border-r border-[#141414]">
      <div className="px-4 py-3 hidden sm:block">
        <span className="text-xl font-bold tracking-tight text-white">♫ Spotify 2.0</span>
      </div>

      <nav className="flex flex-col gap-0.5">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <button key={to} onClick={() => handleClick(to)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left
                ${active ? 'bg-[#1a1a1a] text-white' : 'text-[var(--text-dim)] hover:text-white hover:bg-[#141414]'}`}>
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />{label}
            </button>
          );
        })}
        <button onClick={() => handleClick('/auth')}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left
            ${location.pathname === '/auth' ? 'bg-[#1a1a1a] text-white' : 'text-[var(--text-dim)] hover:text-white hover:bg-[#141414]'}`}>
          <div className="w-5 h-5 rounded-full bg-[var(--green)] flex items-center justify-center text-black text-[10px] font-bold">
            {user ? user.email?.[0]?.toUpperCase() || '?' : <User size={12} />}
          </div>
          {user ? 'Konto' : 'Anmelden'}
        </button>
      </nav>

      <div className="mt-6 flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center justify-between px-4 mb-3">
          <span className="text-[var(--text-dim)] text-[11px] font-semibold uppercase tracking-wider">Playlists</span>
          <button onClick={createPlaylist}
            className="w-7 h-7 flex items-center justify-center text-[var(--text-dim)] hover:text-white hover:bg-[#1a1a1a] rounded-md transition-all">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-1">
          {playlists.length === 0 ? (
            <p className="text-[var(--text-dim)] text-xs px-3 py-2">Noch keine Playlists</p>
          ) : (
            playlists.map((pl) => {
              const active = location.pathname === `/playlist/${pl.id}`;
              return (
                <button key={pl.id} onClick={() => handleClick(`/playlist/${pl.id}`)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-all duration-200
                    ${active ? 'bg-[#1a1a1a] text-white' : 'text-[var(--text-dim)] hover:text-white hover:bg-[#141414]'}`}>
                  {pl.name}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
