import { Calendar, Check, Clock } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { AXEL_CHROME_PLANE } from '../../constants/axelSurfaces'
import { cleanTitleForDisplay } from './axelKanbanUtils'

// Rastro de conquistas — faixa inferior editorial

function fmtDate(iso: string | undefined): string
{
  if (!iso) return '—'
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function fmtRelative(iso: string): string
{
  const done = new Date(iso)
  const diffMs = Date.now() - done.getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 60) return `${Math.max(1, mins)}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return fmtDate(iso)
}

export function AxelAchievementTrail()
{
  const entries = useTaskStore((s) => s.recentAchievements)

  if (entries.length === 0)
  {
    return null
  }

  return (
    <section
      className={`shrink-0 border-t border-line ${AXEL_CHROME_PLANE}`}
      aria-label="Concluídas recentemente"
    >
      <div className="px-5 lg:px-7 py-3 max-w-[1680px] mx-auto w-full">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Concluídas recentemente
          </h2>
          <span className="font-mono text-[10px] text-ink-muted tabular-nums">
            {entries.length}
          </span>
        </div>

        <ul className="flex flex-col w-full divide-y divide-line/50">
          {entries.map((entry) =>
          {
            const title = cleanTitleForDisplay(entry.titulo)
            const created = fmtDate(entry.createdAt ?? entry.completedAt)
            const completed = fmtDate(entry.completedAt)

            return (
              <li key={entry.id}>
                <article
                  className="achievement-pop-in w-full flex flex-col gap-0.5 py-2"
                  title={`${title} · criada ${created} · concluída ${completed}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Check size={12} strokeWidth={2} className="text-concluido shrink-0" aria-hidden />
                    <p className="text-[12px] font-medium text-ink leading-snug truncate flex-1 min-w-0">
                      {title}
                    </p>
                    <span className="font-mono text-[10px] tabular-nums text-concluido shrink-0 inline-flex items-center gap-0.5">
                      <Clock size={9} aria-hidden />
                      {fmtRelative(entry.completedAt)}
                    </span>
                  </div>
                  <p className="font-mono text-[9px] text-ink-muted pl-5 truncate">
                    <Calendar size={9} className="inline shrink-0 opacity-70 mr-0.5 -mt-px" aria-hidden />
                    Criada {created}
                    <span className="mx-1 text-line">·</span>
                    <Check size={9} className="inline shrink-0 text-concluido/90 mr-0.5 -mt-px" aria-hidden />
                    Concluída {completed}
                    <span className="mx-1 text-line">·</span>
                    {entry.focusMinutes} min de foco
                  </p>
                </article>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
