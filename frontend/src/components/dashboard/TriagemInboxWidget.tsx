import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, MessageSquare, Sparkles, ChevronRight, CheckCircle2, X, AlertTriangle } from 'lucide-react'
import { useTaskStore, type ActiveView } from '../../store/useTaskStore'

// TriagemInboxWidget — lista densa de eventos processados pela IA
// Sem GlassCard, sem shimmer, sem motion — design "tudo é linha" (§2.4)

export interface UnifiedEvent
{
  id: string
  source: 'gmail' | 'teams' | 'calendar'
  sender: string
  rawSubject: string
  resumo: string
  acaoSugerida: 'responder' | 'fazer' | 'agendar' | 'ignorar'
  scoreUrgencia: number
  keywordsDetectadas: string[]
  timestamp: Date
  processed: boolean
  dismissed: boolean
}

function getSourceIcon(source: string)
{
  if (source === 'gmail') return Mail
  if (source === 'teams') return MessageSquare
  return Mail
}

function getUrgencyColor(score: number)
{
  if (score >= 80) return 'text-red-400'
  if (score >= 50) return 'text-amber-400'
  return 'text-zinc-500'
}

function prioStrip(score: number)
{
  if (score >= 80) return 'border-l-red-500'
  if (score >= 50) return 'border-l-amber-500'
  return 'border-l-zinc-700'
}

function timeAgo(date: Date): string
{
  const mins = Math.round((Date.now() - date.getTime()) / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}

interface TriagemInboxWidgetProps
{
  setActiveView?: (v: ActiveView) => void
}

export function TriagemInboxWidget({ setActiveView: _setActiveView }: TriagemInboxWidgetProps)
{
  const navigate = useNavigate()
  const inboxEvents = useTaskStore((s) => s.inboxEvents)
  const fetchInbox = useTaskStore((s) => s.fetchInbox)
  const dismissEvent = useTaskStore((s) => s.dismissEvent)
  const createTaskFromEvent = useTaskStore((s) => s.createTaskFromEvent)

  useEffect(() =>
  {
    fetchInbox()
  }, [fetchInbox])

  const events = inboxEvents
    .filter((e) => !e.dismissed && !e.processed)
    .sort((a, b) => b.score_urgencia - a.score_urgencia)

  const urgentCount = events.filter((e) => e.score_urgencia >= 80).length

  return (
    <section className="bg-card border border-zinc-900 rounded-md">
      <header className="px-3 py-2 border-b border-zinc-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <h2 className="text-[12px] font-bold text-violet-300 uppercase tracking-widest">Inbox IA</h2>
          <span className="text-[11px] text-zinc-600 font-mono">{events.length} eventos</span>
          {urgentCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
              <AlertTriangle className="w-3 h-3" />
              {urgentCount} urgente{urgentCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/kanban')}
          className="flex items-center gap-1 text-[12px] text-zinc-400 hover:text-white transition-colors"
        >
          Ver todos <ChevronRight className="w-3 h-3" />
        </button>
      </header>

      {events.length === 0 ? (
        <div className="px-3 py-2 text-[12px] text-zinc-500 flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
          IA monitorando — nenhum evento na fila agora.
        </div>
      ) : (
        <ul role="list" className="divide-y divide-zinc-900">
          {events.slice(0, 6).map((event) =>
          {
            const SourceIcon = getSourceIcon(event.source)
            return (
              <li
                key={event.id}
                className={`group flex items-center gap-2 px-3 py-1.5 border-l-2 hover:bg-zinc-900/40 transition-colors ${prioStrip(event.score_urgencia)}`}
              >
                <SourceIcon className={`w-3.5 h-3.5 shrink-0 ${getUrgencyColor(event.score_urgencia)}`} />
                <span className="text-[12px] text-zinc-400 shrink-0 truncate max-w-[110px]">{event.sender}</span>
                <span className="flex-1 min-w-0 text-[13px] text-zinc-200 truncate">
                  {event.resumo || event.raw_subject}
                </span>
                {(event.keywords_detectadas || []).slice(0, 1).map((kw) => (
                  <span key={kw} className="hidden md:inline text-[11px] text-violet-400 truncate max-w-[80px]">
                    #{kw}
                  </span>
                ))}
                <span className="text-[11px] text-zinc-500 shrink-0 font-mono">
                  {timeAgo(new Date(event.created_at))}
                </span>
                <span className={`text-[12px] font-mono font-semibold ${getUrgencyColor(event.score_urgencia)} shrink-0`}>
                  {event.score_urgencia}
                </span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() =>
                    {
                      if (event.acao_sugerida === 'fazer') createTaskFromEvent(event.id)
                    }}
                    className="p-0.5 rounded text-zinc-500 hover:text-violet-400"
                    title="Criar tarefa"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => dismissEvent(event.id)}
                    className="p-0.5 rounded text-zinc-500 hover:text-red-400"
                    title="Descartar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
