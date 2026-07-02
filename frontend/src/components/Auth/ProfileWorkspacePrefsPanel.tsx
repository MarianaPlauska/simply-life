import { useEffect, useMemo, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { AxelAvatarPicker } from '../Onboarding/AxelAvatarPicker'
import { AxelCompanionAvatar } from '../Onboarding/AxelCompanionAvatar'
import { FinanceMoodMascot } from '../Finance/spreadsheet/FinanceMoodMascot'
import {
  ACCENT_PALETTES,
  type AccentId,
  type DashboardPriority,
  type MascotMoodPref,
} from '../../lib/userWorkspacePrefs'
import { avatarsForLevel, iniciaisDe, type AvatarStyleId } from '../../lib/axelAvatarPresets'
import { canUseAccent } from '../../lib/axelPrivileges'
import {
  DASHBOARD_WIDGET_CATALOG,
  defaultWidgetsForPriority,
  toggleWidgetSelection,
  type DashboardWidgetId,
  MAX_DASHBOARD_WIDGETS,
} from '../../lib/dashboardWidgets'
import {
  AXEL_BTN_PRIMARY,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

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

/** Avatar, mascote e dashboard — editável pelo próprio usuário no perfil */
export function ProfileWorkspacePrefsPanel()
{
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)
  const workspacePrefsLoaded = useTaskStore((s) => s.workspacePrefsLoaded)
  const fetchWorkspacePrefs = useTaskStore((s) => s.fetchWorkspacePrefs)
  const patchWorkspacePrefs = useTaskStore((s) => s.patchWorkspacePrefs)
  const updateProfile = useTaskStore((s) => s.updateProfile)
  const userStats = useTaskStore((s) => s.userStats)
  const streakCount = useTaskStore((s) => s.streakCount)

  const [displayName, setDisplayName] = useState('')
  const [axelCallsYou, setAxelCallsYou] = useState('')
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyleId>('initials')
  const [accent, setAccent] = useState<AccentId>('copper')
  const [mascotMood, setMascotMood] = useState<MascotMoodPref>('calm')
  const [priority, setPriority] = useState<DashboardPriority>('tasks')
  const [widgets, setWidgets] = useState<DashboardWidgetId[]>([])
  const [saving, setSaving] = useState(false)

  const level = userStats?.level ?? 1
  const privilegeCtx = useMemo(() => ({ level, streakCount }), [level, streakCount])
  const allowedAvatars = useMemo(() => avatarsForLevel(level), [level])
  const initials = iniciaisDe(displayName)

  useEffect(() =>
  {
    if (!workspacePrefsLoaded)
    {
      void fetchWorkspacePrefs()
    }
  }, [workspacePrefsLoaded, fetchWorkspacePrefs])

  useEffect(() =>
  {
    if (!workspacePrefsLoaded) return

    setDisplayName(workspacePrefs.display_name)
    setAxelCallsYou(workspacePrefs.axel_calls_you)
    const style = workspacePrefs.avatar_style ?? 'initials'
    setAvatarStyle(allowedAvatars.includes(style) ? style : allowedAvatars[0])
    setAccent(workspacePrefs.accent)
    setMascotMood(workspacePrefs.mascot_mood)
    setPriority(workspacePrefs.dashboard_priority)
    setWidgets(
      workspacePrefs.dashboard_quick_widgets?.length
        ? workspacePrefs.dashboard_quick_widgets
        : defaultWidgetsForPriority(workspacePrefs.dashboard_priority),
    )
  }, [workspacePrefs, workspacePrefsLoaded, allowedAvatars])

  const handleSave = async () =>
  {
    if (displayName.trim().length < 2)
    {
      toast.error('Informe um nome com pelo menos 2 caracteres')
      return
    }

    setSaving(true)
    try
    {
      const callsYou = axelCallsYou.trim() || displayName.trim().split(' ')[0]
      await patchWorkspacePrefs({
        display_name: displayName.trim(),
        axel_calls_you: callsYou,
        avatar_style: avatarStyle,
        accent,
        mascot_mood: mascotMood,
        dashboard_priority: priority,
        dashboard_quick_widgets: widgets,
      })
      updateProfile({ nome: displayName.trim() })
      toast.success('Identidade AXEL atualizada')
    }
    catch
    {
      toast.error('Não foi possível salvar')
    }
    finally
    {
      setSaving(false)
    }
  }

  if (!workspacePrefsLoaded)
  {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-ink-muted" aria-label="Carregando preferências" />
      </div>
    )
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <AxelCompanionAvatar style={avatarStyle} initials={initials || '?'} size="lg" />
        <div className="flex items-end gap-2">
        <FinanceMoodMascot
          mood={mascotMood === 'cheerful' ? 'great' : mascotMood === 'focused' ? 'stressed' : 'ok'}
          headline="Preview"
          size="lg"
          showLabel={false}
        />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className={`block text-[11px] font-mono uppercase mb-1.5 ${AXEL_TEXT_SECONDARY}`}>
            Nome exibido
          </span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-chrome border border-line rounded-sl px-3 py-2.5 text-[13px] text-ink outline-none focus:border-accent/50"
          />
        </label>
        <label className="block">
          <span className={`block text-[11px] font-mono uppercase mb-1.5 ${AXEL_TEXT_SECONDARY}`}>
            Como o AXEL te chama
          </span>
          <input
            type="text"
            value={axelCallsYou}
            onChange={(e) => setAxelCallsYou(e.target.value)}
            placeholder={displayName.split(' ')[0] || 'Você'}
            className="w-full bg-chrome border border-line rounded-sl px-3 py-2.5 text-[13px] text-ink outline-none focus:border-accent/50"
          />
        </label>
      </div>

      <AxelAvatarPicker
        value={avatarStyle}
        displayName={displayName}
        allowedStyles={allowedAvatars}
        onChange={setAvatarStyle}
      />
      <p className={`text-[11px] -mt-2 ${AXEL_TEXT_SECONDARY}`}>
        Avatares liberados pelo nível {level}
      </p>

      <div>
        <p className={`font-mono text-[10px] uppercase mb-2 ${AXEL_TEXT_SECONDARY}`}>
          Humor do mascote
        </p>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setMascotMood(opt.id)}
              className={`px-3 py-1.5 rounded-sl border text-[12px] ${
                mascotMood === opt.id
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-line text-ink-muted hover:border-accent/40'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={`font-mono text-[10px] uppercase mb-2 ${AXEL_TEXT_SECONDARY}`}>
          Cor do tema
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ACCENT_PALETTES) as AccentId[]).map((id) =>
          {
            const unlocked = canUseAccent(id, privilegeCtx)
            const selected = accent === id
            return (
              <button
                key={id}
                type="button"
                disabled={!unlocked}
                onClick={() => setAccent(id)}
                title={unlocked ? ACCENT_PALETTES[id].label : `Desbloqueia no nível ${id === 'sky' || id === 'forest' ? 3 : 6}`}
                className={`px-3 py-1.5 rounded-sl border text-[12px] disabled:opacity-40 ${
                  selected
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-line text-ink-muted'
                }`}
              >
                {ACCENT_PALETTES[id].label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className={`font-mono text-[10px] uppercase mb-2 ${AXEL_TEXT_SECONDARY}`}>
          Foco principal no dashboard
        </p>
        <div className="flex flex-wrap gap-2">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() =>
              {
                setPriority(opt.id)
                setWidgets(defaultWidgetsForPriority(opt.id))
              }}
              className={`px-3 py-2 rounded-sl border text-left min-w-[7rem] ${
                priority === opt.id
                  ? 'border-accent bg-accent/10'
                  : 'border-line hover:border-accent/40'
              }`}
            >
              <span className={`block text-[12px] font-medium ${AXEL_TEXT_PRIMARY}`}>{opt.label}</span>
              <span className={`block text-[10px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>{opt.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={`font-mono text-[10px] uppercase mb-2 ${AXEL_TEXT_SECONDARY}`}>
          Atalhos no dashboard (até {MAX_DASHBOARD_WIDGETS})
        </p>
        <div className="flex flex-wrap gap-2">
          {DASHBOARD_WIDGET_CATALOG.map((w) =>
          {
            const selected = widgets.includes(w.id)
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => setWidgets((prev) => toggleWidgetSelection(prev, w.id))}
                className={`px-2.5 py-1 rounded-sl border text-[11px] ${
                  selected
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-line text-ink-muted'
                }`}
              >
                {w.label}
              </button>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={() => void handleSave()}
        className={`inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] uppercase tracking-wide ${AXEL_BTN_PRIMARY}`}
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        Salvar identidade AXEL
      </button>
    </section>
  )
}
