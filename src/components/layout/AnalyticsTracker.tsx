import { type FC, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSettings } from '../../hooks/useStore';
import { setAnalyticsEnabled, trackPageView } from '../../features/analytics';

const AnalyticsTracker: FC = () => {
  const location = useLocation();
  const enabled = useAppSettings((s) => s.analytics.enabled);

  useEffect(() => {
    setAnalyticsEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    trackPageView(location.pathname || '/');
  }, [enabled, location.pathname]);

  return null;
};

export default AnalyticsTracker;
