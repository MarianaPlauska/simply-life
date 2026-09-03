import { useEffect, useState } from 'react'
import {
  LayoutDashboard, KanbanSquare, CalendarDays, StickyNote,
  Wallet, PanelLeftClose, PanelLeft, Settings,
  Zap, HeartPulse, Search, ScrollText,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTaskStore, type ActiveView } from '../../store/useTaskStore'
import {
  AXEL_NAV_PLANE, AXEL_NAV_ACTIVE, AXEL_NAV_IDLE, AXEL_BTN_GHOST,
} from '../../constants/axelSurfaces'
import { SimplyLifeMark } from '../brand/SimplyLifeMark'

// Sidebar - plano de navegação (#121214) separado do conteúdo (#09090B)

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
      { id: 'axel-historico', label: 'Histórico AXEL', icon: ScrollText, path: '/axel/historico' },
    ],
  },
  {
    label: 'Configurações',
    items: [
      { id: 'configuracoes', label: 'Configurações', icon: Settings, moduleKey: 'configuracoes', path: '/configuracoes' },
    ],
  },
]

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
  const setCommandPaletteOpen = useTaskStore((s) => s.setCommandPaletteOpen)
  /** Tablet 768-1023: colapsada por padrão; expansível nesta sessão (Bloco H) */
  const [isTabletRange, setIsTabletRange] = useState(false)
  const [tabletExpanded, setTabletExpanded] = useState(false)

  useEffect(() =>
  {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(min-width: 768px) and (max-width: 1023px)')
    const apply = () => setIsTabletRange(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const collapsed = isTabletRange ? !tabletExpanded : sidebarCollapsed
  const onToggleSidebar = () =>
  {
    if (isTabletRange)
    {
      setTabletExpanded((v) => !v)
      return
    }
    toggleSidebar()
  }

  const handleNav = (item: NavItem) =>
  {
    navigate(item.path)
    if (item.moduleKey) registerInteraction(item.moduleKey)
  }

  if (collapsed)
  {
    return (
      <aside className={`hidden md:flex w-14 shrink-0 min-h-dvh sticky top-0 self-start ${AXEL_NAV_PLANE} flex-col items-center py-4 gap-1`}>
        <button onClick={onToggleSidebar} className="p-2 text-ink-muted hover:text-ink hover:bg-chrome transition-colors mb-4">
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
              className={`p-2 min-h-11 min-w-11 flex items-center justify-center transition-colors rounded-r-md ${navItemClasses(isActive)}`}
            >
              <Icon className="w-4 h-4" />
            </button>
          )
        })}
      </aside>
    )
  }

  return (
    <aside className={`hidden md:flex w-60 shrink-0 min-h-dvh sticky top-0 self-start ${AXEL_NAV_PLANE} flex-col overflow-hidden`}>
      <div className="px-5 h-16 flex items-center justify-between shrink-0">
        <SimplyLifeMark variant="lockup" />
        <button onClick={onToggleSidebar} className="p-1.5 text-ink-muted hover:text-ink hover:bg-chrome transition-colors">
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 mb-3">
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className={`w-full ${AXEL_BTN_GHOST}`}
          title="Tarefa, nota, gasto ou ir a qualquer módulo"
        >
          <Search className="w-3.5 h-3.5 opacity-90" aria-hidden />
          <span>Criar ou buscar</span>
          <span className="font-mono text-[10px] opacity-70">⌘K</span>
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
                      className={`w-full flex items-center gap-2.5 px-2 py-2 min-h-11 text-[13px] transition-colors rounded-r-md ${navItemClasses(isActive)}`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-ink' : ''}`} />
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
