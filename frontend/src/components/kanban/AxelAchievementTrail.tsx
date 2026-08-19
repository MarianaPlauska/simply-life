import { useMemo, useState } from 'react'
import { Calendar, Check, Clock, Search } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { AXEL_CHROME_PLANE } from '../../constants/axelSurfaces'
import { cleanTitleForDisplay } from './axelKanbanUtils'
import { billTaskReferenceKey, settlementCanonicalKey } from '../../lib/financeBillTaskDedup'

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
  const [query, setQuery] = useState('')

  const deduped = useMemo(() =>
  {
    const seen = new Set<string>()
    const out: typeof entries = []

    for (const entry of entries)
    {
      const titleKey = cleanTitleForDisplay(entry.titulo).toLowerCase()
      const completedDay = entry.completedAt?.slice(0, 10) ?? ''
      const refKey = billTaskReferenceKey({
        id: entry.taskId,
        titulo: entry.titulo,
        status: 'concluida',
      } as never)
      const key = refKey
        ?? settlementCanonicalKey({ titulo: entry.titulo, valor: 0 })
        ?? `${titleKey}|${completedDay}`

      if (seen.has(key)) continue
      seen.add(key)
      out.push(entry)
    }

    return out
  }, [entries])

  const filtered = useMemo(() =>
  {
    const q = query.trim().toLowerCase()
    if (!q) return deduped
    return deduped.filter((entry) =>
      cleanTitleForDisplay(entry.titulo).toLowerCase().includes(q),
    )
  }, [deduped, query])

  if (deduped.length === 0)
  {
    return null
  }

  return (
    <section
      className={`shrink-0 border-t border-line ${AXEL_CHROME_PLANE}`}
      aria-label="Concluídas recentemente"
    >
      <div className="px-5 lg:px-7 py-3 max-w-[1680px] mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
          <div className="flex items-center justify-between gap-2 flex-1 min-w-0">
            <h2 className="text-[13px] font-medium text-ink-muted">
              Concluídas recentemente
            </h2>
            <span className="text-[12px] text-ink-muted tabular-nums">
              {filtered.length}/{deduped.length}
            </span>
          </div>
          <label className="relative sm:max-w-[220px] sm:ml-auto w-full">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar concluída…"
              className="w-full pl-8 pr-3 py-1.5 rounded-sl border border-line bg-card text-[12px] text-ink placeholder:text-ink-muted"
            />
          </label>
        </div>

        <ul className="flex flex-col w-full divide-y divide-line/50 max-h-[min(220px,28dvh)] overflow-y-auto custom-scrollbar pr-0.5">
          {filtered.map((entry) =>
          {
            const title = cleanTitleForDisplay(entry.titulo)
            const created = fmtDate(entry.createdAt ?? entry.completedAt)
            const completed = fmtDate(entry.completedAt)

            return (
              <li key={`${entry.taskId}-${entry.completedAt}`}>
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
