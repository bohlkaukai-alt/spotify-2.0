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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="text-center py-20 text-spotify-text">
        <p>Playlist nicht gefunden</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-end gap-6 mb-6">
        <div className="w-48 h-48 bg-spotify-lighter rounded flex items-center justify-center shadow-2xl">
          <Music size={64} className="text-spotify-text" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase">Playlist</p>
          <h1 className="text-5xl font-bold mt-2 mb-4">{playlist.name}</h1>
          <p className="text-spotify-text">{tracks.length} Songs</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={deletePlaylist}
          className="flex items-center gap-2 px-4 py-2 text-spotify-text hover:text-white
                     border border-spotify-text hover:border-white rounded-full text-sm transition-colors"
        >
          <Trash2 size={14} /> Löschen
        </button>
      </div>

      {tracks.length === 0 ? (
        <div className="text-center py-20 text-spotify-text">
          <p>Noch keine Songs in dieser Playlist</p>
          <p className="text-sm mt-2">Füge Songs über die Suche hinzu</p>
        </div>
      ) : (
        <TrackList tracks={tracks} />
      )}
    </div>
  );
}
