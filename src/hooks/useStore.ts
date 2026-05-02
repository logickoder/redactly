import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { defaultPiiSettings, type PiiSettings } from '../features/pii';
import {
  defaultNsfwSettings,
  type NsfwSettings,
  type NsfwStrategy,
  type NsfwTier,
} from '../features/nsfw';
import {
  defaultAnalyticsSettings,
  type AnalyticsSettings,
} from '../features/analytics';

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

  nsfw: NsfwSettings;
  toggleNsfw: () => void;
  toggleNsfwTier: (tier: NsfwTier) => void;
  setNsfwStrategy: (strategy: NsfwStrategy) => void;
  setNsfwExtraWords: (words: string[]) => void;
  setNsfwAllowList: (words: string[]) => void;

  analytics: AnalyticsSettings;
  setAnalyticsConsent: (enabled: boolean) => void;
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

      nsfw: defaultNsfwSettings,
      toggleNsfw: () =>
        set((state) => ({
          nsfw: { ...state.nsfw, enabled: !state.nsfw.enabled },
        })),
      toggleNsfwTier: (tier) =>
        set((state) => ({
          nsfw: {
            ...state.nsfw,
            tiers: { ...state.nsfw.tiers, [tier]: !state.nsfw.tiers[tier] },
          },
        })),
      setNsfwStrategy: (strategy) =>
        set((state) => ({ nsfw: { ...state.nsfw, strategy } })),
      setNsfwExtraWords: (extraWords) =>
        set((state) => ({ nsfw: { ...state.nsfw, extraWords } })),
      setNsfwAllowList: (allowList) =>
        set((state) => ({ nsfw: { ...state.nsfw, allowList } })),

      analytics: defaultAnalyticsSettings,
      setAnalyticsConsent: (enabled) =>
        set({ analytics: { enabled, hasDecided: true } }),
    }),
    {
      name: 'redactly-settings',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      // Older persisted shapes may lack `pii` / `nsfw` / `analytics` or carry
      // the v1 nsfw tier shape (profanity + sexual). Fill / coerce from defaults.
      migrate: (persisted) => {
        const state = persisted as Partial<AppSettingsState> | null;
        if (!state) return state;
        if (!state.pii) state.pii = { ...defaultPiiSettings };
        if (!state.nsfw) {
          state.nsfw = { ...defaultNsfwSettings };
        } else {
          // Coerce v1 tier shape: { profanity, sexual, slurs, violence } → { general, slurs, violence }
          const tiers = state.nsfw.tiers as unknown as
            | Record<string, boolean | undefined>
            | undefined;
          if (tiers && !('general' in tiers)) {
            state.nsfw.tiers = {
              general: Boolean(tiers.profanity ?? tiers.sexual ?? true),
              slurs: Boolean(tiers.slurs ?? true),
              violence: Boolean(tiers.violence ?? false),
            };
          }
        }
        if (!state.analytics) state.analytics = { ...defaultAnalyticsSettings };
        return state;
      },
    },
  ),
);
