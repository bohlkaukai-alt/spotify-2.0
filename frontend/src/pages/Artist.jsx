import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Play, Pause, Check } from 'lucide-react';
import usePlayerStore from '../store/playerStore';
import { getArtistInfo, getArtistSongs } from '../lib/api';
import TrackList from '../components/TrackList';

export default function Artist() {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const { currentTrack, isPlaying, setTrack, setQueue, togglePlay } = usePlayerStore();

  useEffect(() => {
    setLoading(true);
    Promise.all([getArtistInfo(channelId), getArtistSongs(channelId)])
      .then(([info, sngs]) => { setArtist(info); setSongs(sngs); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [channelId]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="pb-28 md:pb-6">
      {/* Header */}
      <div className="relative -mx-4 md:-mx-6 -mt-4 md:-mt-4 mb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-[#333] to-[#121212]" />
        <div className="relative flex items-end gap-6 px-6 pt-12 pb-6">
          <img src={artist?.thumbnail} alt=""
            className="w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full object-cover shadow-2xl shrink-0" />
          <div className="min-w-0 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <svg viewBox="0 0 24 24" fill="#3d91f4" width="20" height="20">
                <path d="M10.814.5a1.658 1.658 0 0 1 2.372 0l2.284 2.336 3.297-.037a1.658 1.658 0 0 1 1.678 1.678l-.037 3.297 2.336 2.284a1.658 1.658 0 0 1 0 2.372l-2.336 2.284.037 3.297a1.658 1.658 0 0 1-1.678 1.678l-3.297-.037-2.284 2.336a1.658 1.658 0 0 1-2.372 0l-2.284-2.336-3.297.037a1.658 1.658 0 0 1-1.678-1.678l.037-3.297L.5 13.186a1.658 1.658 0 0 1 0-2.372l2.336-2.284-.037-3.297a1.658 1.658 0 0 1 1.678-1.678l3.297.037L10.814.5z"/>
                <path d="M16.273 7.78a.75.75 0 0 0-1.06-1.06L10 11.94l-1.973-1.974a.75.75 0 0 0-1.06 1.06l2.5 2.5a.75.75 0 0 0 1.06 0l5.746-5.746z" fill="white"/>
              </svg>
              <span className="text-sm font-bold text-white">Verifizierter Künstler</span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-white truncate">{artist?.name}</h1>
            <p className="text-sm text-white/70 mt-2">
              {artist?.subscriberCount ? `${(artist.subscriberCount / 1000).toFixed(0).replace('.',',')} Monatshörer` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 px-2 mb-6">
        <button onClick={() => {
          if (songs.length > 0) {
            if (currentTrack && songs.some(s => s.id === currentTrack.id)) { togglePlay(); }
            else { setQueue(songs); setTrack(songs[0]); }
          }
        }}
          className="w-14 h-14 bg-[var(--green)] rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg">
          {isPlaying && songs.some(s => s.id === currentTrack?.id)
            ? <Pause size={24} className="text-black" fill="black" />
            : <Play size={24} className="text-black ml-1" fill="black" />}
        </button>
        <button onClick={() => setFollowing(!following)}
          className={`px-6 py-1.5 rounded-full text-sm font-bold border transition-colors
            ${following ? 'border-white/40 text-white' : 'border-[var(--text-dim)] text-white hover:border-white'}`}>
          {following ? <span className="flex items-center gap-1"><Check size={14} /> Folge ich</span> : 'Folgen'}
        </button>
      </div>

      {/* Songs */}
      {songs.length > 0 && <TrackList tracks={songs} title="Beliebte Songs" />}

      {songs.length === 0 && !loading && (
        <div className="text-center py-16">
          <p className="text-lg font-bold text-white">Keine Songs gefunden</p>
        </div>
      )}
    </div>
  );
}
