# Spotify 2.0 – Web-Musikplayer (YouTube Music Backend)

## Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                  │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────┐ │
│  │ Sidebar  │  │ Content Area │  │Player Bar  │  │  Queue    │ │
│  │ Nav+Play │  │ Home/Search/ │  │ Play/Pause │  │  Drawer   │ │
│  │ lists    │  │ Album/Detail │  │ Controls   │  │           │ │
│  └──────────┘  └──────────────┘  └────────────┘  └───────────┘ │
│                           │                                     │
│                    Zustand Store                                │
│         (playerState, queue, favorites, playlists)              │
└───────────────────────────┬─────────────────────────────────────┘
                            │  REST API (fetch/axios)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js + Express)                 │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ /api/search   │  │ /api/stream  │  │ /api/metadata       │  │
│  │ Search songs, │  │ Proxy audio  │  │ Song/Album/Artist   │  │
│  │ albums, etc.  │  │ stream       │  │ info                │  │
│  └───────┬───────┘  └──────┬───────┘  └──────────┬──────────┘  │
│          │                 │                      │              │
│          ▼                 ▼                      ▼              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              yt-dlp / youtube-dl                         │    │
│  │     (Audio-Extraktion, keine Video-Wiedergabe)          │    │
│  └─────────────────────────┬───────────────────────────────┘    │
└────────────────────────────┼────────────────────────────────────┘
                             │  HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   YouTube Music / YouTube                        │
│          (Audio-Streams, Metadaten, Thumbnails)                  │
└─────────────────────────────────────────────────────────────────┘
```

### Datenfluss
1. **Suche**: Frontend → Backend → yt-dlp (YouTube Music Search) → Ergebnisse → Frontend
2. **Streaming**: Frontend → Backend → yt-dlp (Stream-URL) → Audio-Proxy → Frontend (Audio-Element)
3. **Metadaten**: Backend parst Titel, Künstler, Cover aus YouTube-Daten
4. **Lokale Daten**: Favorites/Playlists → IndexedDB im Browser (kein Server nötig)

---

## Tech Stack

| Layer     | Technologie                           |
|-----------|---------------------------------------|
| Frontend  | React 18 + Vite + Tailwind CSS        |
| State     | Zustand (player, queue, favorites)    |
| Routing   | React Router v6                       |
| Audio     | HTML5 Audio API + MediaSession API    |
| Backend   | Node.js + Express                     |
| Extractor | yt-dlp (CLI-Wrapper via child_process)|
| Storage   | IndexedDB (Dexie.js)                 |
| Icons     | Lucide React                          |

---

## Schritt-für-Schritt-Entwicklungsanleitung

### Voraussetzungen
- Node.js ≥ 18
- npm oder yarn
- yt-dlp installiert (`pip install yt-dlp` oder `brew install yt-dlp`)
- Git

### 1. Projekt initialisieren

```bash
# Frontend
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install -D tailwindcss @tailwindcss/vite
npm install react-router-dom zustand lucide-react dexie

# Backend
mkdir backend && cd backend
npm init -y
npm install express cors dotenv
npm install -D nodemon
```

### 2. Backend-Server starten

`backend/server.js`:
```js
const express = require('express');
const cors = require('cors');
const { execFile } = require('child_process');
const app = express();

app.use(cors());
app.use(express.json());

// Search endpoint
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  // Uses yt-dlp --dump-json to search YouTube Music
  const cmd = `yt-dlp "ytsearch10:${q}" --dump-json --flat-playlist --no-download`;
  exec(cmd, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    const results = stdout.trim().split('\n').map(JSON.parse);
    res.json(results.map(r => ({
      id: r.id,
      title: r.title,
      artist: r.uploader || r.channel,
      duration: r.duration,
      thumbnail: r.thumbnails?.[r.thumbnails.length - 1]?.url,
    })));
  });
});

// Stream endpoint - proxies audio
app.get('/api/stream/:id', async (req, res) => {
  const { id } = req.params;
  const proc = execFile('yt-dlp', [
    `-o`, `-`,
    '--no-playlist',
    '-f`, 'bestaudio[ext=m4a]/bestaudio',
    `https://youtube.com/watch?v=${id}`
  ]);
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Accept-Ranges', 'bytes');
  proc.stdout.pipe(res);
});

app.listen(3001, () => console.log('Backend running on :3001'));
```

Starten:
```bash
cd backend
npx nodemon server.js
```

### 3. Frontend-Grundgerüst

`frontend/src/index.css`:
```css
@import "tailwindcss";

:root {
  --spotify-green: #1DB954;
  --spotify-black: #121212;
  --spotify-dark: #181818;
  --spotify-lighter: #282828;
  --spotify-hover: #2a2a2a;
  --spotify-text: #b3b3b3;
  --spotify-white: #ffffff;
}

body {
  margin: 0;
  background: var(--spotify-black);
  color: var(--spotify-white);
  font-family: 'Circular', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### 4. Player-Store (Zustand)

`frontend/src/store/playerStore.js`:
```js
import { create } from 'zustand';

const usePlayerStore = create((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  volume: 0.8,
  progress: 0,
  duration: 0,
  shuffle: false,
  repeat: 'off', // off | one | all

  setTrack: (track) => set({ currentTrack: track, isPlaying: true }),
  togglePlay: () => set(s => ({ isPlaying: !s.isPlaying })),
  setVolume: (v) => set({ volume: v }),
  setProgress: (p) => set({ progress: p }),
  setDuration: (d) => set({ duration: d }),
  nextTrack: () => {
    const { queue, currentTrack, shuffle, repeat } = get();
    if (repeat === 'one') {
      set({ progress: 0, isPlaying: true });
      return;
    }
    const idx = queue.findIndex(t => t.id === currentTrack?.id);
    let next = shuffle
      ? queue[Math.floor(Math.random() * queue.length)]
      : queue[idx + 1];
    if (!next && repeat === 'all') next = queue[0];
    if (next) set({ currentTrack: next, isPlaying: true, progress: 0 });
    else set({ isPlaying: false });
  },
  prevTrack: () => {
    const { queue, currentTrack, progress } = get();
    if (progress > 3) {
      set({ progress: 0 });
      return;
    }
    const idx = queue.findIndex(t => t.id === currentTrack?.id);
    if (idx > 0) set({ currentTrack: queue[idx - 1], progress: 0 });
  },
  addToQueue: (track) => set(s => ({ queue: [...s.queue, track] })),
  setQueue: (tracks) => set({ queue: tracks }),
}));

export default usePlayerStore;
```

### 5. Audio-Player Component

`frontend/src/components/Player.jsx`:
```jsx
import { useRef, useEffect } from 'react';
import usePlayerStore from '../store/playerStore';

const API = 'http://localhost:3001';

export default function Player() {
  const audio = useRef(null);
  const { currentTrack, isPlaying, volume, progress, duration,
          togglePlay, setProgress, setDuration, nextTrack, prevTrack,
          setVolume } = usePlayerStore();

  useEffect(() => {
    if (currentTrack) {
      audio.current.src = `${API}/api/stream/${currentTrack.id}`;
      audio.current.play();
    }
  }, [currentTrack]);

  useEffect(() => {
    if (audio.current) {
      isPlaying ? audio.current.play() : audio.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audio.current) audio.current.volume = volume;
  }, [volume]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-spotify-dark border-t border-spotify-lighter
                    flex items-center px-4 z-50">
      <audio
        ref={audio}
        onTimeUpdate={(e) => setProgress(e.target.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onEnded={nextTrack}
      />

      {/* Track Info */}
      <div className="flex items-center gap-3 w-1/4">
        {currentTrack?.thumbnail && (
          <img src={currentTrack.thumbnail} className="w-14 h-14 rounded" alt="" />
        )}
        <div>
          <p className="text-sm font-medium truncate">{currentTrack?.title}</p>
          <p className="text-xs text-spotify-text truncate">{currentTrack?.artist}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 flex flex-col items-center gap-1">
        <div className="flex items-center gap-4">
          <button onClick={prevTrack} className="text-spotify-text hover:text-white">⏮</button>
          <button onClick={togglePlay}
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center
                             hover:scale-105 transition">
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button onClick={nextTrack} className="text-spotify-text hover:text-white">⏭</button>
        </div>
        <div className="flex items-center gap-2 w-full max-w-lg">
          <span className="text-xs text-spotify-text w-10 text-right">{formatTime(progress)}</span>
          <input type="range" min="0" max={duration} value={progress}
                 onChange={(e) => {
                   setProgress(Number(e.target.value));
                   audio.current.currentTime = Number(e.target.value);
                 }}
                 className="flex-1 h-1 accent-spotify-green cursor-pointer" />
          <span className="text-xs text-spotify-text w-10">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume */}
      <div className="w-1/4 flex justify-end items-center gap-2">
        <span className="text-xs text-spotify-text">🔊</span>
        <input type="range" min="0" max="1" step="0.01" value={volume}
               onChange={(e) => setVolume(Number(e.target.value))}
               className="w-24 h-1 accent-spotify-green cursor-pointer" />
      </div>
    </div>
  );
}
```

### 6. Sidebar Component

`frontend/src/components/Sidebar.jsx`:
```jsx
import { Home, Search, Library, Plus } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/search', icon: Search, label: 'Suche' },
    { to: '/library', icon: Library, label: 'Bibliothek' },
  ];

  return (
    <div className="w-64 bg-spotify-black h-full flex flex-col p-2 gap-2">
      {/* Logo */}
      <div className="px-4 py-3">
        <span className="text-xl font-bold tracking-tight">♫ Spotify 2.0</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
                   className={({ isActive }) =>
                     `flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium
                      ${isActive ? 'bg-spotify-lighter text-white' : 'text-spotify-text hover:text-white'}`}>
            <Icon size={22} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Playlists */}
      <div className="mt-4 px-2 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-spotify-text text-xs font-semibold uppercase tracking-wider">
            Playlists
          </span>
          <button className="text-spotify-text hover:text-white">
            <Plus size={18} />
          </button>
        </div>
        {/* Playlist items rendered from IndexedDB */}
        <div className="text-spotify-text text-sm px-2">
          Noch keine Playlists
        </div>
      </div>
    </div>
  );
}
```

### 7. Search Page

`frontend/src/pages/Search.jsx`:
```jsx
import { useState } from 'react';

const API = 'http://localhost:3001';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error('Search failed:', err);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && search()}
             placeholder="Songs, Künstler, Alben suchen..."
             className="w-full bg-spotify-lighter rounded-full px-6 py-3 text-white
                        placeholder-spotify-text outline-none focus:ring-2 focus:ring-spotify-green
                        text-lg" />
      <button onClick={search} className="ml-2 px-6 py-3 bg-spotify-green rounded-full
                                         font-semibold hover:scale-105 transition">
        Suchen
      </button>

      {loading && <p className="mt-4 text-spotify-text">Suche läuft...</p>}

      <div className="mt-6 grid gap-2">
        {results.map((track) => (
          <div key={track.id}
               className="flex items-center gap-4 p-3 rounded-md hover:bg-spotify-hover
                          cursor-pointer transition group"
               onClick={() => {/* dispatch to player store */}}>
            <img src={track.thumbnail} className="w-12 h-12 rounded" alt="" />
            <div className="flex-1">
              <p className="font-medium group-hover:text-spotify-green transition">{track.title}</p>
              <p className="text-sm text-spotify-text">{track.artist}</p>
            </div>
            <span className="text-sm text-spotify-text">
              {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 8. Favoriten & Playlists (IndexedDB mit Dexie)

`frontend/src/lib/db.js`:
```js
import Dexie from 'dexie';

const db = new Dexie('SpotifyCloneDB');

db.version(1).stores({
  favorites: '++id, trackId, title, artist, thumbnail',
  playlists: '++id, name, createdAt',
  playlistTracks: '++id, playlistId, trackId, title, artist, thumbnail, addedAt',
});

export default db;
```

Nutzen:
```js
import db from '../lib/db';

// Favorit hinzufügen
await db.favorites.add({
  trackId: track.id,
  title: track.title,
  artist: track.artist,
  thumbnail: track.thumbnail,
});

// Favoriten laden
const favs = await db.favorites.toArray();

// Playlist erstellen
const playlistId = await db.playlists.add({ name: 'Meine Playlist', createdAt: new Date() });
await db.playlistTracks.add({ playlistId, trackId: track.id, ...track });
```

### 9. Datei-Download (Audio)

`frontend/src/utils/download.js`:
```js
const API = 'http://localhost:3001';

export async function downloadTrack(track) {
  const res = await fetch(`${API}/api/stream/${track.id}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${track.artist} - ${track.title}.mp3`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

Nutzen:
```jsx
<button onClick={() => downloadTrack(track)} className="text-spotify-text hover:text-white">
  ⬇ Download
</button>
```

---

## Projektstruktur (fertig)

```
spotify-2.0/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Player.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── TrackList.jsx
│   │   │   └── Layout.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Search.jsx
│   │   │   ├── Library.jsx
│   │   │   └── Playlist.jsx
│   │   ├── store/
│   │   │   └── playerStore.js
│   │   ├── lib/
│   │   │   └── db.js
│   │   ├── utils/
│   │   │   └── download.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
├── backend/
│   ├── server.js
│   └── package.json
└── README.md
```

---

## Start-Befehle

```bash
# Terminal 1 - Backend
cd backend && npx nodemon server.js

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Dann öffne `http://localhost:5173` im Browser.
