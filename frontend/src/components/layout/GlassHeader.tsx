import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Search, User, SlidersHorizontal, LogOut, Bell, CheckCheck, Info, Heart, ListTodo, Wallet2 } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';

// Mapa view -> rota — header precisa navegar de verdade (nao so setActiveView)
const VIEW_TO_PATH: Record<string, string> = {
  dashboard: '/', kanban: '/kanban', anotacoes: '/anotacoes', foco: '/foco',
  configuracoes: '/configuracoes', superhuman: '/superhuman', financeiro: '/financeiro',
  saude: '/saude', inteligencia: '/inteligencia', carreira: '/carreira',
  preferencias: '/preferencias', planner: '/planner', calendario: '/calendario',
  drive: '/drive', perfil: '/perfil', relatorios: '/relatorios',
};

const VIEW_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  kanban: 'Kanban',
  anotacoes: 'Anotacoes',
  foco: 'Modo Foco',
  configuracoes: 'Configuracoes',
  superhuman: 'Agenda',
  financeiro: 'Financeiro',
  saude: 'Saude',
  inteligencia: 'Inteligencia',
  carreira: 'Carreira',
  preferencias: 'Preferencias',
  planner: 'Planejador',
  calendario: 'Calendario',
  drive: 'Vault / Drive',
  perfil: 'Meu Perfil',
  login: 'Login',
};

export function GlassHeader() {
  const navigate = useNavigate();
  const activeView = useTaskStore((s) => s.activeView);
  const pinnedModules = useTaskStore((s) => s.pinnedModules);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notificacoes = useTaskStore((s) => s.notificacoes);
  const fetchNotificacoes = useTaskStore((s) => s.fetchNotificacoes);
  const markNotificacaoRead = useTaskStore((s) => s.markNotificacaoRead);
  const markAllNotificacoesRead = useTaskStore((s) => s.markAllNotificacoesRead);
  const unreadCount = notificacoes.filter((n) => !n.lida).length;
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() =>
  {
    fetchNotificacoes();
  }, [fetchNotificacoes]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setIsProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setIsNotifOpen(false);
    }
    if (isProfileOpen || isNotifOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen, isNotifOpen]);

  return (
    <header className="shrink-0 w-full bg-black border-b border-zinc-900 relative z-50">
      <div className="px-6 h-14 flex items-center justify-between gap-4">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[13px] text-zinc-500">Simply-Life</span>
          <span className="text-zinc-700">/</span>
          <span className="text-[14px] font-semibold text-white">{VIEW_LABELS[activeView] || activeView}</span>
        </div>

        {/* Pinned Tabs (center) */}
        {pinnedModules.length > 0 && (
          <nav className="hidden md:flex items-center gap-1">
            {pinnedModules.map((moduleId) => {
              const isActive = activeView === moduleId;
              return (
                <button
                  key={moduleId}
                  onClick={() => navigate(VIEW_TO_PATH[moduleId] || '/')}
                  className={`relative px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'text-white bg-card border border-zinc-900'
                      : 'text-zinc-400 hover:text-white hover:bg-card'
                  }`}
                >
                  {VIEW_LABELS[moduleId] || moduleId}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Search (placeholder) */}
          <div className="hidden lg:flex items-center gap-2 bg-zinc-900/60 border border-zinc-800/50 rounded-lg px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[11px] text-zinc-500">Buscar...</span>
            <kbd className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded ml-4">Ctrl+K</kbd>
          </div>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => { setIsNotifOpen((v) => !v); if (!isNotifOpen) fetchNotificacoes(); }}
              className="relative w-7 h-7 rounded-full bg-zinc-900/60 border border-zinc-800/50 hover:border-zinc-600 transition-colors flex items-center justify-center"
              aria-label="Notificações"
            >
              <Bell className="w-3.5 h-3.5 text-zinc-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 top-9 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-[100]">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800">
                  <span className="text-[12px] font-semibold text-zinc-200">Notificações</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllNotificacoesRead()}
                      className="flex items-center gap-1 text-[11px] text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      <CheckCheck className="w-3 h-3" /> Marcar todas
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notificacoes.length === 0 ? (
                    <div className="px-4 py-6 text-center text-[12px] text-zinc-500">Nenhuma notificação</div>
                  ) : (
                    notificacoes.slice(0, 8).map((n) => {
                      const urgencyBarColor = n.urgencia === 'critica' ? 'bg-rose-500' : n.urgencia === 'alta' ? 'bg-amber-500' : 'bg-zinc-700';
                      const tipoIcon = n.tipo === 'saude' ? Heart : n.tipo === 'tarefa' ? ListTodo : n.tipo === 'financeiro' ? Wallet2 : Info;
                      const TipoIcon = tipoIcon;
                      return (
                      <button
                        key={n.id}
                        onClick={() => { if (!n.lida) markNotificacaoRead(n.id); }}
                        className={`w-full text-left flex items-start hover:bg-zinc-800/60 transition-colors ${
                          !n.lida ? 'bg-zinc-800/30' : ''
                        }`}
                      >
                        {/* Urgency side bar */}
                        <div className={`w-[3px] self-stretch shrink-0 rounded-l-xl ${urgencyBarColor}`} />
                        <div className="flex items-start gap-3 px-3.5 py-2.5 flex-1 min-w-0">
                          <div className="mt-0.5">
                            <TipoIcon className={`w-3.5 h-3.5 ${
                              n.urgencia === 'critica' ? 'text-rose-400' : n.urgencia === 'alta' ? 'text-amber-400' : 'text-zinc-500'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-[12px] truncate ${!n.lida ? 'text-zinc-200 font-medium' : 'text-zinc-400'}`}>
                              {n.titulo}
                            </div>
                            {n.mensagem && (
                              <div className="text-[11px] text-zinc-500 truncate">{n.mensagem}</div>
                            )}
                          </div>
                          {!n.lida && <span className="mt-1.5 w-2 h-2 rounded-full bg-teal-400 shrink-0" />}
                        </div>
                      </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Streak */}
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[12px] font-medium">5</span>
          </div>

          {/* Avatar + Profile Dropdown */}
          <div ref={profileRef} className="relative z-[100]">
            <button
              onClick={() => setIsProfileOpen((v) => !v)}
              className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 transition-colors flex items-center justify-center"
              aria-label="Perfil"
            >
              <User className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-9 w-44 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-[100]">
                <button
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] text-zinc-300 hover:bg-zinc-800 transition-colors"
                  onClick={() => { navigate('/perfil'); setIsProfileOpen(false); }}
                >
                  <User className="w-3.5 h-3.5 text-zinc-500" />
                  Meu Perfil
                </button>
                <button
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] text-zinc-300 hover:bg-zinc-800 transition-colors"
                  onClick={() => { navigate('/configuracoes'); setIsProfileOpen(false); }}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
                  Preferencias
                </button>
                <div className="h-px bg-zinc-800 mx-3" />
                <button
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] text-red-400 hover:bg-zinc-800 transition-colors"
                  onClick={() => { useTaskStore.getState().logout(); setIsProfileOpen(false); }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
