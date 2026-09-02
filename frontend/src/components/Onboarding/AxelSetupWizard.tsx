import { useMemo, useState, useEffect } from 'react'
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import {
  ACCENT_PALETTES,
  type AccentId,
  type DashboardPriority,
  type MascotMoodPref,
  isSetupComplete,
} from '../../lib/userWorkspacePrefs'
import {
  DASHBOARD_WIDGET_CATALOG,
  defaultWidgetsForPriority,
  toggleWidgetSelection,
  type DashboardWidgetId,
  MAX_DASHBOARD_WIDGETS,
} from '../../lib/dashboardWidgets'
import {
  MOBILE_NAV_HOME_ID,
  MOBILE_NAV_OPTIONAL_CATALOG,
  MAX_MOBILE_NAV_OPTIONAL,
  defaultMobileNavForPriority,
  toggleMobileNavModule,
  type MobileNavModuleId,
} from '../../lib/mobileBottomNav'
import { iniciaisDe, type AvatarStyleId } from '../../lib/axelAvatarPresets'
import { applyAccentTheme } from '../../lib/applyAccentTheme'
import { canUseAccent } from '../../lib/axelPrivileges'
import { saveMonthSavingsGoal } from '../../lib/financeMonthGoal'
import { FinanceMoodMascot } from '../Finance/spreadsheet/FinanceMoodMascot'
import { AxelAvatarPicker } from './AxelAvatarPicker'
import { AxelCompanionAvatar } from './AxelCompanionAvatar'
import { AXEL_BTN_PRIMARY, AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

const STEPS = ['Identidade', 'Cor & mascote', 'Atalhos', 'Quase lá'] as const

const WIZARD_XP = 15
const BONUS_XP = 10

type QuickStartMode = 'skip' | 'task' | 'month'

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

const INPUT =
  'w-full px-3 py-2 md:px-4 md:py-2.5 rounded-sl border border-line bg-chrome text-sm md:text-base text-ink placeholder:text-ink-muted outline-none focus:border-accent transition-colors'

const WIZARD_CARD =
  'w-full max-w-[22rem] sm:max-w-[26rem] md:max-w-[32rem] lg:max-w-[36rem] flex flex-col max-h-[min(36rem,calc(100dvh-1.5rem))] md:max-h-[min(44rem,calc(100dvh-3rem))] rounded-sl border border-line bg-card shadow-lg overflow-hidden'

const WIZARD_SHELL =
  'min-h-[100dvh] bg-fundo sl-ruled-bg flex items-center justify-center px-3 py-4 sm:px-6 md:py-8 lg:py-10'

export function AxelSetupWizard()
{
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEdit = searchParams.get('edit') === '1'
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
  // Sempre vazio — usuário preenche do zero (sem vazar email/login)
  const [displayName, setDisplayName] = useState('')
  const [axelCallsYou, setAxelCallsYou] = useState('')
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyleId>('initials')
  const [accent, setAccent] = useState<AccentId>('meridian')
  const [mascotMood, setMascotMood] = useState<MascotMoodPref>('calm')
  const [priority, setPriority] = useState<DashboardPriority>('tasks')
  const [selectedWidgets, setSelectedWidgets] = useState<DashboardWidgetId[]>(
    () => defaultWidgetsForPriority('tasks'),
  )
  const [mobileNavModules, setMobileNavModules] = useState<MobileNavModuleId[]>(
    () => defaultMobileNavForPriority('tasks'),
  )
  const [quickStart, setQuickStart] = useState<QuickStartMode>('skip')
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

  // /setup?edit=1 permite remontar o AXEL depois do primeiro setup
  if (workspacePrefsLoaded && isSetupComplete(workspacePrefs) && !isEdit)
  {
    return <Navigate to="/" replace />
  }

  const level = userStats?.level ?? 1
  const privilegeCtx = useMemo(() => ({ level, streakCount: 0 }), [level])
  const scheme = accessibility.colorScheme === 'light' ? 'light' : 'dark'
  const initials = iniciaisDe(displayName)

  const previewAccent = (id: AccentId) =>
  {
    setAccent(id)
    applyAccentTheme(id, scheme)
  }

  const canNext = (): boolean =>
  {
    if (step === 0) return displayName.trim().length >= 2
    if (step === 2)
    {
      return selectedWidgets.length > 0
        && mobileNavModules.filter((m) => m !== MOBILE_NAV_HOME_ID).length >= 1
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
        avatar_style: avatarStyle,
        dashboard_priority: priority,
        dashboard_quick_widgets: selectedWidgets,
        mobile_bottom_nav: mobileNavModules,
        month_goal_amount: quickStart === 'month' && parseFloat(monthGoal.replace(',', '.')) > 0
          ? parseFloat(monthGoal.replace(',', '.'))
          : null,
        setup_completed_at: new Date().toISOString(),
        ai_coach_enabled: true,
      })

      updateProfile({ nome: displayName.trim() })

      await addXP('foco', WIZARD_XP)

      let bonusMsg = ''

      if (quickStart === 'month')
      {
        const valor = parseFloat(monthGoal.replace(',', '.'))
        if (valor > 0)
        {
          saveMonthSavingsGoal(valor, 'Meta do mês')
          await addXP('foco', BONUS_XP)
          bonusMsg = ` +${BONUS_XP} XP de bônus`
        }
      }
      else if (quickStart === 'task' && taskTitle.trim())
      {
        await createTarefa(taskTitle.trim(), 'Sugestão do wizard AXEL')
        await addXP('foco', BONUS_XP)
        bonusMsg = ` +${BONUS_XP} XP de bônus`
      }

      toast.success(`AXEL montado! +${WIZARD_XP} XP${bonusMsg}`)
      navigate('/', { replace: true })
    }
    catch (err)
    {
      console.error('AxelSetupWizard finish:', err)
      toast.error('Não foi possível salvar. Tente de novo.')
    }
    finally
    {
      setSaving(false)
    }
  }

  return (
    <div className={WIZARD_SHELL}>
      <div
        className={WIZARD_CARD}
        role="dialog"
        aria-labelledby="axel-wizard-title"
      >
        <header className="shrink-0 px-4 pt-4 pb-3 md:px-6 md:pt-5 md:pb-4 border-b border-line bg-card">
          <p className="sl-eyebrow text-[10px] md:text-xs">Montar seu AXEL</p>
          <h1 id="axel-wizard-title" className={`text-base md:text-xl font-display mt-0.5 md:mt-1 ${AXEL_TEXT_PRIMARY}`}>
            {STEPS[step]}
          </h1>
          <div className="flex gap-1 md:gap-1.5 mt-2.5 md:mt-3" aria-hidden>
            {STEPS.map((_, i) => (
              <div
                key={STEPS[i]}
                className={`h-0.5 md:h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-accent' : 'bg-line'
                }`}
              />
            ))}
          </div>
          <p className={`text-[10px] md:text-xs mt-1.5 md:mt-2 ${AXEL_TEXT_SECONDARY}`}>
            {step + 1}/{STEPS.length} · ~2 min
          </p>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 md:px-6 md:py-5">
          {step === 0 && (
            <div className="space-y-3 md:space-y-4">
              <p className={`text-[12px] md:text-sm leading-snug ${AXEL_TEXT_SECONDARY}`}>
                Como o AXEL deve te chamar? Aparece no dashboard e no Círculo.
              </p>

              <AxelAvatarPicker
                value={avatarStyle}
                displayName={displayName}
                onChange={setAvatarStyle}
              />

              <div className="flex items-center gap-2.5 md:gap-3 py-1 md:py-2">
                <AxelCompanionAvatar
                  style={avatarStyle}
                  initials={initials || '?'}
                  size="lg"
                />
                <p className={`text-[11px] md:text-sm leading-snug ${AXEL_TEXT_SECONDARY}`}>
                  Preview no seu cartão público
                </p>
              </div>

              <label className="block space-y-1 md:space-y-1.5">
                <span className="font-mono text-[9px] md:text-[10px] uppercase text-ink-muted">Seu nome</span>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={INPUT}
                  placeholder="Maria Silva"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  autoFocus
                />
              </label>
              <label className="block space-y-1 md:space-y-1.5">
                <span className="font-mono text-[9px] md:text-[10px] uppercase text-ink-muted">Como o AXEL te chama</span>
                <input
                  value={axelCallsYou}
                  onChange={(e) => setAxelCallsYou(e.target.value)}
                  className={INPUT}
                  placeholder="Opcional"
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3 md:space-y-4">
              <p className={`text-[12px] md:text-sm leading-snug ${AXEL_TEXT_SECONDARY}`}>
                Cor de acento e humor do mascote — privilégio desde o dia 1.
              </p>
              <div className="grid grid-cols-2 gap-2 md:gap-3">
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
                      className={`p-2.5 md:p-3.5 rounded-sl border text-left transition-all ${
                        accent === id ? 'border-accent ring-1 ring-accent/30' : 'border-line'
                      } ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className="block w-6 h-6 md:w-8 md:h-8 rounded-full mb-1.5 md:mb-2"
                        style={{ background: palette.dark }}
                      />
                      <span className="text-[12px] md:text-sm font-medium text-ink">{palette.label}</span>
                      {locked && (
                        <span className="block text-[9px] md:text-[10px] text-ink-muted">Nv 3</span>
                      )}
                    </button>
                  )
                })}
              </div>
              <div>
                <p className="font-mono text-[9px] md:text-[10px] uppercase text-ink-muted mb-1.5 md:mb-2">Humor</p>
                <div className="flex gap-1.5 md:gap-2 flex-wrap">
                  {MOOD_OPTIONS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMascotMood(m.id)}
                      className={`px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-sl border text-[12px] md:text-sm ${
                        mascotMood === m.id ? 'border-accent bg-accent/10 text-ink' : 'border-line text-ink-muted'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 py-1">
                <FinanceMoodMascot
                  mood={mascotMood === 'cheerful' ? 'great' : mascotMood === 'focused' ? 'stressed' : 'ok'}
                  headline=""
                  showLabel={false}
                  size="sm"
                />
                <p className={`text-[11px] md:text-sm ${AXEL_TEXT_SECONDARY}`}>Assim o AXEL te acompanha</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 md:space-y-5">
              <section className="space-y-2 md:space-y-3">
                <p className={`text-[12px] md:text-sm leading-snug ${AXEL_TEXT_SECONDARY}`}>
                  Na barra inferior do celular, <span className="text-ink font-medium">Home</span> fica sempre fixo.
                  Escolha até {MAX_MOBILE_NAV_OPTIONAL} módulos para navegar rápido.
                </p>
                <div className="flex items-center gap-2 rounded-sl border border-accent/25 bg-accent/8 px-3 py-2">
                  <span className="font-mono text-[9px] uppercase text-ink-muted">Fixo</span>
                  <span className="text-[13px] font-medium text-ink">Home</span>
                </div>
                <p className="font-mono text-[9px] uppercase text-ink-muted">
                  {mobileNavModules.filter((m) => m !== MOBILE_NAV_HOME_ID).length}/{MAX_MOBILE_NAV_OPTIONAL} módulos
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MOBILE_NAV_OPTIONAL_CATALOG.map((opt) =>
                  {
                    const on = mobileNavModules.includes(opt.id)
                    const full = !on
                      && mobileNavModules.filter((m) => m !== MOBILE_NAV_HOME_ID).length >= MAX_MOBILE_NAV_OPTIONAL
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={full}
                        onClick={() => setMobileNavModules((prev) => toggleMobileNavModule(prev, opt.id))}
                        className={`p-3 rounded-sl border text-left transition-colors ${
                          on ? 'border-accent bg-accent/8' : 'border-line'
                        } ${full ? 'opacity-40' : ''}`}
                      >
                        <p className="text-[13px] font-medium text-ink">{opt.label}</p>
                        <p className="text-[11px] text-ink-muted mt-0.5">{opt.hint}</p>
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="space-y-2 md:space-y-3 pt-1 border-t border-line">
                <p className={`text-[12px] md:text-sm leading-snug ${AXEL_TEXT_SECONDARY}`}>
                  Escolha até {MAX_DASHBOARD_WIDGETS} atalhos de cadastro rápido no dashboard.
                </p>
              <p className="font-mono text-[9px] uppercase text-ink-muted">
                {selectedWidgets.length}/{MAX_DASHBOARD_WIDGETS} selecionados
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DASHBOARD_WIDGET_CATALOG.map((opt) =>
                {
                  const on = selectedWidgets.includes(opt.id)
                  const full = !on && selectedWidgets.length >= MAX_DASHBOARD_WIDGETS
                  const lockedFinance = priority === 'finance' && opt.id === 'finance_brief' && on
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={full || lockedFinance}
                      onClick={() =>
                      {
                        if (lockedFinance)
                        {
                          return
                        }
                        if (priority === 'finance' && opt.id === 'finance_brief' && on)
                        {
                          return
                        }
                        setSelectedWidgets((prev) => toggleWidgetSelection(prev, opt.id))
                      }}
                      className={`p-3 rounded-sl border text-left transition-colors ${
                        on ? 'border-accent bg-accent/8' : 'border-line'
                      } ${full || lockedFinance ? 'opacity-40' : ''}`}
                    >
                      <p className="text-[13px] font-medium text-ink">
                        {opt.label}
                        {lockedFinance && (
                          <span className="ml-1.5 font-mono text-[9px] uppercase text-ink-muted">fixo</span>
                        )}
                      </p>
                      <p className="text-[11px] text-ink-muted mt-0.5">{opt.hint}</p>
                    </button>
                  )
                })}
              </div>
              <p className={`text-[11px] ${AXEL_TEXT_SECONDARY} pt-1`}>
                Foco geral (opcional):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                    {
                      setPriority(opt.id)
                      setSelectedWidgets(defaultWidgetsForPriority(opt.id))
                      setMobileNavModules(defaultMobileNavForPriority(opt.id))
                    }}
                    className={`px-2.5 py-1 rounded-sl border text-[11px] ${
                      priority === opt.id ? 'border-accent bg-accent-muted' : 'border-line text-ink-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              </section>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 md:space-y-4">
              <p className={`text-[12px] md:text-sm leading-snug ${AXEL_TEXT_SECONDARY}`}>
                Pronto! Seu espaço está montado. Você pode entrar agora ou deixar uma sugestão para o AXEL.
              </p>

              <div className="rounded-sl border border-accent/25 bg-accent/8 px-3 py-2.5 flex items-center gap-2">
                <Sparkles size={16} className="text-accent shrink-0" />
                <p className="text-[12px] md:text-sm text-ink">
                  <span className="font-medium">+{WIZARD_XP} XP</span>
                  <span className="text-ink-muted"> por montar seu AXEL</span>
                </p>
              </div>

              <div className="flex flex-col gap-1.5 md:gap-2">
                <button
                  type="button"
                  onClick={() => setQuickStart('skip')}
                  className={`w-full p-3 md:p-3.5 rounded-sl border text-left ${
                    quickStart === 'skip' ? 'border-accent bg-accent/8' : 'border-line'
                  }`}
                >
                  <p className="text-[13px] md:text-sm font-medium text-ink">Só explorar</p>
                  <p className="text-[11px] md:text-xs text-ink-muted mt-0.5">Entrar direto no dashboard</p>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickStart('task')}
                  className={`w-full p-3 md:p-3.5 rounded-sl border text-left ${
                    quickStart === 'task' ? 'border-accent bg-accent/8' : 'border-line'
                  }`}
                >
                  <p className="text-[13px] md:text-sm font-medium text-ink">Sugerir uma tarefa</p>
                  <p className="text-[11px] md:text-xs text-ink-muted mt-0.5">Opcional · bônus +{BONUS_XP} XP</p>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickStart('month')}
                  className={`w-full p-3 md:p-3.5 rounded-sl border text-left ${
                    quickStart === 'month' ? 'border-accent bg-accent/8' : 'border-line'
                  }`}
                >
                  <p className="text-[13px] md:text-sm font-medium text-ink">Meta de poupança do mês</p>
                  <p className="text-[11px] md:text-xs text-ink-muted mt-0.5">Opcional · bônus +{BONUS_XP} XP</p>
                </button>
              </div>

              {quickStart === 'task' && (
                <label className="block space-y-1 md:space-y-1.5">
                  <span className="font-mono text-[9px] md:text-[10px] uppercase text-ink-muted">Sugestão (opcional)</span>
                  <input
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className={INPUT}
                    placeholder="Organizar a semana"
                    autoComplete="off"
                  />
                </label>
              )}

              {quickStart === 'month' && (
                <label className="block space-y-1 md:space-y-1.5">
                  <span className="font-mono text-[9px] md:text-[10px] uppercase text-ink-muted">Valor (R$, opcional)</span>
                  <input
                    value={monthGoal}
                    onChange={(e) => setMonthGoal(e.target.value)}
                    inputMode="decimal"
                    className={INPUT}
                    placeholder="500"
                    autoComplete="off"
                  />
                </label>
              )}
            </div>
          )}
        </main>

        <footer className="shrink-0 px-4 py-3 md:px-6 md:py-4 border-t border-line bg-card flex gap-2 md:gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-3 py-2 md:px-4 md:py-2.5 rounded-sl border border-line text-ink-muted flex items-center gap-1 text-[12px] md:text-sm"
            >
              <ArrowLeft size={14} className="md:w-4 md:h-4" />
              Voltar
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              disabled={!canNext()}
              onClick={() => setStep((s) => s + 1)}
              className={`flex-1 py-2 md:py-2.5 rounded-sl flex items-center justify-center gap-1 text-sm md:text-base disabled:opacity-40 ${AXEL_BTN_PRIMARY}`}
            >
              Continuar
              <ArrowRight size={14} className="md:w-4 md:h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => void finish()}
              className={`flex-1 py-2 md:py-2.5 rounded-sl flex items-center justify-center gap-1 text-sm md:text-base disabled:opacity-40 ${AXEL_BTN_PRIMARY}`}
            >
              <Check size={14} className="md:w-4 md:h-4" />
              {saving ? 'Salvando…' : 'Entrar no AXEL'}
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}
