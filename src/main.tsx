import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { LocaleProvider } from './i18n';
import { purgeLegacyStorage } from './lib/storageKeys';
import { SubscriptionProvider } from './context/SubscriptionProvider';
import BillingModals from './components/billing/BillingModals';
import './index.css';
import './dark-marginalia.css';

purgeLegacyStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <SubscriptionProvider>
        <App />
        <BillingModals />
      </SubscriptionProvider>
    </LocaleProvider>
  </StrictMode>,
);
