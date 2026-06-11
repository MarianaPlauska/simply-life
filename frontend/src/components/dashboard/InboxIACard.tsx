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

export function InboxIACard()
{
  const navigate = useNavigate()
  const eventos = useTaskStore((s) => s.inboxEvents)
  const fetchInbox = useTaskStore((s) => s.fetchInbox)

  useEffect(() =>
  {
    fetchInbox?.()
  }, [fetchInbox])

  const items = useMemo(() => (eventos || []).slice(0, 5), [eventos])

  return (
    <section className={`${AXEL_BORDERLESS_PANEL} flex flex-col h-full p-0 overflow-hidden`}>
      <header className="px-4 pt-4 pb-3 border-b border-line flex items-center justify-between gap-2">
        <div>
          <p className={AXEL_SECTION_TITLE}>Inteligência</p>
          <p className={`font-mono text-[10px] mt-1 ${AXEL_TEXT_SECONDARY}`}>Inbox triado · tempo real</p>
        </div>
        <span className="font-mono text-[10px] text-accent tabular-nums">{items.length}</span>
      </header>

      <ul role="list" className="flex-1 divide-y divide-line min-h-[140px]">
        {items.length === 0 && (
          <li className={`px-4 py-8 text-center font-mono text-[11px] ${AXEL_TEXT_SECONDARY}`}>
            Fila vazia — aguardando ingestão
          </li>
        )}
        {items.map((e) =>
        {
          const Icon = iconFor(e.source)
          const urgente = (e.score_urgencia ?? 0) >= 80
          return (
            <li
              key={e.id}
              className={`px-4 py-2.5 flex items-center gap-2.5 cursor-pointer ${AXEL_ROW_HOVER}`}
              onClick={() => navigate('/inteligencia')}
              onKeyDown={(ev) => ev.key === 'Enter' && navigate('/inteligencia')}
              role="button"
              tabIndex={0}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${AXEL_TEXT_SECONDARY}`} strokeWidth={1.75} />
              <div className="flex-1 min-w-0">
                <div className={`font-mono text-[10px] truncate ${AXEL_TEXT_SECONDARY}`}>
                  {e.sender || e.source}
                </div>
                <div className={`text-[12px] font-medium truncate ${AXEL_TEXT_PRIMARY}`}>
                  {e.raw_subject || e.resumo || 'Sem título'}
                </div>
              </div>
              <span className={`font-mono text-[11px] tabular-nums shrink-0 ${urgente ? 'text-urgente' : AXEL_TEXT_PRIMARY}`}>
                {e.score_urgencia ?? '—'}
              </span>
              <span className={`font-mono text-[9px] shrink-0 w-6 text-right ${AXEL_TEXT_SECONDARY}`}>
                {timeAgo(e.created_at)}
              </span>
            </li>
          )
        })}
      </ul>

      <div className={`px-4 py-2.5 border-t border-line flex justify-center`}>
        <button
          type="button"
          onClick={() => navigate('/inteligencia')}
          className={`inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide ${AXEL_LINK}`}
        >
          Abrir inbox
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </section>
  )
}
