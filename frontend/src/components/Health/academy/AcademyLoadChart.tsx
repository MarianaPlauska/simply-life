import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import type { AcademyChartPoint } from '../../lib/academyWorkouts'

interface AcademyLoadChartProps
{
  dados: AcademyChartPoint[]
  exercicioNome: string
}

export function AcademyLoadChart({ dados, exercicioNome }: AcademyLoadChartProps)
{
  if (dados.length < 2)
  {
    return (
      <p className="text-[11px] text-ink-muted py-2">
        Registre mais séries de {exercicioNome} para ver a evolução de carga.
      </p>
    )
  }

  return (
    <div className="h-36 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,113,108,0.15)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: 'var(--sl-text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fill: 'var(--sl-text-muted)' }}
            axisLine={false}
            tickLine={false}
            unit=" kg"
          />
          <Tooltip
            contentStyle={{
              background: 'var(--sl-elevated)',
              border: '1px solid var(--sl-border)',
              borderRadius: 8,
              fontSize: 11,
            }}
            formatter={(value: number, _name, item) =>
            {
              const reps = (item.payload as AcademyChartPoint).reps
              return [`${value} kg × ${reps} reps`, 'Carga']
            }}
          />
          <Line
            type="monotone"
            dataKey="peso_kg"
            stroke="var(--sl-accent)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--sl-accent)' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
