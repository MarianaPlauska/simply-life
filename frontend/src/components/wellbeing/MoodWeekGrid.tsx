import type { DiaHumorAgregado } from '../../lib/moodInsights'
import { MOODS } from '../../lib/moodConstants'

interface MoodWeekGridProps
{
  dias: DiaHumorAgregado[]
}

function last7Iso(): string[]
{
  const out: string[] = []
  for (let i = 6; i >= 0; i--)
  {
    const d = new Date()
    d.setDate(d.getDate() - i)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

function shortWeekday(iso: string): string
{
  return new Date(`${iso}T12:00:00`)
    .toLocaleDateString('pt-BR', { weekday: 'narrow' })
    .replace('.', '')
    .toUpperCase()
}

/** Últimos 7 dias - ícones de humor (melhor que barra única) */
export function MoodWeekGrid({ dias }: MoodWeekGridProps)
{
  const byDate = new Map(dias.map((d) => [d.data, d]))
  const week = last7Iso()

  return (
    <div className="flex justify-between gap-1">
      {week.map((iso) =>
      {
        const row = byDate.get(iso)
        const level = row ? Math.round(row.humor) : null
        const mood = level ? MOODS.find((m) => m.value === level) : null
        const Icon = mood?.icon
        return (
          <div key={iso} className="flex flex-col items-center gap-1 min-w-0 flex-1">
            <span className="font-mono text-[9px] uppercase text-ink-muted">{shortWeekday(iso)}</span>
            <div
              className={`w-9 h-9 rounded-sl border flex items-center justify-center ${
                mood ? mood.colorClass : 'border-line bg-chrome/50'
              }`}
              title={mood ? mood.label : 'Sem registro'}
            >
              {Icon ? <Icon size={16} strokeWidth={1.75} /> : <span className="w-1.5 h-1.5 rounded-full bg-line" />}
            </div>
          </div>
        )
      })}
    </div>
  )
}
