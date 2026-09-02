import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

const DISMISS_KEY = 'simply-life-pwa-install-dismissed'

interface BeforeInstallPromptEvent extends Event
{
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandaloneMode(): boolean
{
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
}

/** Banner de instalação PWA — Android/Chrome (beforeinstallprompt) */
export function PwaInstallBanner()
{
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(() =>
  {
    try
    {
      return localStorage.getItem(DISMISS_KEY) === '1'
    }
    catch
    {
      return false
    }
  })
  const [standalone, setStandalone] = useState(isStandaloneMode)

  useEffect(() =>
  {
    setStandalone(isStandaloneMode())

    const onInstall = (event: Event) =>
    {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', onInstall)
    return () => window.removeEventListener('beforeinstallprompt', onInstall)
  }, [])

  if (standalone || hidden) return null

  const dismiss = () =>
  {
    setHidden(true)
    try
    {
      localStorage.setItem(DISMISS_KEY, '1')
    }
    catch { /* quota */ }
  }

  const isIos = typeof navigator !== 'undefined'
    && /iPad|iPhone|iPod/.test(navigator.userAgent)

  if (isIos && !deferred)
  {
    return (
      <div className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] md:bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[90]">
        <div className="rounded-sl border border-accent/30 bg-card shadow-xl p-4">
          <p className="text-sm font-medium text-ink">Instalar no iPhone</p>
          <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
            Safari → Compartilhar → Adicionar à Tela de Início. Abre em tela cheia como app.
            Push só no iOS 16.4+, depois de instalado — o Safari na aba não pede permissão.
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="mt-3 px-3 py-2 rounded-sl border border-line font-mono text-[10px] uppercase text-ink-muted"
          >
            Entendi
          </button>
        </div>
      </div>
    )
  }

  if (!deferred) return null

  const install = async () =>
  {
    await deferred.prompt()
    const choice = await deferred.userChoice
    setDeferred(null)
    if (choice.outcome === 'accepted') dismiss()
  }

  return (
    <div className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] md:bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[90]">
      <div className="rounded-sl border border-accent/30 bg-card shadow-xl p-4 flex gap-3 items-start">
        <div className="shrink-0 w-9 h-9 rounded-sl bg-accent/15 flex items-center justify-center">
          <Download size={16} className="text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">Instalar Simply-Life</p>
          <p className="text-[11px] text-ink-muted mt-0.5 leading-relaxed">
            Adicione à tela inicial para abrir como app — alertas, finanças e tarefas na palma da mão.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => void install()}
              className="px-3 py-2 rounded-sl bg-ink text-fundo font-mono text-[10px] uppercase"
            >
              Instalar
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="px-3 py-2 rounded-sl border border-line font-mono text-[10px] uppercase text-ink-muted"
            >
              Agora não
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 p-1 text-ink-muted hover:text-ink"
          aria-label="Fechar"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
