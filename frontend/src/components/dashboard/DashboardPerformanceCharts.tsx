import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, ArrowRight } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { buildWeekPerformanceSeries } from '../../lib/dashboardChartData'
import { useAxelChartTheme } from '../../hooks/useAxelChartTheme'
import { AxelChartTooltip, axelChartCursorFill, CHART_HEIGHT } from './analytics/axelChartConfig'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'
import { ChartSizeBox } from './ChartSizeBox'

// Gráficos de desempenho — humor e produtividade (7 dias)

export function DashboardPerformanceCharts()
{
  const navigate = useNavigate()
  const humorSemanaAgregado = useTaskStore((s) => s.humorSemanaAgregado)
  const tarefas = useTaskStore((s) => s.tarefas)
  const theme = useAxelChartTheme()

  const week = useMemo(
    () => buildWeekPerformanceSeries(humorSemanaAgregado, tarefas),
    [humorSemanaAgregado, tarefas],
  )

  const moodChart = week.map((d) => ({
    label: d.label,
    humor: d.humor ?? 0,
    vazio: d.humor == null,
  }))

  const taskChart = week.map((d) => ({
    label: d.label,
    concluidas: d.tarefas,
  }))

  const hasMood = week.some((d) => d.humor != null)
  const hasTasks = week.some((d) => d.tarefas > 0)
  const chartHeight = CHART_HEIGHT - 40

  return (
    <div className="space-y-3 pt-2 border-t border-line lg:col-span-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent flex items-center gap-1">
            <BarChart3 size={12} />
            Gráficos
          </p>
          <h3 className={`font-display text-lg mt-0.5 ${AXEL_TEXT_PRIMARY}`}>
            Desempenho · 7 dias
          </h3>
          <p className={`text-[12px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
            Humor e tarefas concluídas — visão rápida do seu ritmo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/relatorios')}
          className="shrink-0 inline-flex items-center gap-1 font-mono text-[10px] uppercase text-ink-muted hover:text-accent pt-1"
        >
          Relatórios
          <ArrowRight size={12} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <article className="rounded-sl border border-line p-3 bg-card h-full flex flex-col">
          <p className="text-[13px] font-medium text-ink mb-2">Humor (1–5)</p>
          <ChartSizeBox className="flex-1" minHeight={chartHeight}>
            {(w, h) => (
              hasMood ? (
                <BarChart width={w} height={h} data={moodChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid {...theme.grid} />
                  <XAxis dataKey="label" {...theme.axis} />
                  <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} {...theme.axis} width={28} />
                  <Tooltip content={<AxelChartTooltip />} cursor={{ fill: axelChartCursorFill(theme.isDarkMode) }} />
                  <Bar dataKey="humor" name="Humor" radius={[2, 2, 0, 0]} maxBarSize={32}>
                    {moodChart.map((row) => (
                      <Cell
                        key={row.label}
                        fill={row.vazio ? theme.grid.stroke : theme.accent}
                        opacity={row.vazio ? 0.25 : 1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <p className={`h-full flex items-center justify-center text-[12px] ${AXEL_TEXT_SECONDARY}`}>
                  Registre humor para ver o gráfico.
                </p>
              )
            )}
          </ChartSizeBox>
        </article>

        <article className="rounded-sl border border-line p-3 bg-card h-full flex flex-col">
          <p className="text-[13px] font-medium text-ink mb-2">Tarefas concluídas</p>
          <ChartSizeBox className="flex-1" minHeight={chartHeight}>
            {(w, h) => (
              hasTasks ? (
                <BarChart width={w} height={h} data={taskChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid {...theme.grid} />
                  <XAxis dataKey="label" {...theme.axis} />
                  <YAxis allowDecimals={false} {...theme.axis} width={28} />
                  <Tooltip content={<AxelChartTooltip />} cursor={{ fill: axelChartCursorFill(theme.isDarkMode) }} />
                  <Bar
                    dataKey="concluidas"
                    name="Concluídas"
                    fill={theme.waterBar}
                    radius={[2, 2, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              ) : (
                <p className={`h-full flex items-center justify-center text-[12px] ${AXEL_TEXT_SECONDARY}`}>
                  Conclua tarefas no Kanban para ver o histórico.
                </p>
              )
            )}
          </ChartSizeBox>
        </article>
      </div>
    </div>
  )
}
