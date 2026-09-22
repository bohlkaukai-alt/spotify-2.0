import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Home, Search, Library, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from './Sidebar';
import Player from './Player';

export default function Layout({ onFullscreen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [canBack, setCanBack] = useState(false);
  const [canForward, setCanForward] = useState(false);

  useEffect(() => {
    setCanBack(window.history.length > 1);
  }, [location.pathname]);

  const navItems = [
    { to: '/', icon: Home, label: 'Startseite' },
    { to: '/search', icon: Search, label: 'Suchen' },
    { to: '/library', icon: Library, label: 'Bibliothek' },
  ];

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden">
      {/* === DESKTOP === */}
      <div className="hidden md:flex flex-1 gap-2 p-2 pb-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 bg-[#121212] rounded-lg overflow-y-auto"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsla(0,0%,100%,.3) transparent' }}>
          <div className="sticky top-0 z-30 flex items-center gap-4 px-6 py-4 bg-[#121212]/90 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(-1)}
                className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors disabled:opacity-40"
                disabled={!canBack}>
                <ChevronLeft size={18} className="text-white" />
              </button>
              <button onClick={() => navigate(1)}
                className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors disabled:opacity-40"
                disabled={!canForward}>
                <ChevronRight size={18} className="text-white" />
              </button>
            </div>
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/50" />
                <input type="text" placeholder="Was möchtest du wiedergeben?"
                  className="w-full bg-white rounded-full pl-10 pr-4 py-2.5 text-sm text-black font-medium placeholder-black/50 outline-none focus:ring-2 focus:ring-white/30"
                  onFocus={() => navigate('/search')} />
              </div>
            </div>
          </div>
          <div className="px-6 pb-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* === MOBILE === */}
      <div className="md:hidden flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-[#121212] shrink-0">
          <span className="text-lg font-bold text-white">♫ Spotify 2.0</span>
          <button onClick={() => navigate('/search')}
            className="w-8 h-8 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
              <path d="M10.533 1.27893C5.35215 1.27893 1.12598 5.41887 1.12598 10.5579C1.12598 15.697 5.35215 19.8369 10.533 19.8369C12.767 19.8369 14.8235 19.0671 16.4402 17.7794L20.7929 22.132C21.1834 22.5226 21.8166 22.5226 22.2071 22.132C22.5976 21.7415 22.5976 21.1083 22.2071 20.7178L17.8634 16.3741C19.1616 14.7849 19.94 12.7634 19.94 10.5579C19.94 5.41887 15.7138 1.27893 10.533 1.27893ZM3.12598 10.5579C3.12598 6.55226 6.42768 3.27893 10.533 3.27893C14.6383 3.27893 17.94 6.55226 17.94 10.5579C17.94 14.5636 14.6383 17.8369 10.533 17.8369C6.42768 17.8369 3.12598 14.5636 3.12598 10.5579Z" />
            </svg>
          </button>
        </div>

        <main className="flex-1 overflow-y-auto bg-[#121212]"
          style={{ paddingBottom: '130px' }}>
          <Outlet />
        </main>
      </div>

      {/* SINGLE Player — renders both mobile mini + desktop bar */}
      <Player onFullscreen={onFullscreen} />

      {/* Mobile Bottom Nav — only on mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-white/5 flex items-center justify-around py-2 z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <button key={to} onClick={() => navigate(to)}
              className="flex flex-col items-center gap-0.5 px-4 py-1">
              <Icon size={22} strokeWidth={active ? 2.5 : 1.5}
                className={active ? 'text-white' : 'text-[var(--text-dim)]'} />
              <span className={`text-[10px] font-medium ${active ? 'text-white' : 'text-[var(--text-dim)]'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
