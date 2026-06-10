import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'

// FINANCAS 50-30-20 — donut com 3 fatias + legenda lateral

interface Slice
{
  label: string
  pct: number
  color: string
  valor: number
}

export function FinancasDonutCard()
{
  const navigate = useNavigate()
  const transactions = useTaskStore((s) => s.transactions)
  const fetchTransactions = useTaskStore((s) => s.fetchTransactions)

  useEffect(() =>
  {
    fetchTransactions()
  }, [fetchTransactions])

  const slices = useMemo<Slice[]>(() =>
  {
    // soma gastos por categoria do mes corrente
    const now = new Date()
    const totals = { necessidades: 0, desejos: 0, investimentos: 0 }

    ;(transactions || []).forEach((t) =>
    {
      if (!t.data) return
      const d = new Date(t.data)
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return
      if (t.tipo !== 'despesa') return

      const val = Math.abs(Number(t.valor) || 0)
      const cat = (t.categoria || '').toLowerCase()

      // heuristica: categorias de "necessidades", "investimentos", restante = desejos
      if (/investiment|aporte|reserva|poupanca|cdb|tesouro/i.test(cat)) totals.investimentos += val
      else if (/aluguel|conta|mercado|alimenta|saude|transporte|moradia|farm/i.test(cat)) totals.necessidades += val
      else totals.desejos += val
    })

    const total = totals.necessidades + totals.desejos + totals.investimentos
    if (total === 0)
    {
      return [
        { label: '50% Necessidades', pct: 50, color: '#8b5cf6', valor: 0 },
        { label: '30% Desejos',      pct: 30, color: '#f59e0b', valor: 0 },
        { label: '20% Investimentos', pct: 20, color: '#10b981', valor: 0 },
      ]
    }

    return [
      { label: '50% Necessidades',  pct: Math.round(totals.necessidades / total * 100), color: '#8b5cf6', valor: totals.necessidades },
      { label: '30% Desejos',       pct: Math.round(totals.desejos / total * 100),       color: '#f59e0b', valor: totals.desejos },
      { label: '20% Investimentos', pct: Math.round(totals.investimentos / total * 100), color: '#10b981', valor: totals.investimentos },
    ]
  }, [transactions])

  // calcula offset acumulado para desenhar fatias
  const r = 38
  const c = 2 * Math.PI * r
  let acc = 0
  const arcs = slices.map((s) =>
  {
    const len = (s.pct / 100) * c
    const offset = acc
    acc += len
    return { ...s, len, offset }
  })

  return (
    <section className="bg-card border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
      <header className="px-3 py-2 border-b border-zinc-900 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_6px_currentColor]" />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200">
          Finanças 50-30-20
        </h3>
      </header>

      <div className="flex-1 px-3 py-3 flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
          <svg width={96} height={96} className="-rotate-90">
            <circle cx={48} cy={48} r={r} stroke="#1c1730" strokeWidth={10} fill="transparent" />
            {arcs.map((a) => (
              <circle
                key={a.label}
                cx={48} cy={48} r={r}
                stroke={a.color}
                strokeWidth={10}
                fill="transparent"
                strokeDasharray={`${a.len} ${c}`}
                strokeDashoffset={-a.offset}
                strokeLinecap="butt"
                style={{ filter: `drop-shadow(0 0 4px ${a.color}66)` }}
              />
            ))}
          </svg>
        </div>

        <ul className="flex-1 space-y-2 min-w-0">
          {arcs.map((a) => (
            <li key={a.label} className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: a.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-[11.5px] text-zinc-300 font-medium">{a.label}</div>
                <div className="text-[11px] text-zinc-500 tabular-nums">
                  R$ {a.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-3 py-2 border-t border-zinc-900 flex justify-center">
        <button
          onClick={() => navigate('/financeiro')}
          className="inline-flex items-center gap-1 text-[11px] text-violet-300 hover:text-violet-200 transition-colors"
        >
          Ver planejamento <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </section>
  )
}
