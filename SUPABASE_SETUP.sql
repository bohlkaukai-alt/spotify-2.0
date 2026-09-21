/*
 * SUPABASE SETUP
 * ==============
 * 1. Gehe zu https://supabase.com und erstelle ein Konto (kostenlos)
 * 2. Erstelle ein neues Projekt
 * 3. Gehe zu "SQL Editor" in der Supabase Dashboard
 * 4. Führe das untenstehende SQL aus
 * 5. Gehe zu "Settings > API" und kopiere:
 *    - Project URL (https://xxxxx.supabase.co)
 *    - anon public key (eyJ...)
 * 6. Erstelle die Datei frontend/.env.local mit:
 *    VITE_SUPABASE_URL=deine-project-url
 *    VITE_SUPABASE_ANON_KEY=deine-anon-key
 */

-- Tabellen erstellen
CREATE TABLE IF NOT EXISTS favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT DEFAULT '',
  thumbnail TEXT DEFAULT '',
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, track_id)
);

CREATE TABLE IF NOT EXISTS playlists (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(id, user_id)
);

CREATE TABLE IF NOT EXISTS playlist_tracks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT DEFAULT '',
  thumbnail TEXT DEFAULT '',
  duration REAL DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, playlist_id, track_id)
);

-- Row Level Security aktivieren
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;

-- Policies: Jeder kann nur eigene Daten lesen/schreiben
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own playlists"
  ON playlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own playlists"
  ON playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own playlists"
  ON playlists FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own playlist_tracks"
  ON playlist_tracks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own playlist_tracks"
  ON playlist_tracks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own playlist_tracks"
  ON playlist_tracks FOR DELETE USING (auth.uid() = user_id);
