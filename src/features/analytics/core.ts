import type { AnalyticsEvent } from './types';

const SCRIPT_ID = 'goatcounter-script';
const SITE_CODE = import.meta.env.VITE_GOATCOUNTER_CODE as string | undefined;
const READY_POLL_INTERVAL_MS = 50;
const READY_POLL_MAX_MS = 10_000;

interface CountVars {
  path: string;
  title?: string;
  referrer?: string;
  event?: boolean;
  no_session?: boolean;
}

interface GoatCounterGlobal {
  no_onload?: boolean;
  no_events?: boolean;
  allow_local?: boolean;
  allow_frame?: boolean;
  endpoint?: string;
  count?: (vars: CountVars) => void;
}

declare global {
  interface Window {
    goatcounter?: GoatCounterGlobal;
  }
}

const isDntOn = (): boolean =>
  typeof navigator !== 'undefined' &&
  (navigator.doNotTrack === '1' ||
    (navigator as { msDoNotTrack?: string }).msDoNotTrack === '1');

// Caller (typically a UI hook) owns the consent state and pushes it in via
// setAnalyticsEnabled(). Keeps this feature module headless — no React/store deps.
let enabledFlag = false;

export const setAnalyticsEnabled = (enabled: boolean): void => {
  enabledFlag = enabled;
  if (enabled) injectScript();
};

const isEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (isDntOn()) return false;
  if (!SITE_CODE) return false;
  return enabledFlag;
};

// Queue events fired between script-injection and script-ready; flushed on load.
const pendingQueue: CountVars[] = [];
let scriptInjected = false;
let scriptReady = false;

const flushQueue = (): void => {
  if (!scriptReady || !window.goatcounter?.count) return;
  while (pendingQueue.length > 0) {
    const vars = pendingQueue.shift();
    if (vars) window.goatcounter.count(vars);
  }
};

const startReadyPoll = (): void => {
  if (scriptReady) return;
  const startedAt = Date.now();
  const handle = window.setInterval(() => {
    if (window.goatcounter?.count) {
      scriptReady = true;
      window.clearInterval(handle);
      flushQueue();
    } else if (Date.now() - startedAt > READY_POLL_MAX_MS) {
      window.clearInterval(handle);
    }
  }, READY_POLL_INTERVAL_MS);
};

const injectScript = (): void => {
  if (scriptInjected) return;
  if (typeof document === 'undefined') return;
  if (!SITE_CODE) return;

  // Re-bind if HMR cleared module state but DOM still has the script.
  if (document.getElementById(SCRIPT_ID)) {
    scriptInjected = true;
    if (window.goatcounter?.count) scriptReady = true;
    else startReadyPoll();
    return;
  }

  // Settings MUST be on window.goatcounter BEFORE the script loads (per GoatCounter docs).
  window.goatcounter = {
    ...window.goatcounter,
    no_onload: true,
    allow_local: import.meta.env.DEV,
  };

  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = 'https://gc.zgo.at/count.js';
  script.dataset.goatcounter = `https://${SITE_CODE}.goatcounter.com/count`;
  document.head.appendChild(script);
  scriptInjected = true;
  startReadyPoll();
};

const queueOrSend = (vars: CountVars): void => {
  if (!isEnabled()) return;
  injectScript();
  if (scriptReady && window.goatcounter?.count) {
    window.goatcounter.count(vars);
  } else {
    pendingQueue.push(vars);
  }
};

export const initAnalytics = (enabled: boolean): void => {
  setAnalyticsEnabled(enabled);
};

export const trackPageView = (path: string): void => {
  queueOrSend({ path });
};

export const trackEvent = (name: AnalyticsEvent): void => {
  queueOrSend({ path: name, event: true });
};

export const isDoNotTrackOn = isDntOn;
