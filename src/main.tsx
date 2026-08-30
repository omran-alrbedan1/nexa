import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import '@/i18n';
import '@/styles/globals.css';
import { initApiBaseUrl } from '@/lib/apiBaseUrl';

initApiBaseUrl().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
