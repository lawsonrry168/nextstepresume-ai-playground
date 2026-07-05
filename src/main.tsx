import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { LocaleProvider } from './i18n';
import { injectLayoutGeometryCss } from './lib/layoutDocument/geometryCss';
import { purgeLegacyStorage } from './lib/storageKeys';
import { SubscriptionProvider } from './context/SubscriptionProvider';
import { AuthProvider } from './context/AuthProvider';
import BillingModals from './components/billing/BillingModals';
import AuthModal from './components/auth/AuthModal';
import CloudSyncBootstrap from './components/sync/CloudSyncBootstrap';
import './index.css';
import './dark-marginalia.css';

purgeLegacyStorage();
injectLayoutGeometryCss();

const isPrintExportMode = new URLSearchParams(window.location.search).has('print');

if (isPrintExportMode) {
  // Seed the UI locale from the print payload BEFORE LocaleProvider reads it,
  // so section titles render in the requested language.
  try {
    const raw = localStorage.getItem('nsr_print_payload');
    const payloadLocale = raw ? (JSON.parse(raw) as { locale?: string }).locale : undefined;
    if (payloadLocale === 'en' || payloadLocale === 'zh-TW' || payloadLocale === 'zh-HK') {
      localStorage.setItem('nsr_ui_locale', payloadLocale);
    }
  } catch {
    /* ignore */
  }
  void import('./components/PrintExportPage').then(({ default: PrintExportPage }) => {
    createRoot(document.getElementById('root')!).render(
      <LocaleProvider>
        <PrintExportPage />
      </LocaleProvider>,
    );
  });
} else {
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <App />
          <BillingModals />
          <AuthModal />
          <CloudSyncBootstrap />
        </SubscriptionProvider>
      </AuthProvider>
    </LocaleProvider>
  </StrictMode>,
);
}
