import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Music, Trash2 } from 'lucide-react';
import db from '../lib/db';
import TrackList from '../components/TrackList';

export default function Playlist() {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlaylist();
  }, [id]);

  const loadPlaylist = async () => {
    const pl = await db.playlists.get(Number(id));
    if (!pl) {
      setLoading(false);
      return;
    }
    setPlaylist(pl);

    const items = await db.playlistTracks.where('playlistId').equals(Number(id)).toArray();
    setTracks(
      items.map((t) => ({
        id: t.trackId,
        title: t.title,
        artist: t.artist,
        thumbnail: t.thumbnail,
      }))
    );
    setLoading(false);
  };

  const deletePlaylist = async () => {
    if (!confirm('Playlist wirklich löschen?')) return;
    await db.playlists.delete(Number(id));
    await db.playlistTracks.where('playlistId').equals(Number(id)).delete();
    window.history.back();
  };

  const removeTrack = async (track) => {
    const existing = await db.playlistTracks.where({ playlistId: Number(id), trackId: track.id }).first();
    if (existing) await db.playlistTracks.delete(existing.id);
    setTracks((prev) => prev.filter((t) => t.id !== track.id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[var(--green)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="text-center py-20 text-[var(--text-dim)]">
        <p>Playlist nicht gefunden</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 pb-28">
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6 mb-6 animate-fadeUp">
        <div className="w-32 h-32 sm:w-48 sm:h-48 bg-[#1a1a1a] rounded-xl flex items-center justify-center shadow-2xl shrink-0">
          <Music size={48} className="text-[var(--text-dim)]" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Playlist</p>
          <h1 className="text-3xl sm:text-5xl font-bold mt-1 mb-2 sm:mb-4">{playlist.name}</h1>
          <p className="text-sm text-[var(--text-dim)]">{tracks.length} Songs</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6 animate-fadeUp" style={{ animationDelay: '0.05s' }}>
        <button
          onClick={deletePlaylist}
          className="flex items-center gap-2 px-4 py-2 text-[var(--text-dim)] hover:text-red-400
                     border border-[#2a2a2a] hover:border-red-400/50 rounded-full text-sm transition-all">
          <Trash2 size={14} /> Löschen
        </button>
      </div>

      {tracks.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-dim)] animate-fadeUp">
          <p className="text-lg mb-1">Noch keine Songs</p>
          <p className="text-sm">Füge Songs über die Suche hinzu</p>
        </div>
      ) : (
        <TrackList tracks={tracks} playlistId={Number(id)} onRemoveTrack={removeTrack} />
      )}
    </div>
  );
}
