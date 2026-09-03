import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './i18n'
import { bootstrapColorSchemeFromStorage } from './utils/themeBootstrap'
import './index.css'
import App from './App.tsx'
import { reportWebVitals } from './utils/webVitals'
import { registerSW } from 'virtual:pwa-register'
import { toast } from 'sonner'
import { initSentry } from './lib/sentryInit'

bootstrapColorSchemeFromStorage()
initSentry()

// Service worker só em produção - evita workbox no dev (cache Vite instável)
if (import.meta.env.PROD)
{
  registerSW({
    onNeedRefresh ()
    {
      toast('Nova versão disponível!', {
        action: {
          label: 'Atualizar',
          onClick: () => window.location.reload(),
        },
        duration: Infinity,
      });
    },
    onOfflineReady ()
    {
      toast.success('App pronto para uso offline!');
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// métricas de performance - loga no console em dev
reportWebVitals()
