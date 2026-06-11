import { Check, ChevronRight, Mail, Sparkles, Webhook, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTaskStore } from '../../store/useTaskStore'
import { AXEL_BTN_PRIMARY } from '../../constants/axelSurfaces'

const WIZARD_STEPS = [
  {
    id: 'connect_email',
    label: 'Conectar Gmail (grátis)',
    description: 'Senha de app do Gmail — sem Google Cloud. Configure na seção acima.',
    icon: Mail,
    actionLabel: 'Ver Gmail',
    tab: 'integracoes' as const,
  },
  {
    id: 'setup_webhook',
    label: 'Configurar webhook AXEL',
    description: 'Receba tarefas de automações externas com HMAC.',
    icon: Webhook,
    actionLabel: 'Abrir webhooks',
    tab: 'webhook' as const,
  },
  {
    id: 'set_daily_cap',
    label: 'Definir cap de execução',
    description: 'Limite de pontos na fila Executar agora (padrão 400).',
    icon: Zap,
    actionLabel: 'Ir para foco',
    tab: 'foco' as const,
  },
  {
    id: 'first_orchestrate',
    label: 'Deixar o AXEL organizar',
    description: 'Rode a orquestração no Kanban e revise o log de decisões.',
    icon: Sparkles,
    actionLabel: 'Abrir Kanban',
    path: '/kanban',
  },
  {
    id: 'create_task',
    label: 'Criar primeira demanda',
    description: 'Capture uma tarefa manual ou aceite uma do e-mail.',
    icon: Check,
    actionLabel: 'Nova demanda',
    path: '/kanban',
  },
] as const

interface AxelOnboardingWizardProps
{
  onSelectTab?: (tab: 'integracoes' | 'webhook' | 'foco') => void
}

export function AxelOnboardingWizard({ onSelectTab }: AxelOnboardingWizardProps)
{
  const navigate = useNavigate()
  const steps = useTaskStore((s) => s.onboardingSteps)
  const completeStep = useTaskStore((s) => s.completeOnboardingStep)
  const dismissed = useTaskStore((s) => s.onboardingDismissed)
  const dismiss = useTaskStore((s) => s.dismissOnboarding)
  const isSyncing = useTaskStore((s) => s.isSyncingGmail)

  const axelSteps = WIZARD_STEPS.map((s) => s.id)
  const doneCount = axelSteps.filter((id) => steps.includes(id)).length
  const progress = Math.round((doneCount / axelSteps.length) * 100)

  if (dismissed && doneCount === axelSteps.length)
  {
    return null
  }

  const handleAction = async (step: typeof WIZARD_STEPS[number]) =>
  {
    if ('tab' in step && step.tab && onSelectTab)
    {
      onSelectTab(step.tab)
      completeStep(step.id)
      return
    }

    if ('path' in step && step.path)
    {
      navigate(step.path)
      completeStep(step.id)
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-transparent p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Ativação AXEL</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Configure o centro de execução em {axelSteps.length} passos · {progress}% concluído
          </p>
        </div>
        {doneCount === axelSteps.length ? (
          <button
            type="button"
            onClick={() => dismiss()}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            Ocultar
          </button>
        ) : null}
      </div>

      <div className="h-1 rounded-full bg-zinc-800 mb-4 overflow-hidden">
        <div
          className="h-full bg-violet-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="space-y-2">
        {WIZARD_STEPS.map((step) =>
        {
          const done = steps.includes(step.id)
          const Icon = step.icon

          return (
            <li
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${done ? 'border-emerald-500/20 bg-emerald-500/[0.04]' : 'border-zinc-800/80 bg-zinc-900/40'}`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${done ? 'bg-emerald-500/10' : 'bg-zinc-800/80'}`}>
                {done ? (
                  <Check className="w-4 h-4 text-emerald-400" strokeWidth={2} />
                ) : (
                  <Icon className="w-4 h-4 text-violet-400" strokeWidth={1.75} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-medium ${done ? 'text-zinc-400 line-through' : 'text-white'}`}>
                  {step.label}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">{step.description}</p>
              </div>
              {!done && (
                <button
                  type="button"
                  disabled={step.id === 'connect_email' && isSyncing}
                  onClick={() => void handleAction(step)}
                  className={`inline-flex items-center gap-1 shrink-0 font-mono text-[10px] uppercase tracking-wide px-2.5 py-1.5 ${AXEL_BTN_PRIMARY} disabled:opacity-40`}
                >
                  {step.id === 'connect_email' && isSyncing ? 'Sync…' : step.actionLabel}
                  <ChevronRight size={12} />
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
