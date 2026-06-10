import { AlertTriangle, Info } from 'lucide-react'
import { analyzeTaskIntent, INTENT_CATEGORY_STYLES } from '../../lib/intentAnalyzer'
import type { TarefaUnificada } from '../../types'

// Razão da Urgência — transparência do IntentAnalyzer

interface OrionUrgencyReasonCardProps
{
  tarefa: TarefaUnificada
  isCreatingNew?: boolean
}

export function OrionUrgencyReasonCard({
  tarefa,
  isCreatingNew = false,
}: OrionUrgencyReasonCardProps)
{
  if (isCreatingNew)
  {
    return (
      <section className="min-w-0" aria-label="Razão da Urgência">
        <h3 className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-2">
          Razão da Urgência
        </h3>
        <p className="text-xs text-zinc-500 leading-relaxed">
          A intenção será inferida após salvar, a partir do título e do remetente.
        </p>
      </section>
    )
  }

  const intent = analyzeTaskIntent(tarefa)
  const styles = INTENT_CATEGORY_STYLES[intent.category]

  return (
    <section className="min-w-0" aria-label="Razão da Urgência">
      <h3 className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-2">
        Razão da Urgência
      </h3>

      <div
        className={`rounded-lg border p-3 transition-all duration-300 ${styles.border} bg-[#121420]/80`}
      >
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles.badge}`}
          >
            {intent.categoryLabel}
          </span>
          {intent.ignoreDeadline && (
            <span className="text-[10px] text-zinc-500 font-mono">
              Prazo ignorado
            </span>
          )}
        </div>

        <p className={`text-xs leading-relaxed ${styles.text}`}>
          {tarefa.urgency_reason ?? intent.urgencyReason}
        </p>

        {intent.flowAlert && (
          <div
            className="mt-3 flex items-start gap-2 rounded-md border border-rose-500/25 bg-rose-500/10 px-2.5 py-2"
            role="alert"
          >
            <AlertTriangle
              size={14}
              strokeWidth={1.5}
              className="text-rose-400 shrink-0 mt-0.5"
              aria-hidden
            />
            <p className="text-[11px] text-rose-300 leading-snug">
              {intent.flowAlert}
            </p>
          </div>
        )}

        {intent.category === 'alinhamento' && (
          <p className="mt-2 text-[10px] text-zinc-500 flex items-center gap-1">
            <Info size={12} strokeWidth={1.5} aria-hidden />
            Informação — não força prioridade por prazo.
          </p>
        )}
      </div>
    </section>
  )
}
