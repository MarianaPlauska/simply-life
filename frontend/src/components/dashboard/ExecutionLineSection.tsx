import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, ArrowRight } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { TaskLineRow } from '../kanban/TaskLineRow'

// ExecutionLineSection — bloco central estilo Orion "LINHA DE EXECUÇÃO ATIVA"
// Apresenta urgencias (>100) e prioridades (>=50) em listas densas

interface LineGroup
{
  key: string
  title: string
  minScore: number
  maxItems: number
  dotColor: string
}

const GROUPS: LineGroup[] = [
  { key: 'urgencias',    title: 'Urgências',          minScore: 100, maxItems: 6, dotColor: 'bg-red-500'    },
  { key: 'prioridades',  title: 'Prioridades',        minScore: 50,  maxItems: 8, dotColor: 'bg-amber-500'  },
]

export function ExecutionLineSection()
{
  const tarefas = useTaskStore((s) => s.tarefas)
  const navigate = useNavigate()

  // separa por faixa de score — usa o mesmo criterio do Kanban temporal
  const buckets = useMemo(() =>
  {
    const ativas = tarefas.filter((t) => t.status !== 'concluida')
    const sorted = [...ativas].sort((a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0))

    const urgencias = sorted.filter((t) => (t.score_urgencia ?? 0) >= 100)
    const prioridades = sorted.filter((t) =>
    {
      const score = t.score_urgencia ?? 0
      return score >= 50 && score < 100
    })

    return { urgencias, prioridades }
  }, [tarefas])

  return (
    <section className="bg-card border border-zinc-900 rounded-md">
      <header className="px-3 py-2 border-b border-zinc-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-violet-400" />
          <h2 className="text-[11px] font-bold text-violet-300 uppercase tracking-widest">
            Linha de Execução Ativa
          </h2>
          <span className="text-[10px] text-zinc-600 font-mono">
            {buckets.urgencias.length + buckets.prioridades.length} ativas
          </span>
        </div>
        <button
          onClick={() => navigate('/kanban')}
          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
        >
          Ver Kanban <ArrowRight className="w-3 h-3" />
        </button>
      </header>

      {GROUPS.map((g) =>
      {
        const list = g.key === 'urgencias' ? buckets.urgencias : buckets.prioridades
        return (
          <div key={g.key} className="border-b border-zinc-900 last:border-b-0">
            <div className="flex items-center justify-between px-3 py-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${g.dotColor}`} />
                <span className="text-[11px] font-semibold text-zinc-200">{g.title}</span>
                <span className="text-[10px] text-zinc-600 font-mono">
                  Score {g.key === 'urgencias' ? '>100' : '≥50'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 tabular-nums">{list.length}</span>
            </div>

            {list.length === 0 ? (
              <p className="px-3 pb-2 text-[11px] text-zinc-600">Sem itens nesta faixa.</p>
            ) : (
              <ul role="list" className="divide-y divide-zinc-900/60">
                {list.slice(0, g.maxItems).map((t) => (
                  <li key={t.id}>
                    <TaskLineRow tarefa={t} onOpen={() => navigate('/kanban')} />
                  </li>
                ))}
                {list.length > g.maxItems && (
                  <li className="px-3 py-1 text-[10px] text-zinc-600">
                    +{list.length - g.maxItems} outras
                  </li>
                )}
              </ul>
            )}
          </div>
        )
      })}
    </section>
  )
}
