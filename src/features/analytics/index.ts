export type { AnalyticsSettings, AnalyticsEvent } from './types';
export { defaultAnalyticsSettings } from './types';
export {
  initAnalytics,
  trackPageView,
  trackEvent,
  isDoNotTrackOn,
} from './core';
