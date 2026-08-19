import { HeartPulse, Shield } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { mediaHumor } from '../../lib/moodInsights'

const WHY_POINTS = [
  'O AXEL usa seu humor para sugerir carga e prioridades do dia.',
  'Com o tempo, você vê padrões: o que ajuda e o que pesa.',
  'Pode registrar várias vezes ao dia; cada momento conta.',
]

export function BemEstarWelcomePanel()
{
  const humorHojeLista = useTaskStore((s) => s.humorHojeLista)
  const temRegistro = humorHojeLista.length > 0

  return (
    <div className="sl-panel p-4 sm:p-5 border-accent/20 bg-accent-muted/30">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-sl bg-surface border border-line shrink-0">
          <HeartPulse className="w-5 h-5 text-accent" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display text-base text-ink">
              Seu diário de bem-estar
            </h2>
            {temRegistro ? (
              <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded-sl bg-concluido/15 text-concluido border border-concluido/25">
                {humorHojeLista.length} hoje · média {mediaHumor(humorHojeLista)}
              </span>
            ) : (
              <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded-sl bg-accent/15 text-accent border border-accent/30">
                Registro recomendado hoje
              </span>
            )}
          </div>
          <p className="text-[13px] text-ink-muted mt-2 leading-relaxed">
            Este é o lugar para guardar como você está, com segurança e sem julgamento.
            Não é obrigatório responder tudo; um toque no humor já faz diferença.
          </p>
          <ul className="mt-3 space-y-1.5">
            {WHY_POINTS.map((line) => (
              <li key={line} className="text-[13px] text-ink-muted flex items-start gap-2">
                <span className="text-accent mt-0.5">·</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="flex items-center gap-1.5 mt-3 text-[12px] text-ink-muted">
            <Shield size={12} className="shrink-0 text-accent/70" />
            Registros privados, vinculados só à sua conta.
          </p>
        </div>
      </div>
    </div>
  )
}
