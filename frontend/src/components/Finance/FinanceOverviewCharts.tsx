import {
  BarChart3,
  Wallet,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  AXEL_BTN_MD,
  AXEL_BTN_PRIMARY,
  AXEL_METRIC_HAIRLINE,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import { FINANCE_CATEGORY_ICONS } from './financeCategoryIcons'
import { useFinanceChartTheme } from '../../lib/financeChartTheme'
import type { Category } from '../../store/storeTypes'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const ChartTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string }>
  label?: string
}) =>
{
  if (!active || !payload?.length) return null

  return (
    <div className="bg-card border border-line rounded-sl px-3 py-2 shadow-lg text-[11px]">
      <p className={`mb-1 ${AXEL_TEXT_SECONDARY}`}>{label}</p>
      {payload.map((p) => (
        <p
          key={p.dataKey}
          className={`font-mono font-medium ${
            p.dataKey === 'receita' ? 'text-concluido' : 'text-urgente'
          }`}
        >
          {p.dataKey === 'receita' ? 'Receita' : 'Gastos'}: {fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

interface FinanceOverviewChartsProps
{
  saldo: number
  diffDespesas: number
  diffDespesasPct: number
  biggestCategory: Category | null
  categoryTotals: { id: number; total: number }[]
  pieChartData: { name: string; value: number; color: string }[]
  areaChartData: { mes: string; receita: number; gastos: number }[]
  onViewGoals: () => void
}

export function FinanceOverviewCharts({
  saldo,
  diffDespesas,
  diffDespesasPct,
  biggestCategory,
  categoryTotals,
  pieChartData,
  areaChartData,
  onViewGoals,
}: FinanceOverviewChartsProps)
{
  const chart = useFinanceChartTheme()

  const BigIcon = biggestCategory
    ? (FINANCE_CATEGORY_ICONS[biggestCategory.icone] ?? Wallet)
    : Wallet

  return (
    <>
      <div className="flex flex-col gap-4">
        <section className={AXEL_METRIC_HAIRLINE}>
          <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
            <div>
              <h2 className={AXEL_SECTION_TITLE}>Resumo do mês</h2>
              <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
                Comparação rápida e distribuição por categoria
              </p>
            </div>
            <BarChart3 className={`w-4 h-4 ${AXEL_TEXT_SECONDARY}`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-5">
              <div>
                <p className={AXEL_SECTION_TITLE}>Gasto vs mês anterior</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className={`text-xl font-display tabular-nums ${
                    diffDespesas <= 0 ? 'text-concluido' : 'text-urgente'
                  }`}
                  >
                    {diffDespesas > 0 ? '+' : ''}{fmt(diffDespesas)}
                  </p>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sl ${
                    diffDespesas <= 0
                      ? 'bg-concluido/10 text-concluido'
                      : 'bg-urgente/10 text-urgente'
                  }`}
                  >
                    {diffDespesasPct > 0 ? '+' : ''}{diffDespesasPct.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div>
                <p className={AXEL_SECTION_TITLE}>Maior categoria</p>
                {biggestCategory ? (
                  <div className="flex items-center gap-2.5 mt-2">
                    <div
                      className="w-8 h-8 rounded-sl flex items-center justify-center border border-line bg-chrome"
                      style={{ color: biggestCategory.cor }}
                    >
                      <BigIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[13px] font-medium truncate ${AXEL_TEXT_PRIMARY}`}>
                        {biggestCategory.nome}
                      </p>
                      <p className={`text-[11px] font-mono ${AXEL_TEXT_SECONDARY}`}>
                        {fmt(categoryTotals[0]?.total ?? 0)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className={`text-[12px] mt-2 ${AXEL_TEXT_SECONDARY}`}>
                    Nenhum gasto registrado
                  </p>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="w-full h-40">
                {pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        innerRadius={48}
                        outerRadius={68}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: chart.card,
                          border: `1px solid ${chart.line}`,
                          borderRadius: '4px',
                          fontSize: '11px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={`h-full flex items-center justify-center text-[12px] ${AXEL_TEXT_SECONDARY}`}>
                    Sem dados para o gráfico
                  </div>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {pieChartData.slice(0, 4).map((entry, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className={`text-[10px] font-mono ${AXEL_TEXT_SECONDARY}`}>{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <aside className={`${AXEL_METRIC_HAIRLINE} relative overflow-hidden flex flex-col justify-between`}>
          <div
            className="absolute inset-0 bg-gradient-to-br from-axel/10 via-transparent to-chrome/30 pointer-events-none"
            aria-hidden
          />
          <div className="relative space-y-4">
            <div className="w-8 h-8 rounded-sl bg-axel-muted border border-axel/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-axel" />
            </div>
            <div>
              <h3 className={`text-[12px] font-mono uppercase tracking-wide ${AXEL_TEXT_PRIMARY}`}>
                Insight AXEL
              </h3>
              <p className={`text-[11px] mt-2 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
                {saldo > 0
                  ? 'Saldo positivo no mês. Considere direcionar o excedente para metas ou reserva de emergência.'
                  : 'Saldo negativo - revise despesas em categorias de desejo e ajuste o orçamento do próximo mês.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onViewGoals}
            className={`relative mt-5 self-start ${AXEL_BTN_MD} ${AXEL_BTN_PRIMARY} gap-1.5`}
          >
            Ver metas
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </aside>
      </div>

      <section className={`${AXEL_METRIC_HAIRLINE} mt-3`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className={AXEL_SECTION_TITLE}>Evolução financeira</h2>
            <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
              Receita vs gastos - últimos 6 meses
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`flex items-center gap-1.5 text-[10px] font-mono ${AXEL_TEXT_SECONDARY}`}>
              <span className="w-2 h-2 rounded-full bg-concluido" />
              Receita
            </span>
            <span className={`flex items-center gap-1.5 text-[10px] font-mono ${AXEL_TEXT_SECONDARY}`}>
              <span className="w-2 h-2 rounded-full bg-urgente" />
              Gastos
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={areaChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
            <XAxis
              dataKey="mes"
              axisLine={false}
              tickLine={false}
              tick={{ fill: chart.tick, fontSize: 10 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: chart.tick, fontSize: 10 }}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
              width={32}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="receita"
              stroke={chart.receita}
              strokeWidth={1.5}
              fill={chart.receita}
              fillOpacity={0.12}
            />
            <Area
              type="monotone"
              dataKey="gastos"
              stroke={chart.despesa}
              strokeWidth={1.5}
              fill={chart.despesa}
              fillOpacity={0.1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </section>
    </>
  )
}
