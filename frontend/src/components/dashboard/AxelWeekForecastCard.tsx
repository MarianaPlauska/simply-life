import { useMemo } from 'react'
import { TrendingUp } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import {
  AXEL_FORECAST_UNLOCK_LEVEL,
  buildAxelWeekForecast,
} from '../../lib/axelWeekForecast'
import { computeGamificationProfile } from '../../lib/gamificationProfile'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

const MOOD_DOT = {
  leve: 'bg-concluido',
  neutro: 'bg-accent',
  pesado: 'bg-urgente',
} as const

export function AxelWeekForecastCard()
{
  const transactions = useTaskStore((s) => s.transactions)
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const billSettlements = useTaskStore((s) => s.billSettlements)
  const cards = useTaskStore((s) => s.cards)
  const humorSemanaAgregado = useTaskStore((s) => s.humorSemanaAgregado)
  const userStats = useTaskStore((s) => s.userStats)

  const level = computeGamificationProfile(userStats).level

  const forecast = useMemo(
    () => buildAxelWeekForecast({
      transactions,
      contasFixas,
      reservedBills,
      billSettlements,
      cards,
      humorSemana: humorSemanaAgregado,
    }),
    [transactions, contasFixas, reservedBills, billSettlements, cards, humorSemanaAgregado],
  )

  if (level < AXEL_FORECAST_UNLOCK_LEVEL)
  {
    return null
  }

  return (
    <section className={`${AXEL_BORDERLESS_PANEL} p-2.5 sm:p-3`} aria-label="Previsão 7 dias">
      <div className="flex items-center gap-2 mb-1.5">
        <TrendingUp className="w-3.5 h-3.5 text-accent shrink-0" />
        <p className="font-mono text-[9px] uppercase tracking-wide text-accent">
          Previsão 7 dias
        </p>
      </div>

      <p className={`text-[12px] leading-relaxed ${AXEL_TEXT_PRIMARY}`}>
        {forecast.headline}
      </p>

      <div className="mt-2.5 flex gap-1 overflow-x-auto scrollbar-none pb-0.5">
        {forecast.days.map((day) => (
          <div
            key={day.iso}
            className="shrink-0 min-w-[4.5rem] rounded-sl border border-line bg-chrome/40 px-2 py-1.5"
            title={day.axelLine}
          >
            <div className="flex items-center justify-between gap-1">
              <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
                {day.label}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${MOOD_DOT[day.moodHint]}`} />
            </div>
            {day.billCount > 0 ? (
              <p className="text-[10px] font-mono tabular-nums text-ink mt-0.5">
                {day.billsTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </p>
            ) : (
              <p className={`text-[9px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>—</p>
            )}
          </div>
        ))}
      </div>

      <p className={`text-[10px] mt-2 font-mono ${AXEL_TEXT_SECONDARY}`}>
        Humor {forecast.moodTrend} · média gasto/dia ~
        {forecast.avgDailySpend.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
      </p>
    </section>
  )
}
