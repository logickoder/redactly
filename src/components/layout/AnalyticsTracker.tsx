import { type FC, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSettings } from '../../hooks/useStore';
import { initAnalytics, trackPageView } from '../../features/analytics';

/**
 * Mounted inside <Layout>. Boots the analytics script when consent is granted
 * and emits a page-view on every route change.
 */
const AnalyticsTracker: FC = () => {
  const location = useLocation();
  const enabled = useAppSettings((s) => s.analytics.enabled);

  useEffect(() => {
    if (enabled) initAnalytics();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    trackPageView(location.pathname || '/');
  }, [enabled, location.pathname]);

  return null;
};

export default AnalyticsTracker;
