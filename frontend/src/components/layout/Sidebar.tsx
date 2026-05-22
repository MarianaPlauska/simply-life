import { useState } from 'react'
import {
  LayoutDashboard, KanbanSquare, Crosshair, CalendarDays, StickyNote,
  Filter, SlidersHorizontal, Wallet, Pill, Briefcase, HardDrive,
  Sparkles, Flame, BarChart3, PanelLeftClose, PanelLeft, Settings,
  Zap, Pin, ChevronDown, Droplets, Beef, Dumbbell, HeartPulse,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTaskStore, type ActiveView } from '../../store/useTaskStore'

// Sidebar — fundo preto puro, submenus reais (Design System §2.1)

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

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Produtividade',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, moduleKey: 'dashboard', path: '/' },
      { id: 'kanban', label: 'Kanban', icon: KanbanSquare, moduleKey: 'kanban', path: '/kanban' },
      { id: 'superhuman', label: 'Foco Superhuman', icon: Zap, moduleKey: 'superhuman', path: '/superhuman' },
      { id: 'foco', label: 'Modo Foco', icon: Crosshair, moduleKey: 'foco', path: '/foco' },
      { id: 'relatorios', label: 'Relatórios', icon: BarChart3, moduleKey: 'relatorios', path: '/relatorios' },
      { id: 'calendario', label: 'Calendário', icon: CalendarDays, moduleKey: 'calendario', path: '/calendario' },
    ],
  },
  {
    label: 'Inteligência',
    items: [
      { id: 'anotacoes', label: 'Anotações', icon: StickyNote, moduleKey: 'anotacoes', path: '/anotacoes' },
      { id: 'inteligencia', label: 'Filtro Keywords', icon: Filter, moduleKey: 'inteligencia', path: '/inteligencia' },
      { id: 'preferencias', label: 'Preferências IA', icon: SlidersHorizontal, moduleKey: 'inteligencia', path: '/preferencias' },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { id: 'financeiro', label: 'Controle de Gastos', icon: Wallet, moduleKey: 'financeiro', path: '/financeiro' },
    ],
  },
  {
    label: 'Saúde',
    items: [
      {
        id: 'saude',
        label: 'Saúde & Bem-estar',
        icon: HeartPulse,
        moduleKey: 'saude',
        path: '/saude',
        subItems: [
          { label: 'Hidratação',   tab: 'hidratacao',   icon: Droplets   },
          { label: 'Alimentação',  tab: 'alimentacao',  icon: Beef       },
          { label: 'Academia',     tab: 'academia',     icon: Dumbbell   },
          { label: 'Medicamentos', tab: 'medicamentos', icon: Pill       },
          { label: 'Bem-estar',    tab: 'bem_estar',    icon: HeartPulse },
        ],
      },
    ],
  },
  {
    label: 'Carreira',
    items: [
      { id: 'carreira', label: 'Radar LinkedIn', icon: Briefcase, moduleKey: 'carreira', path: '/carreira' },
      { id: 'drive', label: 'Vault / Drive', icon: HardDrive, moduleKey: 'carreira', path: '/drive' },
    ],
  },
]

export function Sidebar()
{
  const navigate = useNavigate()
  const location = useLocation()
  const activeView = useTaskStore((s) => s.activeView)
  const sidebarCollapsed = useTaskStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useTaskStore((s) => s.toggleSidebar)
  const registerInteraction = useTaskStore((s) => s.registerInteraction)
  const setQuickCaptureOpen = useTaskStore((s) => s.setQuickCaptureOpen)
  const pinnedModules = useTaskStore((s) => s.pinnedModules)
  const togglePin = useTaskStore((s) => s.togglePin)

  // submenu de saude expandido por padrao quando dentro de /saude
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    saude: location.pathname === '/saude',
  })

  const handleNav = (item: NavItem) =>
  {
    navigate(item.path)
    if (item.moduleKey) registerInteraction(item.moduleKey)
  }

  if (sidebarCollapsed)
  {
    return (
      <aside className="w-14 shrink-0 h-screen sticky top-0 bg-black border-r border-zinc-900 flex flex-col items-center py-4 gap-1">
        <button onClick={toggleSidebar} className="p-2 rounded text-zinc-500 hover:text-zinc-200 hover:bg-card transition-colors mb-4">
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
              className={`p-2 rounded transition-colors ${
                isActive ? 'bg-card text-white' : 'text-zinc-500 hover:text-zinc-200 hover:bg-card'
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          )
        })}
      </aside>
    )
  }

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 bg-black border-r border-zinc-900 flex flex-col overflow-hidden">
      {/* logo + collapse */}
      <div className="px-4 h-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-violet-500/10 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <span className="text-[14px] font-semibold tracking-tight text-white">Simply-Life</span>
        </div>
        <button onClick={toggleSidebar} className="p-1.5 rounded text-zinc-500 hover:text-zinc-200 hover:bg-card transition-colors">
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* captura rapida */}
      <div className="px-3 mb-3">
        <button
          onClick={() => setQuickCaptureOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-card hover:bg-zinc-900 text-zinc-200 border border-zinc-900 rounded px-3 py-2 text-[12px] font-medium transition-colors"
        >
          <Zap className="w-3.5 h-3.5 text-violet-400" />
          Captura Rápida
        </button>
      </div>

      {/* grupos de navegacao */}
      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase mt-4 mb-1.5 px-3">
              {group.label}
            </div>
            <div className="space-y-px">
              {group.items.map((item) =>
              {
                const isActive = activeView === item.id
                const isPinned = pinnedModules.includes(String(item.id))
                const hasSub = Boolean(item.subItems?.length)
                const isOpen = expanded[String(item.id)]
                const Icon = item.icon

                return (
                  <div key={String(item.id)} className="group relative">
                    <button
                      onClick={() =>
                      {
                        handleNav(item)
                        if (hasSub) setExpanded((s) => ({ ...s, [String(item.id)]: !isOpen }))
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-[13px] transition-colors ${
                        isActive ? 'bg-card text-white' : 'text-zinc-400 hover:text-white hover:bg-card'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate flex-1 text-left">{item.label}</span>
                      {hasSub && (
                        <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                      )}
                    </button>

                    {/* botao pin (so para items sem submenu) */}
                    {!hasSub && (
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePin(String(item.id)) }}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-all ${
                          isPinned ? 'text-violet-400 opacity-100' : 'text-zinc-600 opacity-0 group-hover:opacity-100'
                        } hover:text-white`}
                        title={isPinned ? 'Desafixar' : 'Fixar'}
                      >
                        <Pin className={`w-3 h-3 ${isPinned ? 'fill-current' : ''}`} />
                      </button>
                    )}

                    {/* submenu — abre a aba via hash */}
                    {hasSub && isOpen && (
                      <div className="ml-6 mt-0.5 mb-1 border-l border-zinc-900 pl-2 space-y-px">
                        {item.subItems!.map((sub) =>
                        {
                          const SubIcon = sub.icon
                          const subActive = location.hash === `#${sub.tab}`
                          return (
                            <button
                              key={sub.tab}
                              onClick={() => navigate(`${item.path}#${sub.tab}`)}
                              className={`w-full flex items-center gap-2 px-2 py-1 rounded text-[12px] transition-colors ${
                                subActive ? 'text-violet-300' : 'text-zinc-500 hover:text-zinc-200'
                              }`}
                            >
                              <SubIcon className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{sub.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* rodape: settings + streak */}
      <div className="border-t border-zinc-900 px-3 py-3 space-y-1 shrink-0">
        <div className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-zinc-400">
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span>5 dias seguidos</span>
        </div>
        <button
          onClick={() => navigate('/configuracoes')}
          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-[13px] transition-colors ${
            activeView === 'configuracoes' ? 'bg-card text-white' : 'text-zinc-500 hover:text-white hover:bg-card'
          }`}
        >
          <Settings className="w-4 h-4" />
          Configurações
        </button>
      </div>
    </aside>
  )
}
