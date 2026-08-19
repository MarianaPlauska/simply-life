import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'

// DEEP WORK DE HOJE — N/M sessoes de foco completas hoje
// Usa focusState.sessionsCompleted como fonte de verdade

export function DeepWorkCard()
{
  const navigate = useNavigate()
  const focusState = useTaskStore((s) => s.focusState)

  const { feitas, meta, antesMeio, bonus } = useMemo(() =>
  {
    const f = focusState?.sessionsCompleted ?? 0
    const meta = 3
    // bonus: assumimos que se cumpriu a meta antes do meio-dia (heuristica simplificada)
    const antes12 = f >= meta && new Date().getHours() < 12
    const bonusFoco = antes12 ? 50 : 0
    return { feitas: f, meta, antesMeio: antes12, bonus: bonusFoco }
  }, [focusState])

  const completo = feitas >= meta

  return (
    <section className="bg-card border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
      <header className="px-3 py-2 border-b border-zinc-900 flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${completo ? 'bg-emerald-500' : 'bg-violet-500'} shadow-[0_0_6px_currentColor]`} />
        <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-200">
          Deep Work de Hoje
        </h3>
      </header>

      <div className="flex-1 flex items-center gap-4 px-4 py-5">
        <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center shrink-0 ${
          completo ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.25)]'
                   : 'border-violet-400/40 bg-violet-500/10 text-violet-300 shadow-[0_0_18px_rgba(139,92,246,0.25)]'
        }`}>
          <CheckCircle2 className="w-7 h-7" strokeWidth={1.8} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[36px] font-bold leading-none text-white tabular-nums">
            {feitas}<span className="text-zinc-600">/{meta}</span>
          </div>
          <p className="text-[11.5px] text-zinc-400 mt-1.5 leading-snug">
            {antesMeio
              ? `Sessões completas antes das 12h`
              : `${meta - feitas} sessão${meta - feitas !== 1 ? 'ões' : ''} restante${meta - feitas !== 1 ? 's' : ''} hoje`}
            <br />
            <span className={bonus > 0 ? 'text-emerald-300' : 'text-zinc-600'}>
              {bonus > 0 ? `+${bonus} Foco bônus conquistado!` : 'Bônus: +50 Foco se concluir antes das 12h'}
            </span>
          </p>
        </div>
      </div>

      <div className="px-3 py-2 border-t border-zinc-900 flex justify-center">
        <button
          onClick={() => navigate('/superhuman')}
          className="inline-flex items-center gap-1 text-[12px] text-violet-300 hover:text-violet-200 transition-colors"
        >
          Ver histórico <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </section>
  )
}
