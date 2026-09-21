import { Play, Clock, Heart, Download, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import usePlayerStore from '../store/playerStore';
import db from '../lib/db';
import { downloadTrack } from '../utils/download';

export default function TrackList({ tracks, title }) {
  const { setTrack, setQueue } = usePlayerStore();
  const navigate = useNavigate();

  const handlePlay = (track, index) => {
    setQueue(tracks);
    setTrack(track);
  };

  const toggleFavorite = async (track) => {
    const existing = await db.favorites.where('trackId').equals(track.id).first();
    if (existing) {
      await db.favorites.delete(existing.id);
    } else {
      await db.favorites.add({
        trackId: track.id,
        title: track.title,
        artist: track.artist,
        thumbnail: track.thumbnail,
        addedAt: new Date(),
      });
    }
  };

  const formatDuration = (s) => {
    if (!s) return '—';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="px-6 pb-24">
      {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}

      <div className="grid grid-cols-[16px_4fr_3fr_minmax(120px,1fr)_minmax(80px,1fr)] gap-4 px-4 py-2
                      text-spotify-text text-xs uppercase tracking-wider border-b border-[#282828] mb-2">
        <span>#</span>
        <span>Title</span>
        <span>Album</span>
        <span className="flex justify-end"><Clock size={14} /></span>
        <span></span>
      </div>

      {tracks.map((track, i) => (
        <div
          key={track.id}
          className="grid grid-cols-[16px_4fr_3fr_minmax(120px,1fr)_minmax(80px,1fr)] gap-4 px-4 py-2
                     rounded-md hover:bg-[#ffffff10] group cursor-pointer items-center"
          onDoubleClick={() => handlePlay(track, i)}
        >
          <span className="text-spotify-text text-sm group-hover:hidden">{i + 1}</span>
          <button
            className="hidden group-hover:block text-white"
            onClick={() => handlePlay(track, i)}
          >
            <Play size={14} fill="white" />
          </button>

          <div className="flex items-center gap-3 min-w-0">
            <img src={track.thumbnail} className="w-10 h-10 rounded shrink-0" alt="" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{track.title}</p>
              <p
                className="text-xs text-spotify-text truncate hover:underline cursor-pointer hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  if (track.artistId) navigate(`/artist/${track.artistId}`);
                }}
              >
                {track.artist}
              </p>
            </div>
          </div>

          <span className="text-sm text-spotify-text truncate">
            {track.album || '—'}
          </span>

          <span className="text-sm text-spotify-text text-right tabular-nums">
            {formatDuration(track.duration)}
          </span>

          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); toggleFavorite(track); }}
              className="text-spotify-text hover:text-white"
              title="Favorit"
            >
              <Heart size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); usePlayerStore.getState().addToQueue(track); }}
              className="text-spotify-text hover:text-white"
              title="Zur Queue hinzufügen"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); downloadTrack(track); }}
              className="text-spotify-text hover:text-white"
              title="Download"
            >
              <Download size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
