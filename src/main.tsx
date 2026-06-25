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
