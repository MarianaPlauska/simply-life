import { useMemo } from 'react'
import {
  LayoutDashboard, KanbanSquare, CalendarDays, StickyNote, SlidersHorizontal,
  Wallet, HardDrive, PanelLeftClose, PanelLeft, Settings,
  Zap, Webhook, PlugZap, Inbox, HeartPulse,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTaskStore, type ActiveView } from '../../store/useTaskStore'
import {
  AXEL_NAV_PLANE, AXEL_TEXT_PRIMARY, AXEL_NAV_ACTIVE, AXEL_NAV_IDLE,
  AXEL_AVATAR, AXEL_AVATAR_INITIALS, AXEL_BTN_PRIMARY,
} from '../../constants/axelSurfaces'

// Sidebar — plano de navegação (#121214) separado do conteúdo (#09090B)

interface NavItem
{
  id: ActiveView | string
  label: string
  icon: React.ElementType
  moduleKey?: string
  path: string
  subItems?: { label: string; tab: string; icon: React.ElementType }[]
}

interface NavGroup
{
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, moduleKey: 'dashboard', path: '/' },
      { id: 'kanban', label: 'Kanban', icon: KanbanSquare, moduleKey: 'kanban', path: '/kanban' },
      { id: 'saude', label: 'Saúde', icon: HeartPulse, moduleKey: 'saude', path: '/saude' },
      { id: 'financeiro', label: 'Finanças', icon: Wallet, moduleKey: 'financeiro', path: '/financeiro' },
    ],
  },
  {
    label: 'Mais',
    items: [
      { id: 'superhuman', label: 'Foco Superhumano', icon: Zap, moduleKey: 'superhuman', path: '/superhuman' },
      { id: 'calendario', label: 'Calendário', icon: CalendarDays, moduleKey: 'calendario', path: '/calendario' },
    ],
  },
  {
    label: 'Inteligência',
    items: [
      { id: 'anotacoes', label: 'Anotações', icon: StickyNote, moduleKey: 'anotacoes', path: '/anotacoes' },
      { id: 'inbox', label: 'Inbox IA', icon: Inbox, moduleKey: 'inteligencia', path: '/inteligencia' },
      { id: 'preferencias', label: 'Preferências IA', icon: SlidersHorizontal, moduleKey: 'inteligencia', path: '/preferencias' },
    ],
  },
  {
    label: 'Configurações',
    items: [
      { id: 'carreira', label: 'Integrações', icon: PlugZap, moduleKey: 'carreira', path: '/carreira' },
      { id: 'drive', label: 'Vault / Drive', icon: HardDrive, moduleKey: 'carreira', path: '/drive' },
      { id: 'webhooks', label: 'Webhooks', icon: Webhook, moduleKey: 'configuracoes', path: '/configuracoes#webhooks' },
      { id: 'configuracoes', label: 'Configurações', icon: Settings, moduleKey: 'configuracoes', path: '/configuracoes' },
    ],
  },
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
  return 'MC'
}

function navItemClasses(isActive: boolean): string
{
  return isActive ? AXEL_NAV_ACTIVE : AXEL_NAV_IDLE
}

export function Sidebar()
{
  const navigate = useNavigate()
  const location = useLocation()
  const activeView = useTaskStore((s) => s.activeView)
  const sidebarCollapsed = useTaskStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useTaskStore((s) => s.toggleSidebar)
  const registerInteraction = useTaskStore((s) => s.registerInteraction)
  const setQuickCaptureOpen = useTaskStore((s) => s.setQuickCaptureOpen)
  const userProfile = useTaskStore((s) => s.userProfile)
  const userStats = useTaskStore((s) => s.userStats)

  const iniciais = useMemo(
    () => iniciaisDe(userProfile?.nome || 'Convidado'),
    [userProfile?.nome],
  )

  const handleNav = (item: NavItem) =>
  {
    navigate(item.path)
    if (item.moduleKey) registerInteraction(item.moduleKey)
  }

  if (sidebarCollapsed)
  {
    return (
      <aside className={`hidden md:flex w-14 shrink-0 min-h-screen sticky top-0 self-start ${AXEL_NAV_PLANE} flex-col items-center py-4 gap-1`}>
        <button onClick={toggleSidebar} className="p-2 text-ink-muted hover:text-ink hover:bg-chrome transition-colors mb-4">
          <PanelLeft className="w-4 h-4" />
        </button>
        {NAV_GROUPS.flatMap((g) => g.items).map(({ id, icon: Icon, path, moduleKey }) =>
        {
          const isActive = activeView === id
          return (
            <button
              key={id}
              onClick={() => { navigate(path); if (moduleKey) registerInteraction(moduleKey) }}
              title={String(id)}
              className={`p-2 transition-colors rounded-r-md ${navItemClasses(isActive)}`}
            >
              <Icon className="w-4 h-4" />
            </button>
          )
        })}
      </aside>
    )
  }

  return (
    <aside className={`hidden md:flex w-60 shrink-0 min-h-screen sticky top-0 self-start ${AXEL_NAV_PLANE} flex-col overflow-hidden`}>
      <div className="px-5 h-16 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-sl bg-accent shrink-0" />
          <div className="flex flex-col leading-tight">
            <span className={`text-[13px] font-display tracking-tight ${AXEL_TEXT_PRIMARY}`}>
              Simply-Life
            </span>
            <span className="font-mono text-[9px] tracking-[0.2em] text-ink-muted mt-0.5 uppercase">OS</span>
          </div>
        </div>
        <button onClick={toggleSidebar} className="p-1.5 text-ink-muted hover:text-ink hover:bg-chrome transition-colors">
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 mb-3">
        <button
          onClick={() => setQuickCaptureOpen(true)}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-[11px] font-mono uppercase tracking-wide ${AXEL_BTN_PRIMARY}`}
        >
          <Zap className="w-3 h-3 opacity-80" />
          Captura
          <span className="text-[10px] ml-1 opacity-70">⌘K</span>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="sl-eyebrow mt-6 mb-2 px-2 text-ink-muted">
              {group.label}
            </div>
            <div>
              {group.items.map((item) =>
              {
                const isActive = activeView === item.id || (item.path === '/' && location.pathname === '/')
                const Icon = item.icon

                return (
                  <div key={String(item.id)} className="group relative">
                    <button
                      onClick={() => handleNav(item)}
                      className={`w-full flex items-center gap-2.5 px-2 py-2 text-[13px] transition-colors rounded-r-md ${navItemClasses(isActive)}`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-accent' : ''}`} />
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 pb-4 pt-2 shrink-0 space-y-3">
        <button
          onClick={() => navigate('/perfil')}
          className="w-full flex items-center gap-3 px-1 py-2 hover:bg-chrome transition-colors text-left rounded-sl"
        >
          <div className={`w-8 h-8 shrink-0 ${AXEL_AVATAR}`}>
            <span className={`text-[10px] ${AXEL_AVATAR_INITIALS}`}>
              {iniciais}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-[12px] font-medium truncate ${AXEL_TEXT_PRIMARY}`}>
              {userProfile?.nome?.split(' ')[0] || 'Convidado'}
            </div>
            <div className="text-[10.5px] font-mono text-ink-muted">
              Nível {userStats?.level || 1}
            </div>
          </div>
        </button>
      </div>
    </aside>
  )
}
