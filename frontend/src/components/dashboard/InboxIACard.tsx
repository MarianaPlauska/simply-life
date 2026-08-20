import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Mail, MessageSquare, Calendar as CalIcon } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_LINK,
  AXEL_ROW_HOVER,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

function timeAgo(iso: string | null | undefined): string
{
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function iconFor(source: string | null | undefined)
{
  if (source === 'gmail') return Mail
  if (source === 'teams' || source === 'whatsapp') return MessageSquare
  if (source === 'calendar') return CalIcon
  return Mail
}

export function InboxIACard({ embedded = false }: { embedded?: boolean })
{
  const navigate = useNavigate()
  const eventos = useTaskStore((s) => s.inboxEvents)
  const fetchInbox = useTaskStore((s) => s.fetchInbox)

  useEffect(() =>
  {
    fetchInbox?.()
  }, [fetchInbox])

  const { top, restCount, total } = useMemo(() =>
  {
    const all = eventos || []
    return {
      top: all[0] ?? null,
      restCount: Math.max(0, all.length - 1),
      total: all.length,
    }
  }, [eventos])

  return (
    <section className={`${embedded ? '' : AXEL_BORDERLESS_PANEL} flex flex-col h-full p-0 overflow-hidden`}>
      {embedded ? (
        <p className="text-[13px] font-medium text-ink-muted">Inbox</p>
      ) : (
        <header className="px-4 pt-4 pb-3 border-b border-line flex items-center justify-between gap-2">
          <div>
            <p className={AXEL_SECTION_TITLE}>Inteligência</p>
            <p className={`font-mono text-[11px] mt-1 ${AXEL_TEXT_SECONDARY}`}>Inbox triado · tempo real</p>
          </div>
          <span className="font-mono text-[11px] text-accent tabular-nums">{total}</span>
        </header>
      )}

      <div className="flex-1 min-h-0 flex flex-col">
        {!top && (
          <p className={`py-3 text-[13px] flex-1 ${AXEL_TEXT_SECONDARY}`}>
            Fila vazia — aguardando ingestão
          </p>
        )}
        {top && (
          <div
            className={`${embedded ? 'py-3' : 'px-4 py-3'} flex items-start gap-2.5 cursor-pointer flex-1 ${AXEL_ROW_HOVER}`}
            onClick={() => navigate('/inteligencia')}
            onKeyDown={(ev) => ev.key === 'Enter' && navigate('/inteligencia')}
            role="button"
            tabIndex={0}
          >
            {(() =>
            {
              const Icon = iconFor(top.source)
              const urgente = (top.score_urgencia ?? 0) >= 80
              return (
                <>
                  <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${AXEL_TEXT_SECONDARY}`} strokeWidth={1.75} />
                  <div className="flex-1 min-w-0">
                    <div className={`font-mono text-[11px] truncate ${AXEL_TEXT_SECONDARY}`}>
                      {top.sender || top.source}
                    </div>
                    <div className={`text-[13px] font-medium line-clamp-2 mt-0.5 ${AXEL_TEXT_PRIMARY}`}>
                      {top.raw_subject || top.resumo || 'Sem título'}
                    </div>
                    {restCount > 0 && (
                      <p className={`font-mono text-[11px] mt-2 ${AXEL_TEXT_SECONDARY}`}>
                        +{restCount} na fila
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`font-mono text-[12px] tabular-nums block ${urgente ? 'text-urgente' : AXEL_TEXT_PRIMARY}`}>
                      {top.score_urgencia ?? '—'}
                    </span>
                    <span className={`font-mono text-[10px] ${AXEL_TEXT_SECONDARY}`}>
                      {timeAgo(top.created_at)}
                    </span>
                  </div>
                </>
              )
            })()}
          </div>
        )}
      </div>

      <div className="pt-2 flex">
        <button
          type="button"
          onClick={() => navigate('/inteligencia')}
          className={`inline-flex items-center gap-1 text-[13px] ${AXEL_LINK}`}
        >
          {total > 0 ? `Ver inbox (${total})` : 'Abrir inbox'}
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </section>
  )
}
