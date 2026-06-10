import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import type { TarefaUnificada } from '../../types'

// TempoCard — mini-card de janela temporal: FAZER EM 1H / FAZER HOJE / NESTA SEMANA
// Header colorido + lista densa de 3-4 tarefas + "Ver todas (n) >"

export type TempoBucket = '1h' | 'hoje' | 'semana'

interface TempoCardProps
{
  bucket: TempoBucket
}

const CONFIG: Record<TempoBucket, { label: string; bullet: string; headerBg: string; border: string }> = {
  '1h':     { label: 'Fazer em 1h',  bullet: 'bg-rose-500',   headerBg: 'from-rose-500/10 to-transparent',   border: 'border-rose-500/20' },
  hoje:     { label: 'Fazer Hoje',   bullet: 'bg-amber-500',  headerBg: 'from-amber-500/10 to-transparent',  border: 'border-amber-500/20' },
  semana:   { label: 'Nesta Semana', bullet: 'bg-sky-500',    headerBg: 'from-sky-500/10 to-transparent',    border: 'border-sky-500/20' },
}

function isToday(d: Date): boolean
{
  const now = new Date()
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate()
}

function within(d: Date, hours: number): boolean
{
  const diff = d.getTime() - Date.now()
  return diff <= hours * 60 * 60 * 1000
}

function bucketFilter(t: TarefaUnificada, bucket: TempoBucket): boolean
{
  if (t.status === 'concluida') return false
  if (!t.data_vencimento) return bucket === 'semana'
  const d = new Date(t.data_vencimento)

  if (bucket === '1h') return within(d, 1)
  if (bucket === 'hoje') return isToday(d) && !within(d, 1)

  // semana = entre amanha e +7 dias
  const ms = d.getTime() - Date.now()
  return ms > 24 * 60 * 60 * 1000 && ms < 7 * 24 * 60 * 60 * 1000
}

function timeStatus(t: TarefaUnificada): string
{
  if (!t.data_vencimento) return ''
  const venc = new Date(t.data_vencimento)
  const diff = Date.now() - venc.getTime()
  if (diff > 0)
  {
    const m = Math.round(diff / 60000)
    const h = Math.floor(m / 60)
    return h > 0 ? `Atrasado ${h}h${String(m % 60).padStart(2, '0')}` : `Atrasado ${m}min`
  }
  const hh = String(venc.getHours()).padStart(2, '0')
  const mm = String(venc.getMinutes()).padStart(2, '0')
  return `Hoje ${hh}:${mm}`
}

export function TempoCard({ bucket }: TempoCardProps)
{
  const tarefas = useTaskStore((s) => s.tarefas)
  const navigate = useNavigate()
  const cfg = CONFIG[bucket]

  const items = useMemo(() =>
  {
    return tarefas
      .filter((t) => bucketFilter(t, bucket))
      .sort((a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0))
  }, [tarefas, bucket])

  const visible = items.slice(0, 3)

  return (
    <section className={`bg-card border ${cfg.border} rounded-xl overflow-hidden flex flex-col`}>
      <header className={`px-3 py-2 bg-gradient-to-r ${cfg.headerBg} flex items-center justify-between border-b border-zinc-900/80`}>
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.bullet} shadow-[0_0_6px_currentColor]`} />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200">
            {cfg.label}
          </h3>
        </div>
        <span className="text-[11px] font-mono tabular-nums text-zinc-400 bg-black/40 border border-zinc-800 px-1.5 py-0.5 rounded">
          {items.length}
        </span>
      </header>

      <ul role="list" className="flex-1 divide-y divide-zinc-900/60 min-h-[140px]">
        {visible.length === 0 && (
          <li className="px-3 py-6 text-center text-[11px] text-zinc-600">
            Nenhuma tarefa nesta janela
          </li>
        )}
        {visible.map((t) =>
        {
          const overdue = (() =>
          {
            if (!t.data_vencimento) return false
            return new Date(t.data_vencimento).getTime() < Date.now()
          })()

          return (
            <li
              key={t.id}
              onClick={() => navigate('/kanban')}
              className="px-3 py-2 hover:bg-zinc-900/40 cursor-pointer transition-colors flex items-center gap-3"
            >
              <span className={`w-0.5 h-7 rounded-full ${cfg.bullet} shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-zinc-100 truncate">
                  {t.titulo}
                </div>
                {t.data_vencimento && (
                  <div className={`text-[10.5px] mt-0.5 ${overdue ? 'text-rose-400' : 'text-zinc-500'}`}>
                    {timeStatus(t)}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-zinc-500 shrink-0">Score</span>
              <span className="text-[12px] font-mono font-semibold tabular-nums shrink-0 text-zinc-200">
                {t.score_urgencia ?? 0}
              </span>
            </li>
          )
        })}
      </ul>

      {items.length > 0 && (
        <div className="px-3 py-2 border-t border-zinc-900/80 flex justify-center">
          <button
            onClick={() => navigate('/kanban')}
            className="inline-flex items-center gap-1 text-[11px] text-violet-300 hover:text-violet-200 transition-colors"
          >
            Ver todas ({items.length}) <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </section>
  )
}
