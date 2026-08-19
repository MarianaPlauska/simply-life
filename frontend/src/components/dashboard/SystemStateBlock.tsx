import { useMemo } from 'react'
import { Sparkles } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'

// SystemStateBlock — Camada 1 (frase de Jarvis)
// Uma frase com carga mental + microsugestao. Sem grafico, sem card de gamificacao

interface SystemState
{
  carga: 'baixa' | 'moderada' | 'alta' | 'critica'
  podemEsperar: number
  sugestao: string
}

function evaluateSystemState(criticas: number, total: number): SystemState
{
  // heuristica baseada em quantidade de tarefas criticas e total ativo
  let carga: SystemState['carga'] = 'baixa'
  if (criticas >= 5) carga = 'critica'
  else if (criticas >= 3) carga = 'alta'
  else if (criticas >= 1 || total >= 10) carga = 'moderada'

  const podemEsperar = Math.max(0, total - criticas - 3)

  let sugestao = 'Continue executando o que está em foco.'
  if (criticas >= 1) sugestao = 'Resolva a urgência crítica primeiro.'
  if (carga === 'alta') sugestao = 'Concentre-se nas 2-3 prioridades de maior score.'
  if (carga === 'critica') sugestao = 'Adie comunicações não-críticas para amanhã.'

  return { carga, podemEsperar, sugestao }
}

const CARGA_COLOR: Record<SystemState['carga'], string> = {
  baixa:    'text-emerald-400',
  moderada: 'text-amber-400',
  alta:     'text-orange-400',
  critica:  'text-red-400',
}

export function SystemStateBlock()
{
  const tarefas = useTaskStore((s) => s.tarefas)

  const state = useMemo<SystemState>(() =>
  {
    const ativas = tarefas.filter((t) => t.status !== 'concluida')
    const criticas = ativas.filter((t) => (t.score_urgencia ?? 0) >= 100 || t.prioridade === 'critica').length
    return evaluateSystemState(criticas, ativas.length)
  }, [tarefas])

  return (
    <section className="flex items-start gap-2.5 px-1 py-2">
      <Sparkles className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-zinc-200">
          Carga mental{' '}
          <span className={`font-semibold ${CARGA_COLOR[state.carga]}`}>{state.carga}</span>.
          {state.podemEsperar > 0 && (
            <> {state.podemEsperar} item{state.podemEsperar !== 1 ? 's' : ''} podem esperar amanhã.</>
          )}
        </p>
        <p className="text-[13px] text-zinc-500 mt-0.5">
          Jarvis recomenda: <span className="text-zinc-300">{state.sugestao}</span>
        </p>
      </div>
    </section>
  )
}
