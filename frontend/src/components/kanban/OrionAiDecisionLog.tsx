import { Sparkles } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'

// Log de Decisão da IA — transparência da orquestração adaptativa

export function OrionAiDecisionLog()
{
  const log = useTaskStore((s) => s.aiDecisionLog)
  const dailyScoreCap = useTaskStore((s) => s.dailyScoreCap)
  const personalVelocityFactor = useTaskStore((s) => s.personalVelocityFactor)

  if (log.length === 0)
  {
    return (
      <section className="min-w-0" aria-label="Log de Decisão da IA">
        <h3 className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-2 flex items-center gap-1.5">
          <Sparkles size={12} strokeWidth={1.5} className="text-indigo-400/70" />
          Log de Decisão da IA
        </h3>
        <p className="text-xs text-zinc-500 leading-relaxed">
          O assistente registrará ajustes de carga, contexto e estimativas aqui.
        </p>
        <p className="text-[10px] font-mono text-zinc-600 mt-2">
          Cap HOJE: {dailyScoreCap} pts · Velocidade: {personalVelocityFactor.toFixed(1)}x
        </p>
      </section>
    )
  }

  return (
    <section className="min-w-0" aria-label="Log de Decisão da IA">
      <h3 className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-2 flex items-center gap-1.5">
        <Sparkles size={12} strokeWidth={1.5} className="text-indigo-400/70" />
        Log de Decisão da IA
      </h3>

      <div className="rounded-lg border border-white/[0.06] bg-[#121420]/80 p-3 space-y-2 max-h-36 overflow-y-auto custom-scrollbar transition-all duration-300">
        {log.slice(0, 8).map((entry) => (
          <p
            key={entry.id}
            className="text-[11px] text-zinc-400 leading-snug border-l-2 border-indigo-500/30 pl-2"
          >
            {entry.message}
          </p>
        ))}
      </div>

      <p className="text-[10px] font-mono text-zinc-600 mt-2">
        Cap HOJE: {dailyScoreCap} pts · Velocidade: {personalVelocityFactor.toFixed(1)}x
      </p>
    </section>
  )
}
