import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'

// BURNOUT AURA — gauge donut com % de carga mental
// Calculo: criticas/(criticas+pendentes+1) * 100, capped 90% se nao houver criticas reais

type Nivel = 'baixa' | 'moderada' | 'alta' | 'critica'

const NIVEL_COR: Record<Nivel, string> = {
  baixa:    '#10b981',
  moderada: '#f59e0b',
  alta:     '#f97316',
  critica:  '#ef4444',
}

const NIVEL_LABEL: Record<Nivel, string> = {
  baixa:    'Carga mental baixa',
  moderada: 'Carga mental moderada',
  alta:     'Carga mental alta',
  critica:  'Carga mental crítica',
}

export function BurnoutAuraCard()
{
  const tarefas = useTaskStore((s) => s.tarefas)
  const navigate = useNavigate()

  const { pct, nivel, criticas } = useMemo(() =>
  {
    const ativas = tarefas.filter((t) => t.status !== 'concluida')
    const cr = ativas.filter((t) => (t.score_urgencia ?? 0) >= 100 || t.prioridade === 'critica').length
    const total = ativas.length || 1

    // formula simples: 60% peso para criticas + 40% pra densidade geral
    const carga = Math.round((cr / total) * 60 + Math.min(40, total * 2))
    const p = Math.min(95, Math.max(8, carga))

    let n: Nivel = 'baixa'
    if (p >= 70) n = 'critica'
    else if (p >= 45) n = 'alta'
    else if (p >= 25) n = 'moderada'

    return { pct: p, nivel: n, criticas: cr }
  }, [tarefas])

  const cor = NIVEL_COR[nivel]
  const r = 56
  const c = 2 * Math.PI * r
  const offset = c * (1 - pct / 100)

  return (
    <section className="bg-card border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
      <header className="px-3 py-2 border-b border-zinc-900 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cor, boxShadow: `0 0 6px ${cor}` }} />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200">
          Burnout Aura
        </h3>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4">
        <div className="relative" style={{ width: 140, height: 140 }}>
          <svg width={140} height={140} className="-rotate-90">
            <circle cx={70} cy={70} r={r} stroke="#1c1730" strokeWidth={8} fill="transparent" />
            <circle
              cx={70} cy={70} r={r}
              stroke={cor}
              strokeWidth={8}
              fill="transparent"
              strokeDasharray={c}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 8px ${cor}aa)` }}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[32px] font-bold leading-none text-white tabular-nums">{pct}%</span>
          </div>
        </div>

        <div className="text-center mt-3">
          <p className="text-[12.5px] text-zinc-200 font-medium">{NIVEL_LABEL[nivel]}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {criticas} tarefa{criticas !== 1 ? 's' : ''} crítica{criticas !== 1 ? 's' : ''} pendente{criticas !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="px-3 pb-3 flex justify-center">
        <button
          onClick={() => navigate('/relatorios')}
          className="inline-flex items-center gap-1 text-[11px] text-violet-300 hover:text-violet-200 transition-colors"
        >
          Ver análise completa <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </section>
  )
}
