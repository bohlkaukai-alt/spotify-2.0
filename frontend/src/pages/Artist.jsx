import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Play, ArrowLeft, User } from 'lucide-react';
import usePlayerStore from '../store/playerStore';
import TrackList from '../components/TrackList';

export default function Artist() {
  const { channelId } = useParams();
  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { setTrack, setQueue } = usePlayerStore();

  useEffect(() => {
    loadArtist();
  }, [channelId]);

  const loadArtist = async () => {
    setLoading(true);
    try {
      const [artistRes, songsRes] = await Promise.all([
        fetch(`/api/artist/${channelId}`),
        fetch(`/api/artist/${channelId}/songs?limit=100`),
      ]);
      if (artistRes.ok) setArtist(await artistRes.json());
      if (songsRes.ok) setSongs(await songsRes.json());
    } catch (err) {
      console.error('Failed to load artist:', err);
    }
    setLoading(false);
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/artist/${channelId}/songs?limit=200`);
      if (res.ok) setSongs(await res.json());
    } catch (err) {
      console.error(err);
    }
    setLoadingMore(false);
  };

  const playAll = () => {
    if (songs.length) {
      setQueue(songs);
      setTrack(songs[0]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div
        className="relative h-80 flex items-end p-8"
        style={{
          background: artist?.thumbnail
            ? `linear-gradient(transparent 0%, rgba(0,0,0,0.8) 100%), url(${artist.thumbnail}) center/cover`
            : 'linear-gradient(transparent 0%, rgba(0,0,0,0.8) 100%), #333',
        }}
      >
        <button
          onClick={() => window.history.back()}
          className="absolute top-4 left-4 w-8 h-8 bg-black/50 rounded-full flex items-center
                     justify-center hover:bg-black/70 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-end gap-6">
          {artist?.thumbnail ? (
            <img
              src={artist.thumbnail}
              className="w-48 h-48 rounded-full shadow-2xl object-cover"
              alt=""
            />
          ) : (
            <div className="w-48 h-48 rounded-full bg-spotify-lighter flex items-center justify-center shadow-2xl">
              <User size={64} className="text-spotify-text" />
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase">Künstler</p>
            <h1 className="text-6xl font-black mt-2 mb-4 tracking-tight">
              {artist?.name || 'Unbekannt'}
            </h1>
            {artist?.subscriberCount > 0 && (
              <p className="text-sm text-spotify-text">
                {artist.subscriberCount.toLocaleString('de-DE')} Abonnenten
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 px-8 py-6">
        <button
          onClick={playAll}
          className="w-14 h-14 bg-spotify-green rounded-full flex items-center justify-center
                     hover:scale-105 hover:bg-[#1ed760] transition-all shadow-lg"
        >
          <Play size={24} fill="black" className="text-black ml-1" />
        </button>
        <span className="text-spotify-text text-sm">{songs.length} Songs</span>
      </div>

      {/* Songs */}
      {songs.length > 0 ? (
        <>
          <TrackList tracks={songs} />
          {songs.length >= 100 && (
            <div className="flex justify-center px-8 pb-24">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-8 py-3 border border-spotify-text rounded-full text-sm font-semibold
                           hover:border-white hover:text-white transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Lädt...' : 'Mehr Songs laden'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 text-spotify-text px-8">
          <p className="text-lg">Keine Songs gefunden</p>
          <p className="text-sm mt-2">Dieser Kanal hat möglicherweise keine Musik-Videos</p>
        </div>
      )}
    </div>
  );
}
