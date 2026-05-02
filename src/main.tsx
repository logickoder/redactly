import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import App from './App.tsx';
import { initDB } from './features/chat';
import { trackEvent } from './features/analytics';

// Initialize IndexedDB before rendering the app
initDB().catch((error) => {
  console.error('Failed to initialize IndexedDB:', error);
});

// PWA install — fires when user actually installs.
window.addEventListener('appinstalled', () => trackEvent('install/accepted'));

// `beforeinstallprompt` lets us observe (and choose to defer) the native prompt.
// We let the browser's default flow run; just record dismissal via userChoice when available.
window.addEventListener('beforeinstallprompt', (e) => {
  const promptEvent = e as Event & {
    userChoice?: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  };
  promptEvent.userChoice
    ?.then((choice) => {
      if (choice.outcome === 'dismissed') trackEvent('install/dismissed');
    })
    .catch(() => {
      /* user closed without choosing — ignore */
    });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);
