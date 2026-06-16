import { useMemo, useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import {
  ACCENT_PALETTES,
  type AccentId,
  type DashboardPriority,
  type MascotMoodPref,
} from '../../lib/userWorkspacePrefs'
import { applyAccentTheme } from '../../lib/applyAccentTheme'
import { canUseAccent } from '../../lib/axelPrivileges'
import { saveMonthSavingsGoal } from '../../lib/financeMonthGoal'
import { FinanceMoodMascot } from '../Finance/spreadsheet/FinanceMoodMascot'
import {
  AXEL_BTN_PRIMARY,
  AXEL_BORDERLESS_PANEL,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import { isSetupComplete } from '../../lib/userWorkspacePrefs'

const STEPS = ['Identidade', 'Cor & mascote', 'Prioridade', 'Primeira meta'] as const

const PRIORITY_OPTIONS: { id: DashboardPriority; label: string; hint: string }[] = [
  { id: 'finance', label: 'Finanças', hint: 'Boletos e meta no topo' },
  { id: 'tasks', label: 'Tarefas', hint: 'Comando e foco primeiro' },
  { id: 'health', label: 'Saúde', hint: 'Água e ritual no topo' },
]

const MOOD_OPTIONS: { id: MascotMoodPref; label: string }[] = [
  { id: 'cheerful', label: 'Animado' },
  { id: 'calm', label: 'Calmo' },
  { id: 'focused', label: 'Focado' },
]

function iniciaisDe(nome: string): string
{
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length >= 2)
  {
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  }
  if (partes.length === 1 && partes[0].length >= 2)
  {
    return partes[0].slice(0, 2).toUpperCase()
  }
  return 'AX'
}

export function AxelSetupWizard()
{
  const navigate = useNavigate()
  const userProfile = useTaskStore((s) => s.userProfile)
  const userStats = useTaskStore((s) => s.userStats)
  const accessibility = useTaskStore((s) => s.accessibility)
  const patchWorkspacePrefs = useTaskStore((s) => s.patchWorkspacePrefs)
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)
  const workspacePrefsLoaded = useTaskStore((s) => s.workspacePrefsLoaded)
  const fetchWorkspacePrefs = useTaskStore((s) => s.fetchWorkspacePrefs)
  const updateProfile = useTaskStore((s) => s.updateProfile)
  const createTarefa = useTaskStore((s) => s.createTarefa)
  const addXP = useTaskStore((s) => s.addXP)

  const [step, setStep] = useState(0)
  const [displayName, setDisplayName] = useState(userProfile.nome || '')
  const [axelCallsYou, setAxelCallsYou] = useState('')
  const [accent, setAccent] = useState<AccentId>('copper')
  const [mascotMood, setMascotMood] = useState<MascotMoodPref>('calm')
  const [priority, setPriority] = useState<DashboardPriority>('tasks')
  const [goalMode, setGoalMode] = useState<'month' | 'task'>('task')
  const [monthGoal, setMonthGoal] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() =>
  {
    if (!workspacePrefsLoaded)
    {
      void fetchWorkspacePrefs()
    }
  }, [workspacePrefsLoaded, fetchWorkspacePrefs])

  if (workspacePrefsLoaded && isSetupComplete(workspacePrefs))
  {
    return <Navigate to="/" replace />
  }

  const level = userStats?.level ?? 1
  const privilegeCtx = useMemo(() => ({ level, streakCount: 0 }), [level])

  const scheme = accessibility.colorScheme === 'light' ? 'light' : 'dark'

  const previewAccent = (id: AccentId) =>
  {
    setAccent(id)
    applyAccentTheme(id, scheme)
  }

  const canNext = (): boolean =>
  {
    if (step === 0) return displayName.trim().length >= 2
    if (step === 3)
    {
      if (goalMode === 'month') return parseFloat(monthGoal.replace(',', '.')) > 0
      return taskTitle.trim().length >= 2
    }
    return true
  }

  const finish = async () =>
  {
    if (saving) return
    setSaving(true)

    try
    {
      const callsYou = axelCallsYou.trim() || displayName.trim().split(' ')[0]

      await patchWorkspacePrefs({
        display_name: displayName.trim(),
        axel_calls_you: callsYou,
        accent,
        mascot_mood: mascotMood,
        dashboard_priority: priority,
        month_goal_amount: goalMode === 'month'
          ? parseFloat(monthGoal.replace(',', '.'))
          : null,
        setup_completed_at: new Date().toISOString(),
        ai_coach_enabled: true,
      })

      updateProfile({ nome: displayName.trim() })

      if (goalMode === 'month')
      {
        const valor = parseFloat(monthGoal.replace(',', '.'))
        if (valor > 0) saveMonthSavingsGoal(valor, 'Meta do mês')
      }
      else if (taskTitle.trim())
      {
        await createTarefa(taskTitle.trim(), 'Primeira vitória — wizard AXEL')
        await addXP('foco', 25)
      }

      toast.success('AXEL montado! Bem-vindo ao seu espaço.')
      navigate('/', { replace: true })
    }
    catch
    {
      toast.error('Não foi possível salvar. Tente de novo.')
    }
    finally
    {
      setSaving(false)
    }
  }

  const iniciais = iniciaisDe(displayName || 'AXEL')

  return (
    <div className="min-h-screen bg-fundo flex flex-col">
      <header className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 border-b border-line">
        <div className="max-w-lg mx-auto">
          <p className="sl-eyebrow">Montar seu AXEL</p>
          <h1 className={`text-xl font-display mt-1 ${AXEL_TEXT_PRIMARY}`}>
            {STEPS[step]}
          </h1>
          <div className="flex gap-1.5 mt-3">
            {STEPS.map((label, i) => (
              <div
                key={label}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-accent' : 'bg-line'
                }`}
                aria-hidden
              />
            ))}
          </div>
          <p className={`text-[11px] mt-2 ${AXEL_TEXT_SECONDARY}`}>
            Passo {step + 1} de {STEPS.length} · ~2 min
          </p>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {step === 0 && (
          <div className="space-y-4">
            <p className={`text-sm ${AXEL_TEXT_SECONDARY}`}>
              Como o AXEL deve te chamar? Isso aparece no dashboard e no seu cartão público.
            </p>
            <label className="block space-y-1.5">
              <span className="font-mono text-[10px] uppercase text-ink-muted">Seu nome</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-sl border border-line bg-card text-ink"
                placeholder="Maria Silva"
                autoFocus
              />
            </label>
            <label className="block space-y-1.5">
              <span className="font-mono text-[10px] uppercase text-ink-muted">Como o AXEL te chama</span>
              <input
                value={axelCallsYou}
                onChange={(e) => setAxelCallsYou(e.target.value)}
                className="w-full px-3 py-2.5 rounded-sl border border-line bg-card text-ink"
                placeholder={displayName.split(' ')[0] || 'Maria'}
              />
            </label>
            <div className={`${AXEL_BORDERLESS_PANEL} flex items-center gap-3`}>
              <div className="w-12 h-12 rounded-sl bg-accent/15 border border-accent/30 flex items-center justify-center font-display text-accent">
                {iniciais}
              </div>
              <p className={`text-sm ${AXEL_TEXT_SECONDARY}`}>
                Preview do seu avatar no Círculo
              </p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <p className={`text-sm ${AXEL_TEXT_SECONDARY}`}>
              Escolha a cor de acento e o humor do mascote — seu privilégio desde o dia 1.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ACCENT_PALETTES) as AccentId[]).map((id) =>
              {
                const locked = !canUseAccent(id, privilegeCtx)
                const palette = ACCENT_PALETTES[id]
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={locked}
                    onClick={() => previewAccent(id)}
                    className={`p-3 rounded-sl border text-left transition-all ${
                      accent === id ? 'border-accent ring-2 ring-accent/30' : 'border-line'
                    } ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className="block w-8 h-8 rounded-full mb-2"
                      style={{ background: palette.dark }}
                    />
                    <span className="text-sm font-medium text-ink">{palette.label}</span>
                    {locked && (
                      <span className="block text-[10px] text-ink-muted mt-0.5">Nível 3</span>
                    )}
                  </button>
                )
              })}
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase text-ink-muted mb-2">Humor do mascote</p>
              <div className="flex gap-2 flex-wrap">
                {MOOD_OPTIONS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMascotMood(m.id)}
                    className={`px-3 py-2 rounded-sl border text-sm ${
                      mascotMood === m.id ? 'border-accent bg-accent/10 text-ink' : 'border-line text-ink-muted'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={`${AXEL_BORDERLESS_PANEL} flex items-center gap-4`}>
              <FinanceMoodMascot mood={mascotMood === 'cheerful' ? 'great' : mascotMood === 'focused' ? 'stressed' : 'ok'} headline="Seu mascote" showLabel={false} size="sm" />
              <p className={`text-sm ${AXEL_TEXT_SECONDARY}`}>Assim o AXEL vai te acompanhar</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className={`text-sm ${AXEL_TEXT_SECONDARY}`}>
              O que importa primeiro no celular? Você pode mudar depois (nível 7 desbloqueia reordenar livremente).
            </p>
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPriority(opt.id)}
                className={`w-full p-4 rounded-sl border text-left ${
                  priority === opt.id ? 'border-accent bg-accent/8' : 'border-line'
                }`}
              >
                <p className="font-medium text-ink">{opt.label}</p>
                <p className="text-[12px] text-ink-muted mt-0.5">{opt.hint}</p>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className={`text-sm ${AXEL_TEXT_SECONDARY}`}>
              Uma meta para a primeira vitória — e XP antes mesmo de explorar o app.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGoalMode('task')}
                className={`flex-1 py-2.5 rounded-sl border text-sm ${
                  goalMode === 'task' ? 'border-accent bg-accent/10' : 'border-line'
                }`}
              >
                1 tarefa hoje
              </button>
              <button
                type="button"
                onClick={() => setGoalMode('month')}
                className={`flex-1 py-2.5 rounded-sl border text-sm ${
                  goalMode === 'month' ? 'border-accent bg-accent/10' : 'border-line'
                }`}
              >
                Meta do mês
              </button>
            </div>
            {goalMode === 'task' ? (
              <label className="block space-y-1.5">
                <span className="font-mono text-[10px] uppercase text-ink-muted">O que você vai fazer hoje?</span>
                <input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-sl border border-line bg-card text-ink"
                  placeholder="Organizar a semana"
                  autoFocus
                />
              </label>
            ) : (
              <label className="block space-y-1.5">
                <span className="font-mono text-[10px] uppercase text-ink-muted">Quanto quer poupar este mês? (R$)</span>
                <input
                  value={monthGoal}
                  onChange={(e) => setMonthGoal(e.target.value)}
                  inputMode="decimal"
                  className="w-full px-3 py-2.5 rounded-sl border border-line bg-card text-ink"
                  placeholder="500"
                  autoFocus
                />
              </label>
            )}
            <div className={`${AXEL_BORDERLESS_PANEL} flex items-center gap-2 text-accent`}>
              <Sparkles size={16} />
              <span className="text-sm">+25 XP de boas-vindas ao concluir</span>
            </div>
          </div>
        )}
      </main>

      <footer className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 border-t border-line">
        <div className="max-w-lg mx-auto flex gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2.5 rounded-sl border border-line text-ink-muted flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              Voltar
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              disabled={!canNext()}
              onClick={() => setStep((s) => s + 1)}
              className={`flex-1 py-2.5 rounded-sl flex items-center justify-center gap-1 disabled:opacity-40 ${AXEL_BTN_PRIMARY}`}
            >
              Continuar
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              disabled={!canNext() || saving}
              onClick={() => void finish()}
              className={`flex-1 py-2.5 rounded-sl flex items-center justify-center gap-1 disabled:opacity-40 ${AXEL_BTN_PRIMARY}`}
            >
              <Check size={14} />
              {saving ? 'Salvando…' : 'Entrar no Simply-Life'}
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
