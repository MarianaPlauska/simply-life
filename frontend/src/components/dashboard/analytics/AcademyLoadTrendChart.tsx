import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { useAxelChartTheme } from '../../../hooks/useAxelChartTheme'
import { AXEL_TEXT_SECONDARY } from '../../../constants/axelSurfaces'
import type { AcademyLoadTrendPoint } from '../../../lib/academyAnalytics'

interface AcademyLoadTrendChartProps
{
  series: Record<string, AcademyLoadTrendPoint[]>
  exercicioId: string
  exercicioNome: string
}

export function AcademyLoadTrendChart({ series, exercicioId, exercicioNome }: AcademyLoadTrendChartProps)
{
  const theme = useAxelChartTheme()
  const dados = series[exercicioId] ?? []

  if (dados.length < 2)
  {
    return (
      <p className={`text-[12px] py-2 ${AXEL_TEXT_SECONDARY}`}>
        Registre mais sessões com séries para ver a evolução de carga.
      </p>
    )
  }

  return (
    <div className="h-40 w-full">
      <p className="text-[12px] font-medium text-ink mb-2 truncate">{exercicioNome}</p>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid {...theme.grid} />
          <XAxis dataKey="label" {...theme.axis} />
          <YAxis {...theme.axis} unit=" kg" width={36} />
          <Tooltip
            contentStyle={{
              background: 'var(--sl-elevated)',
              border: '1px solid var(--sl-border)',
              borderRadius: 8,
              fontSize: 11,
            }}
            formatter={(value, _name, item) =>
            {
              const reps = (item.payload as AcademyLoadTrendPoint).reps
              const kg = typeof value === 'number' ? value : Number(value ?? 0)
              return [`${kg} kg × ${reps} reps`, 'Carga máx.']
            }}
          />
          <Line
            type="monotone"
            dataKey="peso_kg"
            stroke="var(--sl-accent)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--sl-accent)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
