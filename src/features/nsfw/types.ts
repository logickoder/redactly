export type NsfwTier = 'general' | 'slurs' | 'violence';

export type NsfwStrategy = 'mask' | 'soften';

export interface NsfwTierFlags {
  general: boolean;
  slurs: boolean;
  violence: boolean;
}

export interface NsfwSettings {
  enabled: boolean;
  tiers: NsfwTierFlags;
  strategy: NsfwStrategy;
  extraWords: string[];
  allowList: string[];
}

export const defaultNsfwSettings: NsfwSettings = {
  enabled: false,
  tiers: {
    general: true,
    slurs: true,
    violence: false,
  },
  strategy: 'mask',
  extraWords: [],
  allowList: [],
};
