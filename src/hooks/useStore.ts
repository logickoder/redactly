import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AppSettingsState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  dateFormat: string;
  setDateFormat: (format: string) => void;

  nameMap: Record<string, string>;
  updateNameMap: (name: string, alias: string) => void;
  deleteNameMapping: (name: string) => void;
}

export const useAppSettings = create<AppSettingsState>()(
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
          nameMap: { ...state.nameMap, [name]: alias },
        })),
      deleteNameMapping: (name) =>
        set((state) => {
          const newMap = { ...state.nameMap };
          delete newMap[name];
          return { nameMap: newMap };
        }),
    }),
    {
      name: 'redactly-settings',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
