import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Play, Pause, Shuffle, Trash2, Clock, Search, List } from 'lucide-react';
import usePlayerStore from '../store/playerStore';
import TrackList from '../components/TrackList';
import db from '../lib/db';

export default function Playlist() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [totalDuration, setTotalDuration] = useState(0);
  const { currentTrack, isPlaying, setTrack, setQueue, togglePlay } = usePlayerStore();

  useEffect(() => { loadPlaylist(); }, [id]);

  const loadPlaylist = async () => {
    const pl = await db.playlists.get(parseInt(id));
    setPlaylist(pl);
    const pts = await db.playlistTracks.where('playlistId').equals(parseInt(id)).toArray();
    setTracks(pts);
    setTotalDuration(pts.reduce((acc, t) => acc + (t.duration || 0), 0));
  };

  const handlePlay = () => {
    if (tracks.length === 0) return;
    if (currentTrack && tracks.some(t => t.id === currentTrack.id)) {
      togglePlay();
    } else {
      setQueue(tracks);
      setTrack(tracks[0]);
    }
  };

  const handleRemoveTrack = async (track) => {
    const existing = await db.playlistTracks.where({ playlistId: parseInt(id), trackId: track.id }).first();
    if (existing) await db.playlistTracks.delete(existing.id);
    loadPlaylist();
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h} Std. ${m} Min.`;
    return `${m} Min.`;
  };

  if (!playlist) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-[var(--text-dim)]">Playlist wird geladen...</p>
    </div>
  );

  return (
    <div className="pb-28 md:pb-6">
      {/* Header */}
      <div className="relative -mx-4 md:-mx-6 -mt-4 md:-mt-4 mb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-[#5038a0] to-[#121212]" />
        <div className="relative flex items-end gap-6 px-6 pt-12 pb-6">
          <div className="w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-lg bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex items-center justify-center shrink-0 shadow-2xl">
            <svg viewBox="0 0 16 16" fill="currentColor" width="56" height="56" className="text-white">
              <path d="M15.724 4.22A4.313 4.313 0 0 0 12.192.814a4.269 4.269 0 0 0-3.622 1.13.837.837 0 0 1-1.14 0 4.272 4.272 0 0 0-6.38 5.57l5.593 7.434a1.12 1.12 0 0 0 1.79-.003l5.597-7.44a4.29 4.29 0 0 0 1.494-3.295z"/>
            </svg>
          </div>
          <div className="min-w-0 pb-2">
            <p className="text-xs font-bold text-white uppercase tracking-widest mb-1">Playlist</p>
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-white truncate">{playlist.name}</h1>
            <p className="text-sm text-white/70 mt-2">{tracks.length} Songs{totalDuration > 0 ? `, ${formatDuration(totalDuration)}` : ''}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 px-2 mb-6">
        <button onClick={handlePlay}
          className="w-14 h-14 bg-[var(--green)] rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg">
          {isPlaying && tracks.some(t => t.id === currentTrack?.id)
            ? <Pause size={24} className="text-black" fill="black" />
            : <Play size={24} className="text-black ml-1" fill="black" />}
        </button>
        <button onClick={() => {
          if (tracks.length > 0) {
            setQueue([...tracks].sort(() => Math.random() - 0.5));
            setTrack(tracks[0]);
          }
        }}
          className="text-[var(--text-dim)] hover:text-white transition-colors">
          <Shuffle size={22} />
        </button>
      </div>

      {/* Track List */}
      {tracks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg font-bold text-white mb-1">Songs zu dieser Playlist hinzufügen</p>
          <p className="text-sm text-[var(--text-dim)]">Klicke auf „...", um Songs zu dieser Playlist hinzuzufügen.</p>
        </div>
      ) : (
        <TrackList tracks={tracks} playlistId={parseInt(id)} onRemoveTrack={handleRemoveTrack} />
      )}
    </div>
  );
}
