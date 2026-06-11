import { Sparkles } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

// Log de Decisão da IA — transparência da orquestração adaptativa

export function AxelAiDecisionLog()
{
  const log = useTaskStore((s) => s.aiDecisionLog)
  const dailyScoreCap = useTaskStore((s) => s.dailyScoreCap)
  const personalVelocityFactor = useTaskStore((s) => s.personalVelocityFactor)

  if (log.length === 0)
  {
    return (
      <section className="min-w-0" aria-label="Log de Decisão da IA">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted mb-2 flex items-center gap-1.5">
          <Sparkles size={12} strokeWidth={1.75} className="text-accent" />
          O que o AXEL decidiu
        </h3>
        <p className={`text-[12px] leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
          O assistente registrará prioridades, ajustes de carga e movimentos aqui.
        </p>
        <p className={`font-mono text-[10px] mt-2 ${AXEL_TEXT_SECONDARY}`}>
          Cap Hoje: {dailyScoreCap} pts · Velocidade: {personalVelocityFactor.toFixed(1)}x
        </p>
      </section>
    )
  }

  return (
    <section className="min-w-0" aria-label="Log de Decisão da IA">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted mb-2 flex items-center gap-1.5">
        <Sparkles size={12} strokeWidth={1.75} className="text-accent" />
        O que o AXEL decidiu
      </h3>

      <div className="rounded-sl border border-line bg-chrome/30 p-3 space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
        {log.slice(0, 8).map((entry) => (
          <p
            key={entry.id}
            className={`text-[11px] leading-snug border-l-2 border-accent/35 pl-2 ${AXEL_TEXT_PRIMARY}`}
          >
            {entry.message}
          </p>
        ))}
      </div>

      <p className={`font-mono text-[10px] mt-2 ${AXEL_TEXT_SECONDARY}`}>
        Cap Hoje: {dailyScoreCap} pts · Velocidade: {personalVelocityFactor.toFixed(1)}x
      </p>
    </section>
  )
}
