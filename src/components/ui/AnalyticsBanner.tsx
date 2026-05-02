import { type FC } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, X } from 'lucide-react';
import { useAppSettings } from '../../hooks/useStore';
import { isDoNotTrackOn } from '../../features/analytics';

const AnalyticsBanner: FC = () => {
  const { analytics, setAnalyticsConsent } = useAppSettings();
  const shouldShow = !analytics.hasDecided && !isDoNotTrackOn();

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed right-4 bottom-4 left-4 z-50 mx-auto max-w-md sm:left-auto sm:mx-0"
          role="region"
          aria-label="Analytics consent"
        >
          <div className="card-base p-4 shadow-lg">
            <div className="mb-3 flex items-start gap-2.5">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundImage: 'var(--gradient-primary-tint)' }}
              >
                <BarChart3 size={15} className="text-primary" />
              </div>
              <div className="grow">
                <h3 className="text-text text-sm font-semibold">
                  Help improve Redactly?
                </h3>
                <p className="text-text-muted mt-1 text-xs leading-relaxed">
                  Share anonymous usage stats — page visits and which features get
                  used. <strong>No cookies, no chat data, no personal info.</strong>{' '}
                  Powered by GoatCounter.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAnalyticsConsent(false)}
                aria-label="Dismiss"
                className="text-text-muted -my-1 -mr-1 shrink-0 rounded-lg p-1 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAnalyticsConsent(false)}
                className="text-text-muted rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => setAnalyticsConsent(true)}
                className="btn-gradient flex items-center gap-2 px-4 py-1.5 text-xs"
              >
                Allow
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnalyticsBanner;
