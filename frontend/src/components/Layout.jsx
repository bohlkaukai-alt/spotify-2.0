import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Player from './Player';

export default function Layout({ onFullscreen }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Mobile top bar */}
      <div className="sm:hidden flex items-center justify-between px-4 py-2 bg-spotify-black">
        <span className="text-lg font-bold">♫ Spotify 2.0</span>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-spotify-text text-2xl">&equiv;</button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="sm:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />
        )}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0
                         fixed sm:relative z-50 sm:z-auto h-full transition-transform duration-200`}>
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
        </div>
        <main className="flex-1 overflow-y-auto bg-spotify-dark rounded-lg m-0 sm:m-2 sm:ml-0">
          <Outlet />
        </main>
      </div>
      <Player onFullscreen={onFullscreen} />
    </div>
  );
}
