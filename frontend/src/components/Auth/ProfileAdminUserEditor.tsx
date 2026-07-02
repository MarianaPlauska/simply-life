import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Loader2, Save, ShieldCheck, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  adminDeleteUser,
  adminFetchUserPrefs,
  adminSaveUserPrefs,
  type AdminUserCard,
} from '../../lib/adminUsers'
import { avatarsForLevel, iniciaisDe, type AvatarStyleId } from '../../lib/axelAvatarPresets'
import { AxelCompanionAvatar } from '../Onboarding/AxelCompanionAvatar'
import {
  DASHBOARD_WIDGET_CATALOG,
  defaultWidgetsForPriority,
  toggleWidgetSelection,
  type DashboardWidgetId,
  MAX_DASHBOARD_WIDGETS,
} from '../../lib/dashboardWidgets'
import type { DashboardPriority } from '../../lib/userWorkspacePrefs'
import { useTaskStore } from '../../store/useTaskStore'
import { AXEL_BTN_PRIMARY, AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

const PRIORITY_OPTIONS: { id: DashboardPriority; label: string }[] = [
  { id: 'finance', label: 'Finanças' },
  { id: 'tasks', label: 'Tarefas' },
  { id: 'health', label: 'Saúde' },
]

interface ProfileAdminUserEditorProps
{
  user: AdminUserCard
  onUpdated: () => void
  onDeleted: () => void
}

export function ProfileAdminUserEditor({ user, onUpdated, onDeleted }: ProfileAdminUserEditorProps)
{
  const currentUserId = useTaskStore((s) => s.userId)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [displayName, setDisplayName] = useState(user.display_name)
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyleId>('initials')
  const [priority, setPriority] = useState<DashboardPriority>('tasks')
  const [widgets, setWidgets] = useState<DashboardWidgetId[]>([])

  const allowedAvatars = useMemo(() => avatarsForLevel(user.level), [user.level])
  const initials = iniciaisDe(displayName || user.display_name)
  const isSelf = user.user_id === currentUserId

  useEffect(() =>
  {
    if (!open) return

    let ativo = true
    setLoading(true)

    void adminFetchUserPrefs(user.user_id)
      .then((prefs) =>
      {
        if (!ativo) return
        setDisplayName(prefs.display_name || user.display_name)
        const style = prefs.avatar_style ?? 'initials'
        setAvatarStyle(allowedAvatars.includes(style) ? style : allowedAvatars[0])
        setPriority(prefs.dashboard_priority ?? 'tasks')
        setWidgets(
          prefs.dashboard_quick_widgets?.length
            ? prefs.dashboard_quick_widgets
            : defaultWidgetsForPriority(prefs.dashboard_priority ?? 'tasks'),
        )
      })
      .catch(() =>
      {
        if (ativo) toast.error('Não foi possível carregar as preferências')
      })
      .finally(() =>
      {
        if (ativo) setLoading(false)
      })

    return () => { ativo = false }
  }, [open, user.user_id, user.display_name, allowedAvatars])

  const handleSave = async () =>
  {
    setSaving(true)
    try
    {
      await adminSaveUserPrefs(user.user_id, user, {
        display_name: displayName.trim(),
        avatar_style: avatarStyle,
        dashboard_priority: priority,
        dashboard_quick_widgets: widgets,
      })
      toast.success('Preferências salvas')
      onUpdated()
    }
    catch (e)
    {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar')
    }
    finally
    {
      setSaving(false)
    }
  }

  const handleDelete = async () =>
  {
    if (isSelf)
    {
      toast.error('Use Sair da conta para encerrar sua própria sessão')
      return
    }

    const ok = window.confirm(
      `Excluir permanentemente a conta de ${displayName || user.display_name || 'este usuário'}?\n\nTodos os dados (tarefas, finanças, saúde) serão apagados.`,
    )
    if (!ok) return

    setDeleting(true)
    try
    {
      await adminDeleteUser(user.user_id)
      toast.success('Usuário excluído')
      onDeleted()
    }
    catch (e)
    {
      toast.error(e instanceof Error ? e.message : 'Erro ao excluir')
    }
    finally
    {
      setDeleting(false)
    }
  }

  return (
    <li className="rounded-sl border border-line overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 py-2.5 px-3 bg-chrome/40 hover:bg-chrome/60 transition-colors text-left"
      >
        <div
          className="w-9 h-9 rounded-sl bg-card border border-line flex items-center justify-center shrink-0"
          aria-hidden
        >
          <AxelCompanionAvatar
            style={(user.avatar_style as AvatarStyleId) || 'initials'}
            initials={(user.display_name || '?').slice(0, 1).toUpperCase()}
            size="sm"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className={`text-[13px] font-medium truncate ${AXEL_TEXT_PRIMARY}`}>
              {user.display_name || 'Sem nome'}
            </p>
            {user.is_admin && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sl bg-accent/15 text-accent text-[9px] font-mono uppercase">
                <ShieldCheck className="w-2.5 h-2.5" aria-hidden />
                Admin
              </span>
            )}
          </div>
          <p className="text-[10px] text-ink-muted font-mono truncate">{user.user_id}</p>
        </div>
        <span className="font-mono text-[11px] text-ink-muted shrink-0">Nv {user.level}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-ink-muted shrink-0" aria-hidden />
        ) : (
          <ChevronDown className="w-4 h-4 text-ink-muted shrink-0" aria-hidden />
        )}
      </button>

      {open && (
        <div className="p-3 sm:p-4 border-t border-line bg-card/50 space-y-4">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-ink-muted" aria-label="Carregando" />
            </div>
          ) : (
            <>
              <div>
                <label className={`block text-[11px] font-mono uppercase mb-1.5 ${AXEL_TEXT_SECONDARY}`}>
                  Nome exibido
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-chrome border border-line rounded-sl px-3 py-2 text-[13px] text-ink outline-none focus:border-accent/50"
                />
              </div>

              <div>
                <p className={`font-mono text-[10px] uppercase mb-2 ${AXEL_TEXT_SECONDARY}`}>
                  Avatar (nível {user.level})
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {allowedAvatars.map((style) =>
                  {
                    const selected = avatarStyle === style
                    return (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setAvatarStyle(style)}
                        className={`p-2 rounded-sl border min-h-[3.5rem] flex items-center justify-center ${
                          selected ? 'border-accent bg-accent/10' : 'border-line hover:border-accent/40'
                        }`}
                        aria-pressed={selected}
                      >
                        <AxelCompanionAvatar style={style} initials={initials || '?'} size="md" />
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
                      className={`px-3 py-1.5 rounded-sl border text-[12px] ${
                        priority === opt.id
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

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave()}
                  className={`inline-flex items-center gap-2 px-4 py-2 font-mono text-[10px] uppercase ${AXEL_BTN_PRIMARY}`}
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Salvar
                </button>

                {!isSelf && (
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => void handleDelete()}
                    className="inline-flex items-center gap-2 px-4 py-2 font-mono text-[10px] uppercase text-urgente border border-urgente/40 rounded-sl hover:bg-urgente/10 disabled:opacity-50"
                  >
                    {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Excluir conta
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </li>
  )
}
