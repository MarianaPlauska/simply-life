import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { MedicamentosBulkPanel } from '../MedicamentosBulkPanel'
import { MedicamentosNotificationBanner } from './MedicamentosNotificationBanner'

export function MedicamentosCadastroTab()
{
  const [avancado, setAvancado] = useState(false)

  return (
    <div className="space-y-4">
      <MedicamentosNotificationBanner compact />

      <MedicamentosBulkPanel variant="cadastro" showAdvanced={avancado} />

      <button
        type="button"
        onClick={() => setAvancado((v) => !v)}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-mono uppercase text-ink-muted hover:text-ink transition-colors"
      >
        {avancado ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" />
            Menos opções
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" />
            Dias, duração e tipo (opcional)
          </>
        )}
      </button>
    </div>
  )
}
