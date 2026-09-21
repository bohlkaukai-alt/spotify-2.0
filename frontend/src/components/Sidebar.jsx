import { Home, Search, Library, Plus } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import db from '../lib/db';

export default function Sidebar({ onNavigate }) {
  const [playlists, setPlaylists] = useState([]);
  const navigate = useNavigate();

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
    <div className="w-64 bg-spotify-black flex flex-col p-2 gap-2 h-full shrink-0">
      <div className="px-4 py-3 hidden sm:block">
        <span className="text-xl font-bold tracking-tight text-white">♫ Spotify 2.0</span>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <button key={to} onClick={() => handleClick(to)}
            className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors text-left
              ${location.pathname === to ? 'bg-spotify-lighter text-white' : 'text-spotify-text hover:text-white'}`}>
            <Icon size={22} />{label}
          </button>
        ))}
      </nav>

      <div className="mt-4 flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center justify-between px-4 mb-2">
          <span className="text-spotify-text text-xs font-semibold uppercase tracking-wider">Playlists</span>
          <button onClick={createPlaylist} className="text-spotify-text hover:text-white"><Plus size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          {playlists.length === 0 ? (
            <p className="text-spotify-text text-sm px-2">Noch keine Playlists</p>
          ) : (
            playlists.map((pl) => (
              <button key={pl.id} onClick={() => handleClick(`/playlist/${pl.id}`)}
                className="w-full text-left px-2 py-1.5 text-sm text-spotify-text hover:text-white rounded truncate">
                {pl.name}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
