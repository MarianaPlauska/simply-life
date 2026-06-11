import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import type { TarefaUnificada } from '../../types'
import { TaskLineRow } from '../kanban/TaskLineRow'

// LINHA DE EXECUÇÃO ATIVA — 4 colunas Kanban temporal (estilo Axel)
// Ordenado por prioridade matematica (Score)

interface TemporalColumn
{
  id: 'urgencias' | 'fazer_1h' | 'fazer_hoje' | 'fazer_semana'
  title: string
  dotColor: string
  countColor: string
  headerBg: string
  borderTop: string
}

const COLS: TemporalColumn[] = [
  { id: 'urgencias',     title: 'Urgências',    dotColor: 'bg-red-500',     countColor: 'bg-red-500/15 text-red-300',     headerBg: 'from-red-500/8',     borderTop: 'border-t-red-500/40'     },
  { id: 'fazer_1h',      title: 'Fazer em 1h',  dotColor: 'bg-amber-500',   countColor: 'bg-amber-500/15 text-amber-300', headerBg: 'from-amber-500/8',   borderTop: 'border-t-amber-500/40'   },
  { id: 'fazer_hoje',    title: 'Fazer Hoje',   dotColor: 'bg-violet-500',  countColor: 'bg-violet-500/15 text-violet-300', headerBg: 'from-violet-500/8', borderTop: 'border-t-violet-500/40' },
  { id: 'fazer_semana',  title: 'Fazer Semana', dotColor: 'bg-blue-500',    countColor: 'bg-blue-500/15 text-blue-300',   headerBg: 'from-blue-500/8',    borderTop: 'border-t-blue-500/40'    },
]

function bucketize(tarefas: TarefaUnificada[])
{
  const now = Date.now()
  const ONE_H = 3600_000
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const endOfToday = today.getTime()
  const endOfWeek = endOfToday + 6 * 24 * ONE_H

  const buckets: Record<TemporalColumn['id'], TarefaUnificada[]> = {
    urgencias: [], fazer_1h: [], fazer_hoje: [], fazer_semana: [],
  }

  // ordena por score desc — maior urgencia primeiro
  const sorted = [...tarefas]
    .filter((t) => t.status !== 'concluida')
    .sort((a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0))

  for (const t of sorted)
  {
    const score = t.score_urgencia ?? 0
    const critica = t.prioridade === 'critica'
    const venc = t.data_vencimento ? new Date(t.data_vencimento).getTime() : null

    // urgencia = score >=100 OU critica OU atrasado
    if (score >= 100 || critica || (venc && venc < now))
    {
      buckets.urgencias.push(t)
      continue
    }
    // fazer em 1h = vencimento dentro de 1h
    if (venc && venc - now <= ONE_H)
    {
      buckets.fazer_1h.push(t)
      continue
    }
    // fazer hoje = vencimento ate fim do dia
    if (venc && venc <= endOfToday)
    {
      buckets.fazer_hoje.push(t)
      continue
    }
    // fazer semana = vencimento ate 7 dias
    if (venc && venc <= endOfWeek)
    {
      buckets.fazer_semana.push(t)
      continue
    }
    // sem vencimento: aloca por score
    if (score >= 50) buckets.fazer_hoje.push(t)
    else buckets.fazer_semana.push(t)
  }

  return buckets
}

export function TemporalBoardSection()
{
  const tarefas = useTaskStore((s) => s.tarefas)
  const navigate = useNavigate()

  const buckets = useMemo(() => bucketize(tarefas), [tarefas])

  return (
    <section>
      <header className="flex items-baseline justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <span className="w-1 h-3 bg-violet-500 rounded-sm self-center" />
          <h2 className="text-[12px] font-bold text-white uppercase tracking-[0.2em]">
            Linha de Execução Ativa
          </h2>
          <span className="text-[10px] text-zinc-600">Ordenado por prioridade matemática (Score)</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {COLS.map((col) =>
        {
          const list = buckets[col.id]
          return (
            <div
              key={col.id}
              className={`bg-card border border-zinc-900 border-t-2 ${col.borderTop} rounded-md flex flex-col min-h-[200px] overflow-hidden transition-colors hover:border-zinc-800`}
            >
              {/* header da coluna com gradiente sutil */}
              <div className={`px-2.5 py-1.5 border-b border-zinc-900 flex items-center justify-between bg-gradient-to-r ${col.headerBg} to-transparent`}>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${col.dotColor} shadow-[0_0_6px_currentColor]`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white">{col.title}</span>
                </div>
                <span className={`text-[10px] font-mono font-bold tabular-nums px-1.5 py-0.5 rounded ${col.countColor}`}>
                  {list.length}
                </span>
              </div>

              {/* lista densa */}
              {list.length === 0 ? (
                <div className="flex-1 flex items-center justify-center px-3 py-6">
                  <span className="text-[10px] text-zinc-700">Sem itens</span>
                </div>
              ) : (
                <ul role="list" className="divide-y divide-zinc-900/60 flex-1">
                  {list.slice(0, 8).map((t) => (
                    <li key={t.id}>
                      <TaskLineRow tarefa={t} onOpen={() => navigate('/kanban')} />
                    </li>
                  ))}
                  {list.length > 8 && (
                    <li className="px-2.5 py-1 text-[10px] text-zinc-600">
                      +{list.length - 8} outras
                    </li>
                  )}
                </ul>
              )}

              {/* footer — add task */}
              <button
                onClick={() => navigate('/kanban')}
                className="px-2.5 py-1.5 border-t border-zinc-900 flex items-center justify-center gap-1 text-[10px] text-zinc-500 hover:text-violet-300 hover:bg-violet-500/5 transition-colors"
              >
                <Plus className="w-3 h-3" /> Nova tarefa
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
