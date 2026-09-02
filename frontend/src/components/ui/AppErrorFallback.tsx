import { Link } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { SimplyLifeMark } from '../brand/SimplyLifeMark'
import { AXEL_BTN_PRIMARY, AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

interface AppErrorFallbackProps
{
  title?: string
  onRetry?: () => void
}

/** Erro genérico — tom calmo, sem detalhe técnico */
export function AppErrorFallback({
  title = 'Algo não carregou como esperado',
  onRetry,
}: AppErrorFallbackProps)
{
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-5 px-6 py-12 text-center">
      <SimplyLifeMark variant="icon" className="w-12 h-12 opacity-90" />
      <div className="max-w-sm space-y-2">
        <p className={`text-[17px] font-display font-medium ${AXEL_TEXT_PRIMARY}`}>
          {title}
        </p>
        <p className={`text-[14px] leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
          Isso às vezes acontece. Você pode tentar de novo ou voltar ao início.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={`inline-flex items-center gap-2 min-h-11 px-4 text-[13px] ${AXEL_BTN_PRIMARY}`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tentar novamente
          </button>
        )}
        <Link
          to="/"
          className="inline-flex items-center min-h-11 px-4 text-[13px] font-medium text-ink-muted hover:text-ink"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
