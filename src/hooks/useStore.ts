import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { defaultPiiSettings, type PiiSettings } from '../features/pii';

interface AppSettingsState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  dateFormat: string;
  setDateFormat: (format: string) => void;

  nameMap: Record<string, string>;
  updateNameMap: (name: string, alias: string) => void;
  deleteNameMapping: (name: string) => void;

  aggressiveRedaction: boolean;
  toggleAggressiveRedaction: () => void;

  pii: PiiSettings;
  togglePii: (key: keyof PiiSettings) => void;
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

      aggressiveRedaction: false,
      toggleAggressiveRedaction: () =>
        set((state) => ({ aggressiveRedaction: !state.aggressiveRedaction })),

      pii: defaultPiiSettings,
      togglePii: (key) =>
        set((state) => ({ pii: { ...state.pii, [key]: !state.pii[key] } })),
    }),
    {
      name: 'redactly-settings',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Persisted shape from prior versions may lack the `pii` field. Fill from defaults.
      migrate: (persisted) => {
        const state = persisted as Partial<AppSettingsState> | null;
        if (!state) return state;
        if (!state.pii) state.pii = { ...defaultPiiSettings };
        return state;
      },
    },
  ),
);
