import { useState, useRef, useEffect, useMemo } from 'react'
import { countUrgentDeadlines } from '../../lib/axelAlerts'
import { useNavigate } from 'react-router-dom'
import { AxelStreakPopover } from './AxelStreakPopover'
import {
  Search, User, SlidersHorizontal, LogOut, Bell,
  CheckCheck, Info, Heart, ListTodo, Wallet2,
} from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { AccessibilityQuickMenu } from '../dashboard/AccessibilityQuickMenu'
import {
  AXEL_CHROME_PLANE,
  AXEL_HEADER_ACTION,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

// Header global AXEL — navegação, notificações e acessibilidade em todas as páginas

const VIEW_TO_PATH: Record<string, string> = {
  dashboard: '/',
  kanban: '/kanban',
  anotacoes: '/anotacoes',
  foco: '/foco',
  configuracoes: '/configuracoes',
  superhuman: '/superhuman',
  financeiro: '/financeiro',
  saude: '/saude',
  inteligencia: '/inteligencia',
  carreira: '/carreira',
  preferencias: '/preferencias',
  planner: '/planner',
  calendario: '/calendario',
  drive: '/drive',
  perfil: '/perfil',
  relatorios: '/relatorios',
}

const VIEW_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  kanban: 'Kanban',
  anotacoes: 'Anotações',
  foco: 'Modo Academia',
  configuracoes: 'Configurações',
  superhuman: 'Foco Superhumano',
  financeiro: 'Finanças',
  saude: 'Saúde',
  inteligencia: 'Inteligência',
  carreira: 'Integrações',
  preferencias: 'Preferências IA',
  planner: 'Planejador',
  calendario: 'Calendário',
  drive: 'Vault / Drive',
  perfil: 'Meu Perfil',
  relatorios: 'Relatórios',
}

export function AxelGlobalHeader()
{
  const navigate = useNavigate()
  const activeView = useTaskStore((s) => s.activeView)
  const pinnedModules = useTaskStore((s) => s.pinnedModules)
  const notificacoes = useTaskStore((s) => s.notificacoes)
  const fetchNotificacoes = useTaskStore((s) => s.fetchNotificacoes)
  const markNotificacaoRead = useTaskStore((s) => s.markNotificacaoRead)
  const markAllNotificacoesRead = useTaskStore((s) => s.markAllNotificacoesRead)

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const tarefas = useTaskStore((s) => s.tarefas)
  const unreadCount = notificacoes.filter((n) => !n.lida).length
  const urgentDeadlineCount = useMemo(
    () => countUrgentDeadlines(tarefas),
    [tarefas],
  )
  const alertTotal = unreadCount + urgentDeadlineCount

  useEffect(() =>
  {
    fetchNotificacoes()
  }, [fetchNotificacoes])

  useEffect(() =>
  {
    function handleClickOutside(e: MouseEvent)
    {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setIsProfileOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setIsNotifOpen(false)
    }
    if (isProfileOpen || isNotifOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isProfileOpen, isNotifOpen])

  return (
    <header className={`shrink-0 w-full border-b border-line relative z-50 ${AXEL_CHROME_PLANE}`}>
      <div className="px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <span className={`font-mono text-[11px] uppercase tracking-wider hidden sm:inline ${AXEL_TEXT_SECONDARY}`}>Simply-Life</span>
          <span className="text-ink-muted hidden sm:inline">/</span>
          <span className={`text-[14px] font-display truncate ${AXEL_TEXT_PRIMARY}`}>
            {VIEW_LABELS[activeView] || activeView}
          </span>
        </div>

        {pinnedModules.length > 0 && (
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center max-w-xl overflow-x-auto">
            {pinnedModules.map((moduleId) =>
            {
              const isActive = activeView === moduleId
              return (
                <button
                  key={moduleId}
                  type="button"
                  onClick={() => navigate(VIEW_TO_PATH[moduleId] || '/')}
                  className={`relative px-3 py-1.5 rounded-sl text-[12px] font-mono transition-colors whitespace-nowrap border ${
                    isActive
                      ? 'text-ink bg-accent-muted border-accent/30'
                      : 'text-ink-muted border-transparent hover:text-ink hover:bg-chrome'
                  }`}
                >
                  {VIEW_LABELS[moduleId] || moduleId}
                </button>
              )
            })}
          </nav>
        )}

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-2 bg-chrome border border-line rounded-sl px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-ink-muted" />
            <span className={`font-mono text-[11px] ${AXEL_TEXT_SECONDARY}`}>Buscar</span>
            <kbd className="font-mono text-[10px] text-ink-muted bg-elevated border border-line px-1.5 py-0.5 rounded-sl ml-3">⌘K</kbd>
          </div>

          <AccessibilityQuickMenu />

          <AxelStreakPopover />

          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => { setIsNotifOpen((v) => !v); if (!isNotifOpen) fetchNotificacoes() }}
              className={`relative ${AXEL_HEADER_ACTION}`}
              aria-label="Notificações"
            >
              <Bell className="w-4 h-4" />
              {urgentDeadlineCount > 0 && (
                <span
                  className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse ring-2 ring-[#08090D]"
                  aria-hidden
                />
              )}
              {alertTotal > 0 && (
                <span
                  className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-4 text-white text-[10px] font-bold font-mono rounded-full flex items-center justify-center px-1 ${
                    urgentDeadlineCount > 0
                      ? 'bg-red-500 animate-pulse'
                      : 'bg-rose-500'
                  }`}
                >
                  {alertTotal > 9 ? '9+' : alertTotal}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 top-10 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-[100]">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800">
                  <span className={`text-[12px] font-semibold ${AXEL_TEXT_PRIMARY}`}>Notificações</span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllNotificacoesRead()}
                      className="flex items-center gap-1 text-[11px] text-teal-600 dark:text-teal-400 hover:text-teal-500 transition-colors"
                    >
                      <CheckCheck className="w-3 h-3" /> Marcar todas
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notificacoes.length === 0 ? (
                    <div className={`px-4 py-6 text-center text-[12px] ${AXEL_TEXT_SECONDARY}`}>Nenhuma notificação</div>
                  ) : (
                    notificacoes.slice(0, 8).map((n) =>
                    {
                      const urgencyBarColor = n.urgencia === 'critica' ? 'bg-rose-500' : n.urgencia === 'alta' ? 'bg-amber-500' : 'bg-zinc-400 dark:bg-zinc-700'
                      const tipoIcon = n.tipo === 'saude' ? Heart : n.tipo === 'tarefa' ? ListTodo : n.tipo === 'financeiro' ? Wallet2 : Info
                      const TipoIcon = tipoIcon
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => { if (!n.lida) markNotificacaoRead(n.id) }}
                          className={`w-full text-left flex items-start hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors ${
                            !n.lida ? 'bg-zinc-50 dark:bg-zinc-800/30' : ''
                          }`}
                        >
                          <div className={`w-[3px] self-stretch shrink-0 ${urgencyBarColor}`} />
                          <div className="flex items-start gap-3 px-3.5 py-2.5 flex-1 min-w-0">
                            <TipoIcon className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className={`text-[12px] truncate ${!n.lida ? `font-medium ${AXEL_TEXT_PRIMARY}` : AXEL_TEXT_SECONDARY}`}>
                                {n.titulo}
                              </div>
                              {n.mensagem && (
                                <div className={`text-[11px] truncate ${AXEL_TEXT_SECONDARY}`}>{n.mensagem}</div>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div ref={profileRef} className="relative z-[100]">
            <button
              type="button"
              onClick={() => setIsProfileOpen((v) => !v)}
              className={`w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors flex items-center justify-center bg-zinc-100 dark:bg-zinc-800`}
              aria-label="Perfil"
            >
              <User className="w-3.5 h-3.5 text-zinc-500" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-10 w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-[100]">
                <button
                  type="button"
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${AXEL_TEXT_PRIMARY}`}
                  onClick={() => { navigate('/perfil'); setIsProfileOpen(false) }}
                >
                  <User className="w-3.5 h-3.5 text-zinc-500" />
                  Meu Perfil
                </button>
                <button
                  type="button"
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${AXEL_TEXT_PRIMARY}`}
                  onClick={() => { navigate('/configuracoes'); setIsProfileOpen(false) }}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
                  Preferências
                </button>
                <div className="h-px bg-zinc-200 dark:bg-zinc-800 mx-3" />
                <button
                  type="button"
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] text-red-500 dark:text-red-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  onClick={() => { useTaskStore.getState().logout(); setIsProfileOpen(false) }}
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
  )
}
