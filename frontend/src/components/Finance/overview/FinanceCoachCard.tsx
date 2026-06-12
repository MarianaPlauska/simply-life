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

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Visual sutil por tom — borda lateral + brilho leve, sem fundo forte */
const TONE_SHELL = {
  ok: {
    accent: 'border-l-concluido',
    glow: 'from-concluido/8 via-transparent to-accent/5',
    badge: 'bg-concluido/12 text-concluido border-concluido/25',
    ring: 'ring-concluido/20',
  },
  caution: {
    accent: 'border-l-atencao',
    glow: 'from-atencao/10 via-transparent to-accent/5',
    badge: 'bg-atencao/12 text-atencao border-atencao/25',
    ring: 'ring-atencao/20',
  },
  urgent: {
    accent: 'border-l-urgente',
    glow: 'from-urgente/10 via-transparent to-accent/5',
    badge: 'bg-urgente/12 text-urgente border-urgente/25',
    ring: 'ring-urgente/25',
  },
} as const

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
    <article
      className={`relative overflow-hidden rounded-sl border border-line border-l-[3px] ${shell.accent} bg-card shadow-sm transition-shadow duration-300 hover:shadow-md`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${shell.glow} pointer-events-none`}
        aria-hidden
      />
      <div className="relative p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <div
            className={`shrink-0 w-9 h-9 rounded-sl border flex items-center justify-center ${shell.badge} ring-1 ${shell.ring}`}
          >
            <Sparkles size={16} strokeWidth={1.75} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className={`font-mono text-[9px] uppercase tracking-[0.12em] ${AXEL_TEXT_SECONDARY}`}>
                  Axel
                  {iaAtiva && (
                    <span className="ml-1.5 text-accent">· IA ativa</span>
                  )}
                </p>
                <p className={`text-sm sm:text-base font-display mt-0.5 break-words ${AXEL_TEXT_PRIMARY}`}>
                  {advice.headline}
                </p>
              </div>
              <button
                type="button"
                onClick={refresh}
                disabled={loading}
                className="shrink-0 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-sl border border-line/60 bg-chrome/40 text-ink-muted transition-colors hover:border-accent/40 hover:bg-accent/10 hover:text-accent disabled:opacity-40"
                aria-label="Atualizar conselho"
                title="Atualizar conselho"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <p className={`text-[12px] mt-2 leading-relaxed break-words ${AXEL_TEXT_SECONDARY}`}>
              {advice.detail}
            </p>

            {advice.limiteDiarioSugerido != null && advice.limiteDiarioSugerido > 0 && (
              <p className="inline-block mt-2.5 font-mono text-[10px] tabular-nums px-2 py-1 rounded-sl border border-line/70 bg-chrome/50 text-ink">
                Teto hoje: até {fmt(advice.limiteDiarioSugerido)}/dia
              </p>
            )}
          </div>
        </div>

        {advice.limitSuggestions.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {advice.limitSuggestions.map((s) => (
              <li
                key={`${s.categoriaId}-${s.valorSugerido}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-sl border border-line/60 bg-chrome/30 px-2.5 py-2"
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
                  className="shrink-0 font-mono text-[9px] uppercase px-2.5 py-1.5 min-h-[40px] rounded-sl border border-accent/35 bg-accent/10 text-accent transition-colors hover:bg-accent hover:text-white active:bg-accent-hover"
                >
                  Aplicar
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-line/60">
          <button
            type="button"
            onClick={onSetLimits}
            className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 font-mono text-[10px] uppercase transition-colors ${AXEL_BTN_PRIMARY} hover:shadow-md`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            Limites
          </button>
          {onConfigure && (
            <button
              type="button"
              onClick={onConfigure}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 font-mono text-[10px] uppercase rounded-sl border border-line bg-accent/8 text-accent transition-colors hover:bg-accent hover:text-white active:bg-accent-hover md:bg-transparent md:text-ink-muted md:hover:bg-chrome md:hover:text-ink"
            >
              <Wallet className="w-3.5 h-3.5" />
              Conta e cartões
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
