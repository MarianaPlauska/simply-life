import { useMemo, useState } from 'react'
import { Beef, Droplets, Dumbbell, ListChecks } from 'lucide-react'
import {
  ANALYTICS_BY_TIMEFRAME,
  ANALYTICS_TIMEFRAME_LABELS,
  type AnalyticsTimeframe,
} from '../../data/analyticsMockData'
import {
  AXEL_ANALYTICS_CARD,
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_FILTER_PILL_IDLE,
  AXEL_SECTION_DIVIDER,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import { ProteinAreaChart } from './analytics/ProteinAreaChart'
import { WaterBarChart } from './analytics/WaterBarChart'
import { ExerciseBarChart } from './analytics/ExerciseBarChart'
import { ProductivityLineChart } from './analytics/ProductivityLineChart'

// Visão Holística — hub central com Recharts

interface ChartPanelProps
{
  title: string
  subtitle: string
  Icon: typeof Beef
  iconClass: string
  children: React.ReactNode
}

function ChartPanel({ title, subtitle, Icon, iconClass, children }: ChartPanelProps)
{
  return (
    <article className={`${AXEL_ANALYTICS_CARD} flex flex-col`}>
      <div className="flex items-start gap-2.5 mb-3 shrink-0">
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconClass}`} strokeWidth={1.75} />
        <div className="min-w-0">
          <h3 className={`text-[13px] font-semibold ${AXEL_TEXT_PRIMARY}`}>
            {title}
          </h3>
          <p className={`text-[11px] font-mono mt-0.5 ${AXEL_TEXT_SECONDARY}`}>{subtitle}</p>
        </div>
      </div>
      {children}
    </article>
  )
}

export function HolisticAnalyticsSection({ borderless = false }: { borderless?: boolean })
{
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('1W')
  const bundle = useMemo(() => ANALYTICS_BY_TIMEFRAME[timeframe], [timeframe])

  return (
    <section
      aria-labelledby="holistic-analytics-title"
      className={`flex-1 flex flex-col min-h-0 ${borderless ? '' : AXEL_SECTION_DIVIDER}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-4 shrink-0 pt-2 border-t border-line">
        <div>
          <p className={AXEL_SECTION_TITLE}>
            <span className="text-accent mr-2">04</span>
            Analytics
          </p>
          <h2 id="holistic-analytics-title" className={`text-xl font-display mt-1 ${AXEL_TEXT_PRIMARY}`}>
            Visão holística
          </h2>
          <p className={`font-mono text-[11px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
            Saúde · hidratação · exercício · produtividade
          </p>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtro temporal">
          {ANALYTICS_TIMEFRAME_LABELS.map(({ id, label }) =>
          {
            const active = timeframe === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTimeframe(id)}
                className={active ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE}
                aria-pressed={active}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        <ChartPanel
          title="Alimentação"
          subtitle="Proteína diária · meta 100g"
          Icon={Beef}
          iconClass="text-atencao"
        >
          <ProteinAreaChart
            rows={bundle.rows}
            meta={bundle.proteinMeta}
            eggsToday={bundle.eggsToday}
            eggMax={bundle.eggMax}
          />
        </ChartPanel>

        <ChartPanel
          title="Hidratação"
          subtitle="Consumo em litros por período"
          Icon={Droplets}
          iconClass="text-accent"
        >
          <WaterBarChart rows={bundle.rows} />
        </ChartPanel>

        <ChartPanel
          title="Exercícios"
          subtitle="Modo Academia · minutos de esforço"
          Icon={Dumbbell}
          iconClass="text-concluido"
        >
          <ExerciseBarChart
            rows={bundle.rows}
            consistencyPct={bundle.exerciseConsistencyPct}
          />
        </ChartPanel>

        <ChartPanel
          title="Produtividade"
          subtitle="Conclusão vs fila de execução"
          Icon={ListChecks}
          iconClass="text-ink-muted"
        >
          <ProductivityLineChart
            rows={bundle.rows}
            orchestrationScore={bundle.orchestrationScore}
          />
        </ChartPanel>
      </div>
    </section>
  )
}
