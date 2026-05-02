export interface AnalyticsSettings {
  enabled: boolean;
  hasDecided: boolean;
}

export const defaultAnalyticsSettings: AnalyticsSettings = {
  enabled: false,
  hasDecided: false,
};

export type AnalyticsEvent =
  | 'parse/success'
  | 'parse/fail'
  | 'export/copy'
  | 'export/download'
  | 'history/save'
  | 'history/load'
  | 'history/delete'
  | 'feature/aggressive-on'
  | 'feature/aggressive-off'
  | 'feature/pii-email-on'
  | 'feature/pii-url-on'
  | 'feature/pii-phone-on'
  | 'feature/nsfw-on'
  | 'feature/nsfw-off'
  | 'feature/nsfw-tier-general'
  | 'feature/nsfw-tier-slurs'
  | 'feature/nsfw-tier-violence'
  | 'feature/nsfw-strategy-mask'
  | 'feature/nsfw-strategy-soften'
  | 'install/accepted'
  | 'install/dismissed'
  | 'worker/fallback';
