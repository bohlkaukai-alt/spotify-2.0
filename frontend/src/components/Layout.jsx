import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Player from './Player';

export default function Layout({ onFullscreen }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-spotify-dark rounded-lg m-2 ml-0">
          <Outlet />
        </main>
      </div>
      <Player onFullscreen={onFullscreen} />
    </div>
  );
}
