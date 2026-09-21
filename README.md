# Spotify 2.0 – Web-Musikplayer

Ein moderner Web-Musikplayer mit Spotify-Design, der YouTube Music als Quelle nutzt.

## Voraussetzungen

- **Node.js** >= 18 ([herunterladen](https://nodejs.org))
- **yt-dlp** ([Installation](https://github.com/yt-dlp/yt-dlp#installation))
- **npm** (wird mit Node.js mitgeliefert)

### yt-dlp installieren

```bash
# Windows (pip)
pip install yt-dlp

# macOS (Homebrew)
brew install yt-dlp

# Linux (pip)
pip install yt-dlp
```

## Projekt starten

### 1. Frontend-Abhängigkeiten installieren

```bash
cd frontend
npm install
```

### 2. Backend-Abhängigkeiten installieren

```bash
cd backend
npm install
```

### 3. Backend starten

```bash
cd backend
npm run dev
```

Der Backend-Server läuft auf `http://localhost:3001`.

### 4. Frontend starten (neues Terminal)

```bash
cd frontend
npm run dev
```

Die App öffnet sich unter `http://localhost:5173`.

## Features

- **Spotify-Design**: Dark-Theme mit typischer Farbpalette
- **Suche**: Songs, Künstler und Alben über YouTube Music finden
- **Streamen**: Direkte Audio-Wiedergabe (werbefrei)
- **Favoriten**: Songs über das Herz-Symbol speichern
- **Playlists**: Eigene Playlists erstellen und verwalten
- **Download**: Songs als MP3 herunterladen
- **Shuffle & Repeat**: Wiedergabefunktionen
- **Queue**: Warteschlange verwalten
- **MediaSession**: Browser-Media-Controls funktionieren

## Projektstruktur

```
spotify-2.0/
├── frontend/
│   ├── src/
│   │   ├── components/    # UI-Komponenten
│   │   ├── pages/         # Seiten (Home, Search, Library, Playlist)
│   │   ├── store/         # Zustand State-Management
│   │   ├── lib/           # IndexedDB (Dexie)
│   │   └── utils/         # Hilfsfunktionen (Download)
│   └── package.json
├── backend/
│   ├── server.js          # Express-Server mit yt-dlp Integration
│   └── package.json
└── KONZEPT.md             # Detailliertes Architektur-Dokument
```

## API-Endpunkte

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | `/api/health` | Server-Status prüfen |
| GET | `/api/search?q=...` | YouTube Music durchsuchen |
| GET | `/api/stream/:id` | Audio-Stream eines Songs |
| GET | `/api/track/:id` | Metadaten eines Songs |

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Zustand, React Router, Dexie (IndexedDB)
- **Backend**: Node.js, Express, yt-dlp
- **Speicher**: IndexedDB (lokal im Browser)

## Hinweise

- Die Streams werden über den Server proxied – yt-dlp läuft serverseitig
- Favoriten und Playlists werden im Browser (IndexedDB) gespeichert
- Für Offline-Nutzung: Songs über den Download-Button herunterladen
