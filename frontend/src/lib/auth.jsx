import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import db from './db';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const syncToCloud = async () => {
    if (!user) return;
    const favorites = await db.favorites.toArray();
    const playlists = await db.playlists.toArray();
    const playlistTracks = await db.playlistTracks.toArray();

    await supabase.from('favorites').delete().eq('user_id', user.id);
    if (favorites.length > 0) {
      await supabase.from('favorites').insert(
        favorites.map(f => ({
          user_id: user.id,
          track_id: f.trackId,
          title: f.title,
          artist: f.artist,
          thumbnail: f.thumbnail,
          added_at: f.addedAt?.toISOString?.() || new Date(f.addedAt).toISOString(),
        }))
      );
    }

    await supabase.from('playlists').delete().eq('user_id', user.id);
    if (playlists.length > 0) {
      const plInsert = playlists.map(p => ({
        id: p.id,
        user_id: user.id,
        name: p.name,
        created_at: p.createdAt?.toISOString?.() || new Date(p.createdAt).toISOString(),
      }));
      await supabase.from('playlists').insert(plInsert);
    }

    await supabase.from('playlist_tracks').delete().eq('user_id', user.id);
    if (playlistTracks.length > 0) {
      await supabase.from('playlist_tracks').insert(
        playlistTracks.map(pt => ({
          user_id: user.id,
          playlist_id: pt.playlistId,
          track_id: pt.trackId,
          title: pt.title,
          artist: pt.artist,
          thumbnail: pt.thumbnail,
          duration: pt.duration,
          added_at: pt.addedAt?.toISOString?.() || new Date(pt.addedAt).toISOString(),
        }))
      );
    }
  };

  const syncFromCloud = async () => {
    if (!user) return;

    const { data: favs } = await supabase.from('favorites').select('*').eq('user_id', user.id);
    if (favs) {
      await db.favorites.clear();
      if (favs.length > 0) {
        await db.favorites.bulkAdd(favs.map(f => ({
          trackId: f.track_id,
          title: f.title,
          artist: f.artist,
          thumbnail: f.thumbnail,
          addedAt: new Date(f.added_at),
        })));
      }
    }

    const { data: pls } = await supabase.from('playlists').select('*').eq('user_id', user.id);
    if (pls) {
      await db.playlists.clear();
      if (pls.length > 0) {
        await db.playlists.bulkAdd(pls.map(p => ({
          id: p.id,
          name: p.name,
          createdAt: new Date(p.created_at),
        })));
      }
    }

    const { data: pts } = await supabase.from('playlist_tracks').select('*').eq('user_id', user.id);
    if (pts) {
      await db.playlistTracks.clear();
      if (pts.length > 0) {
        await db.playlistTracks.bulkAdd(pts.map(pt => ({
          playlistId: pt.playlist_id,
          trackId: pt.track_id,
          title: pt.title,
          artist: pt.artist,
          thumbnail: pt.thumbnail,
          duration: pt.duration,
          addedAt: new Date(pt.added_at),
        })));
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, syncToCloud, syncFromCloud }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
