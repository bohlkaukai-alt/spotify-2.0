import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, ArrowLeft, User } from 'lucide-react';
import usePlayerStore from '../store/playerStore';
import TrackList from '../components/TrackList';
import { getArtistInfo, getArtistSongs } from '../lib/api';

export default function Artist() {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setTrack, setQueue } = usePlayerStore();

  useEffect(() => { loadArtist(); }, [channelId]);

  const loadArtist = async () => {
    setLoading(true);
    try {
      const [artistData, songsData] = await Promise.all([
        getArtistInfo(channelId),
        getArtistSongs(channelId, 100),
      ]);
      setArtist(artistData);
      setSongs(songsData);
    } catch (err) {
      console.error('Failed to load artist:', err);
    }
    setLoading(false);
  };

  const playAll = () => {
    if (songs.length) { setQueue(songs); setTrack(songs[0]); }
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
      <div className="relative h-64 sm:h-80 flex items-end p-4 sm:p-8"
        style={{
          background: artist?.thumbnail
            ? `linear-gradient(transparent 0%, rgba(0,0,0,0.8) 100%), url(${artist.thumbnail}) center/cover`
            : 'linear-gradient(transparent 0%, rgba(0,0,0,0.8) 100%), #333',
        }}>
        <button onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-end gap-4 sm:gap-6">
          {artist?.thumbnail ? (
            <img src={artist.thumbnail} className="w-24 h-24 sm:w-48 sm:h-48 rounded-full shadow-2xl object-cover" alt="" />
          ) : (
            <div className="w-24 h-24 sm:w-48 sm:h-48 rounded-full bg-spotify-lighter flex items-center justify-center shadow-2xl">
              <User size={48} className="text-spotify-text" />
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase">Künstler</p>
            <h1 className="text-3xl sm:text-6xl font-black mt-1 sm:mt-2 mb-2 sm:mb-4 tracking-tight">{artist?.name || '?'}</h1>
            {artist?.subscriberCount > 0 && (
              <p className="text-sm text-spotify-text">{artist.subscriberCount.toLocaleString('de-DE')} Abonnenten</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6 px-4 sm:px-8 py-4 sm:py-6">
        <button onClick={playAll}
          className="w-12 h-12 sm:w-14 sm:h-14 bg-spotify-green rounded-full flex items-center justify-center hover:scale-105 hover:bg-[#1ed760] transition-all shadow-lg">
          <Play size={22} fill="black" className="text-black ml-0.5" />
        </button>
        <span className="text-spotify-text text-sm">{songs.length} Songs</span>
      </div>

      {songs.length > 0 ? <TrackList tracks={songs} /> : (
        <div className="text-center py-16 text-spotify-text px-4">
          <p className="text-lg">Keine Songs gefunden</p>
        </div>
      )}
    </div>
  );
}
