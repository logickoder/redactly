export type { AnalyticsSettings, AnalyticsEvent } from './types';
export { defaultAnalyticsSettings } from './types';
export {
  initAnalytics,
  setAnalyticsEnabled,
  trackPageView,
  trackEvent,
  isDoNotTrackOn,
} from './core';
