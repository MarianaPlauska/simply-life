// widget flutuante de onboarding - checklist de 5 passos para novos usuários
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Pin,
  Pill,
  Sparkles,
  Target,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { ONBOARDING_STEPS } from '../../store/slices/onboardingSlice';

export function OnboardingChecklist ()
{
  const steps       = useTaskStore((s) => s.onboardingSteps);
  const dismissed   = useTaskStore((s) => s.onboardingDismissed);
  const dismiss     = useTaskStore((s) => s.dismissOnboarding);
  const completeStep = useTaskStore((s) => s.completeOnboardingStep);
  const navigate    = useNavigate();

  const [collapsed, setCollapsed] = useState(false);

  const completedCount = steps.length;
  const totalSteps     = ONBOARDING_STEPS.length;
  const progressPct    = (completedCount / totalSteps) * 100;

  // Restaurado: aparece para logados até dispensar ou completar todos os passos
  if (dismissed || completedCount >= totalSteps)
  {
    return null;
  }

  const handleStepClick = (step: typeof ONBOARDING_STEPS[number]) =>
  {
    completeStep(step.id);
    navigate(step.path);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 w-80 print:hidden">
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">

        {/* header */}
        <OnboardingHeader
          completedCount={completedCount}
          totalSteps={totalSteps}
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          onDismiss={dismiss}
        />

        {/* progress bar */}
        <div className="h-1 bg-zinc-800/60">
          <div
            className="h-full bg-violet-500 transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* lista de passos */}
        {!collapsed && (
          <div className="px-3 py-2.5 space-y-0.5">
            {ONBOARDING_STEPS.map((step) => (
              <OnboardingStepItem
                key={step.id}
                step={step}
                done={steps.includes(step.id)}
                onClick={() => handleStepClick(step)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


/* ── header do widget ────────────────────────────────────── */
function OnboardingHeader ({ completedCount, totalSteps, collapsed, onToggle, onDismiss }: {
  completedCount: number;
  totalSteps: number;
  collapsed: boolean;
  onToggle: () => void;
  onDismiss: () => void;
})
{
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-violet-400" />
        <span className="text-[13px] font-semibold text-white">Primeiros Passos</span>
        <span className="text-[10px] text-zinc-500 font-medium ml-1">
          {completedCount}/{totalSteps}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggle}
          className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
        >
          {collapsed
            ? <ChevronUp className="w-3.5 h-3.5" />
            : <ChevronDown className="w-3.5 h-3.5" />
          }
        </button>
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
          aria-label="Dispensar onboarding"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}


/* ── item individual de step ─────────────────────────────── */
const STEP_ICONS: Record<string, LucideIcon> = {
  dump_vida: Sparkles,
  recompensa_irl: Sparkles,
  create_task: CheckCircle,
  add_expense: Wallet,
  add_habit: Pill,
  activate_focus: Target,
  customize_sidebar: Pin,
};

function OnboardingStepItem ({ step, done, onClick }: {
  step: { id: string; label: string };
  done: boolean;
  onClick: () => void;
})
{
  const StepIcon = STEP_ICONS[step.id] ?? CheckCircle;
  return (
    <button
      onClick={onClick}
      disabled={done}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200
        ${done ? 'opacity-50 cursor-default' : 'hover:bg-zinc-800/40 cursor-pointer'}`}
    >
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[12px]
        ${done
          ? 'bg-emerald-500/15 border border-emerald-500/20'
          : 'bg-zinc-800/60 border border-zinc-700/40'
        }`}
      >
        {done
          ? <Check className="w-3.5 h-3.5 text-emerald-400" />
          : <StepIcon size={14} strokeWidth={1.5} className="text-zinc-400" />
        }
      </div>
      <span className={`text-[12px] font-medium ${done ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
        {step.label}
      </span>
    </button>
  );
}
