import Dexie from 'dexie';

const db = new Dexie('SpotifyCloneDB');

db.version(1).stores({
  favorites: '++id, trackId, title, artist, thumbnail, addedAt',
  playlists: '++id, name, createdAt',
  playlistTracks: '++id, playlistId, trackId, title, artist, thumbnail, addedAt',
});

export default db;
