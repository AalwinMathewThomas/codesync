import { create } from 'zustand';

const useRoomStore = create((set) => ({
  currentRoom: null,
  activeUsers: [],
  currentCode: '',
  language: 'javascript',
  isLocked: false,
  output: '',
  isRunning: false,
  chatMessages: [],

  setRoom: (room) => set({ currentRoom: room }),

  setActiveUsers: (activeUsers) => set({ activeUsers }),

  setCode: (currentCode) => set({ currentCode }),

  setLanguage: (language) => set({ language }),

  setLocked: (isLocked) => set({ isLocked }),

  setOutput: (output) => set({ output }),

  setRunning: (isRunning) => set({ isRunning }),

  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, message]
  })),

  clearRoom: () => set({
    currentRoom: null,
    activeUsers: [],
    currentCode: '',
    language: 'javascript',
    isLocked: false,
    output: '',
    isRunning: false,
    chatMessages: []
  }),
}));

export default useRoomStore;