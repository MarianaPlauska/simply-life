import {
  LayoutDashboard, KanbanSquare, Crosshair, CalendarDays,
  StickyNote, Filter, SlidersHorizontal,
  Wallet, PiggyBank,
  Pill, HeartPulse,
  Briefcase, HardDrive,
  Sparkles, Flame, BarChart3,
  PanelLeftClose, PanelLeft, Settings, Zap, Pin,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore, type ActiveView } from '../../store/useTaskStore';

interface NavItem {
  id: ActiveView;
  label: string;
  icon: React.ElementType;
  moduleKey?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Produtividade',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, moduleKey: 'dashboard' },
      { id: 'kanban', label: 'Kanban', icon: KanbanSquare, moduleKey: 'kanban' },
      { id: 'foco', label: 'Modo Foco', icon: Crosshair, moduleKey: 'foco' },
      { id: 'relatorios', label: 'Relatórios', icon: BarChart3, moduleKey: 'relatorios' },
      { id: 'calendario', label: 'Calendario', icon: CalendarDays, moduleKey: 'calendario' },
    ],
  },
  {
    label: 'Inteligencia',
    items: [
      { id: 'anotacoes', label: 'Anotacoes', icon: StickyNote, moduleKey: 'anotacoes' },
      { id: 'inteligencia', label: 'Filtro Keywords', icon: Filter, moduleKey: 'inteligencia' },
      { id: 'preferencias', label: 'Preferencias IA', icon: SlidersHorizontal, moduleKey: 'inteligencia' },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { id: 'financeiro', label: 'Controle de Gastos', icon: Wallet, moduleKey: 'financeiro' },
      { id: 'planner', label: 'Planejador 50-30-20', icon: PiggyBank, moduleKey: 'financeiro' },
    ],
  },
  {
    label: 'Saude',
    items: [
      { id: 'saude', label: 'Medicamentos', icon: Pill, moduleKey: 'saude' },
    ],
  },
  {
    label: 'Carreira',
    items: [
      { id: 'carreira', label: 'Radar LinkedIn', icon: Briefcase, moduleKey: 'carreira' },
      { id: 'drive', label: 'Vault / Drive', icon: HardDrive, moduleKey: 'carreira' },
    ],
  },
];

const VIEW_TO_PATH: Record<ActiveView, string> = {
  dashboard: '/', kanban: '/kanban', anotacoes: '/anotacoes', foco: '/foco',
  configuracoes: '/configuracoes', financeiro: '/financeiro', saude: '/saude',
  preferencias: '/preferencias', perfil: '/perfil', planner: '/planner',
  calendario: '/calendario', drive: '/drive', superhuman: '/superhuman',
  inteligencia: '/inteligencia', carreira: '/carreira', relatorios: '/relatorios',
};

export function Sidebar() {
  const navigate = useNavigate();
  const activeView = useTaskStore((s) => s.activeView);
  const sidebarCollapsed = useTaskStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useTaskStore((s) => s.toggleSidebar);
  const registerInteraction = useTaskStore((s) => s.registerInteraction);
  const setQuickCaptureOpen = useTaskStore((s) => s.setQuickCaptureOpen);
  const pinnedModules = useTaskStore((s) => s.pinnedModules);
  const togglePin = useTaskStore((s) => s.togglePin);

  const handleNav = (item: NavItem) => {
    navigate(VIEW_TO_PATH[item.id] || '/');
    if (item.moduleKey) registerInteraction(item.moduleKey);
  };

  if (sidebarCollapsed) {
    return (
      <aside className="w-14 shrink-0 h-screen sticky top-0 bg-zinc-950 border-r border-zinc-800/50 flex flex-col items-center py-4 gap-1">
        <button onClick={toggleSidebar} className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors mb-4">
          <PanelLeft className="w-4 h-4" />
        </button>
        {NAV_GROUPS.flatMap((g) => g.items).map(({ id, icon: Icon, moduleKey }) => {
          const isActive = activeView === id;
          return (
            <button
              key={id}
              onClick={() => { navigate(VIEW_TO_PATH[id] || '/'); if (moduleKey) registerInteraction(moduleKey); }}
              title={id}
              className={`p-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-zinc-800/80 text-white'
                  : 'text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900'
              }`}
            >
              <Icon className="w-[16px] h-[16px]" />
            </button>
          );
        })}
      </aside>
    );
  }

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 bg-zinc-950 border-r border-zinc-800/50 flex flex-col overflow-hidden">

      {/* Logo + Collapse */}
      <div className="px-5 h-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
          </div>
          <span className="text-[14px] font-semibold tracking-tight text-white">Simply-Life</span>
        </div>
        <button onClick={toggleSidebar} className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors">
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Capture */}
      <div className="px-3 mb-4">
        <button
          onClick={() => setQuickCaptureOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] text-zinc-300 border border-zinc-800/50 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors"
        >
          <Zap className="w-3.5 h-3.5" />
          Captura Rapida
        </button>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mt-6 mb-2 px-3">
              {group.label}
            </div>
            <div className="space-y-px">
              {group.items.map(({ id, label, icon: Icon, moduleKey }) => {
                const isActive = activeView === id;
                const isPinned = pinnedModules.includes(id);
                return (
                  <div
                    key={id}
                    className="group relative"
                  >
                    <button
                      onClick={() => handleNav({ id, label, icon: Icon, moduleKey })}
                      className={`w-full flex items-center gap-3 px-3 py-[7px] rounded-lg text-[13px] transition-colors ${
                        isActive
                          ? 'bg-zinc-900 text-white font-medium'
                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                    {/* Pin action on hover */}
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePin(id); }}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-all ${
                        isPinned
                          ? 'text-zinc-400 opacity-100'
                          : 'text-zinc-600 opacity-0 group-hover:opacity-100'
                      } hover:text-white`}
                      title={isPinned ? 'Desafixar' : 'Fixar na header'}
                    >
                      <Pin className={`w-3 h-3 ${isPinned ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: Settings + Streak */}
      <div className="border-t border-zinc-800/50 px-3 py-3 space-y-2 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2">
          <Flame className="w-4 h-4 text-amber-500" />
          <span className="text-[12px] font-medium text-zinc-400">5 dias seguidos</span>
        </div>
        <button
          onClick={() => navigate('/configuracoes')}
          className={`w-full flex items-center gap-3 px-3 py-[7px] rounded-lg text-[13px] transition-colors ${
            activeView === 'configuracoes'
              ? 'bg-zinc-900 text-white font-medium'
              : 'text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          Configuracoes
        </button>
      </div>
    </aside>
  );
}
