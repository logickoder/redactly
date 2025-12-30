import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface SavedChat {
  id: string;
  title: string;
  date: string; // ISO string of when it was saved
  content: string; // Redacted content
  originalContent?: string; // Optional: if we want to allow reloading the original
}

interface AppState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  dateFormat: string;
  setDateFormat: (format: string) => void;

  nameMap: Record<string, string>;
  updateNameMap: (name: string, alias: string) => void;
  deleteNameMapping: (name: string) => void;

  savedChats: SavedChat[];
  saveChat: (chat: SavedChat) => void;
  deleteChat: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isDarkMode:
        typeof window !== 'undefined'
          ? document.documentElement.classList.contains('dark') ||
            window.matchMedia('(prefers-color-scheme: dark)').matches
          : false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      dateFormat: 'dd/MM/yyyy',
      setDateFormat: (format) => set({ dateFormat: format }),

      nameMap: {},
      updateNameMap: (name, alias) =>
        set((state) => ({
          nameMap: { ...state.nameMap, [name]: alias }
        })),
      deleteNameMapping: (name) =>
        set((state) => {
          const newMap = { ...state.nameMap };
          delete newMap[name];
          return { nameMap: newMap };
        }),

      savedChats: [],
      saveChat: (chat) =>
        set((state) => ({
          savedChats: [chat, ...state.savedChats.filter((c) => c.id !== chat.id)]
        })),
      deleteChat: (id) =>
        set((state) => ({
          savedChats: state.savedChats.filter((c) => c.id !== id)
        }))
    }),
    {
      name: 'redactly-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
