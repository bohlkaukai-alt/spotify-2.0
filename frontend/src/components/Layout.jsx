import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Player from './Player';

export default function Layout({ onFullscreen }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const [pageKey, setPageKey] = useState(0);

  useEffect(() => {
    setPageKey(k => k + 1);
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-full">
      {/* Mobile top bar */}
      <div className="sm:hidden flex items-center justify-between px-4 py-2.5 bg-[#0a0a0a] safe-top shrink-0 z-40">
        <span className="text-lg font-bold text-white">♫ Spotify 2.0</span>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-9 h-9 flex items-center justify-center text-white rounded-full hover:bg-[#1a1a1a] transition-colors">
          {sidebarOpen ? '✕' : '☰'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="sm:hidden fixed inset-0 z-40 bg-black/60 animate-fadeIn"
            onClick={() => setSidebarOpen(false)} />
        )}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0
                         fixed sm:relative z-50 sm:z-auto h-full transition-transform duration-300 ease-out`}>
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
        </div>
        <main className="flex-1 overflow-y-auto bg-[#0a0a0a] sm:rounded-lg sm:m-2 sm:ml-0"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div key={pageKey} className="animate-fadeIn">
            <Outlet />
          </div>
        </main>
      </div>
      <Player onFullscreen={onFullscreen} />
    </div>
  );
}
