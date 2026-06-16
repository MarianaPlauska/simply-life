import { MOOD_HEX, moodLabel } from '../../lib/moodConstants'
import type { HumorRegistro } from '../../store/slices/bemEstarSlice'

interface MoodDayTimelineProps
{
  entries: HumorRegistro[]
}

function formatTime(iso?: string): string
{
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function MoodDayTimeline({ entries }: MoodDayTimelineProps)
{
  if (entries.length === 0) return null

  return (
    <div className="pt-3 border-t border-line">
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-muted mb-2">
        Hoje · {entries.length} {entries.length === 1 ? 'momento' : 'momentos'}
      </p>
      <div className="flex flex-wrap gap-2">
        {entries.map((e) => (
          <div
            key={e.id}
            className="inline-flex items-center gap-2 px-2 py-1 rounded-sl border border-line bg-chrome/50"
            title={e.nota || undefined}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: MOOD_HEX[e.humor] || '#71717a' }}
            />
            <span className="text-[11px] text-ink">{moodLabel(e.humor)}</span>
            <span className="font-mono text-[10px] text-ink-muted">{formatTime(e.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
