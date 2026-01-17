import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStreamStore = create(
  persist(
    (set, get) => ({
      // Available streams from API
      availableStreams: [],

      // Selected streams in grid (array of streams or null for empty slots)
      selectedStreams: Array(4).fill(null), // Default 2x2

      // Current grid layout
      gridLayout: '2x2',

      // Index of stream with active audio (null if none)
      activeAudioIndex: null,

      // Actions
      setAvailableStreams: (streams) => set({ availableStreams: streams }),

      setGridLayout: (layout) => {
        const [rows, cols] = layout.split('x').map(Number);
        const newTotal = rows * cols;
        const currentStreams = get().selectedStreams;

        // Resize selectedStreams array
        const newSelectedStreams = Array(newTotal).fill(null);
        for (let i = 0; i < Math.min(currentStreams.length, newTotal); i++) {
          newSelectedStreams[i] = currentStreams[i];
        }

        // Reset audio if active stream is out of bounds
        const activeIndex = get().activeAudioIndex;
        const newActiveIndex = activeIndex !== null && activeIndex >= newTotal ? null : activeIndex;

        set({
          gridLayout: layout,
          selectedStreams: newSelectedStreams,
          activeAudioIndex: newActiveIndex
        });
      },

      addStream: (stream, index) => {
        const streams = [...get().selectedStreams];
        streams[index] = stream;
        set({ selectedStreams: streams });
      },

      removeStream: (index) => {
        const streams = [...get().selectedStreams];
        streams[index] = null;

        const activeIndex = get().activeAudioIndex;
        const newActiveIndex = activeIndex === index ? null : activeIndex;

        set({
          selectedStreams: streams,
          activeAudioIndex: newActiveIndex
        });
      },

      setActiveAudioIndex: (index) => set({ activeAudioIndex: index }),

      clearAllStreams: () => {
        const total = get().selectedStreams.length;
        set({
          selectedStreams: Array(total).fill(null),
          activeAudioIndex: null
        });
      }
    }),
    {
      name: 'stream-viewer-storage',
      partialize: (state) => ({
        gridLayout: state.gridLayout,
        selectedStreams: state.selectedStreams,
        activeAudioIndex: state.activeAudioIndex
      })
    }
  )
);
