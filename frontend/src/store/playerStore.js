import { create } from 'zustand';

const usePlayerStore = create((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  volume: 0.7,
  progress: 0,
  duration: 0,
  shuffle: false,
  repeat: 'off',

  setTrack: (track) => set({ currentTrack: track, isPlaying: true }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setVolume: (v) => set({ volume: v }),
  setProgress: (p) => set({ progress: p }),
  setDuration: (d) => set({ duration: d }),
  setShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  cycleRepeat: () =>
    set((s) => ({
      repeat: s.repeat === 'off' ? 'all' : s.repeat === 'all' ? 'one' : 'off',
    })),

  nextTrack: () => {
    const { queue, currentTrack, shuffle, repeat } = get();
    if (!queue.length || !currentTrack) return;

    if (repeat === 'one') {
      set({ progress: 0, isPlaying: true });
      return;
    }

    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    let next;

    if (shuffle) {
      const available = queue.filter((t) => t.id !== currentTrack.id);
      next = available[Math.floor(Math.random() * available.length)];
    } else {
      next = queue[idx + 1];
    }

    if (!next && repeat === 'all') next = queue[0];

    if (next) {
      set({ currentTrack: next, isPlaying: true, progress: 0 });
    } else {
      set({ isPlaying: false });
    }
  },

  prevTrack: () => {
    const { queue, currentTrack, progress } = get();
    if (!queue.length || !currentTrack) return;

    if (progress > 3) {
      set({ progress: 0 });
      return;
    }

    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    if (idx > 0) {
      set({ currentTrack: queue[idx - 1], progress: 0 });
    }
  },

  addToQueue: (track) => set((s) => ({ queue: [...s.queue, track] })),
  playNext: (track) => set((s) => {
    const idx = s.queue.findIndex((t) => t.id === s.currentTrack?.id);
    const newQueue = [...s.queue];
    newQueue.splice(idx + 1, 0, track);
    return { queue: newQueue };
  }),
  setQueue: (tracks) => set({ queue: tracks }),
  clearQueue: () => set({ queue: [], currentTrack: null, isPlaying: false }),
}));

export default usePlayerStore;
