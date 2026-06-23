import { RefreshCw, Settings2, Sparkles, Wallet } from 'lucide-react'
import { useTaskStore } from '../../../store/useTaskStore'
import { useFinanceCoach } from '../../../hooks/useFinanceCoach'
import type { FinanceCoachAdvice } from '../../../lib/financeCoachContext'
import type { Transaction } from '../../../store/storeTypes'
import {
  AXEL_BTN_PRIMARY,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../../constants/axelSurfaces'

const TONE_SHELL = {
  ok: {
    accent: 'border-l-concluido',
    badge: 'bg-concluido/12 text-concluido border-concluido/25',
  },
  caution: {
    accent: 'border-l-atencao',
    badge: 'bg-atencao/12 text-atencao border-atencao/25',
  },
  urgent: {
    accent: 'border-l-urgente',
    badge: 'bg-urgente/12 text-urgente border-urgente/25',
  },
} as const

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceCoachCardProps
{
  monthTransactions: Transaction[]
  onSetLimits: () => void
  onConfigure?: () => void
}

export function FinanceCoachCard({
  monthTransactions,
  onSetLimits,
  onConfigure,
}: FinanceCoachCardProps)
{
  const setBudgetLimit = useTaskStore((s) => s.setBudgetLimit)
  const { advice, loading, iaAtiva, refresh } = useFinanceCoach({
    monthTransactions,
    enabled: true,
  })

  if (!advice) return null

  const shell = TONE_SHELL[advice.tone]

  const handleApplyLimit = async (suggestion: FinanceCoachAdvice['limitSuggestions'][0]) =>
  {
    await setBudgetLimit(
      suggestion.categoriaNome,
      suggestion.valorSugerido,
      suggestion.categoriaId,
    )
  }

  return (
    <article className={`rounded-sl border border-line border-l-[3px] ${shell.accent} bg-card p-3 sm:p-4`}>
      <div className="flex items-start gap-3">
        <div className={`shrink-0 w-8 h-8 rounded-sl border flex items-center justify-center ${shell.badge}`}>
          <Sparkles size={14} strokeWidth={1.75} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={`font-mono text-[9px] uppercase tracking-[0.12em] ${AXEL_TEXT_SECONDARY}`}>
                Axel
                {iaAtiva ? (
                  <span className="ml-1.5 text-accent">· IA</span>
                ) : (
                  <span className="ml-1.5">· local</span>
                )}
              </p>
              <p className={`text-sm font-display mt-0.5 break-words ${AXEL_TEXT_PRIMARY}`}>
                {advice.headline}
              </p>
            </div>
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="shrink-0 p-1.5 rounded-sl border border-line text-ink-muted hover:bg-chrome transition-colors disabled:opacity-40"
              aria-label="Atualizar conselho"
              title="Atualizar conselho"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <p className={`text-[12px] mt-1.5 leading-relaxed break-words ${AXEL_TEXT_SECONDARY}`}>
            {advice.detail}
          </p>

          {advice.limiteDiarioSugerido != null && advice.limiteDiarioSugerido > 0 && (
            <p className="mt-2 font-mono text-[10px] tabular-nums text-ink-muted">
              Teto hoje: até {fmt(advice.limiteDiarioSugerido)}/dia
            </p>
          )}
        </div>
      </div>

      {advice.limitSuggestions.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
          {advice.limitSuggestions.map((s) => (
            <li
              key={`${s.categoriaId}-${s.valorSugerido}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-sl border border-line/60 bg-chrome/20 px-2.5 py-2"
            >
              <div className="min-w-0">
                <p className={`text-[11px] font-medium truncate ${AXEL_TEXT_PRIMARY}`}>
                  {s.categoriaNome}
                </p>
                <p className={`text-[9px] font-mono ${AXEL_TEXT_SECONDARY}`}>
                  {fmt(s.valorSugerido)} · {s.motivo}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleApplyLimit(s)}
                className="shrink-0 font-mono text-[9px] uppercase px-2 py-1 rounded-sl border border-line text-ink-muted hover:border-accent/40 hover:text-accent transition-colors"
              >
                Aplicar
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-line">
        <button
          type="button"
          onClick={onSetLimits}
          className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 font-mono text-[10px] uppercase transition-colors ${AXEL_BTN_PRIMARY}`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          Limites
        </button>
        {onConfigure && (
          <button
            type="button"
            onClick={onConfigure}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 font-mono text-[10px] uppercase rounded-sl border border-line text-ink-muted hover:bg-chrome transition-colors"
          >
            <Wallet className="w-3.5 h-3.5" />
            Conta e cartões
          </button>
        )}
      </div>
    </article>
  )
}
