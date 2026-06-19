import { useState, useRef, useEffect, useMemo } from 'react'
import { countUrgentDeadlines } from '../../lib/axelAlerts'
import { countAlertasHeader, isNotificacaoLida } from '../../lib/notificacaoUtils'
import { useNavigate } from 'react-router-dom'
import { AxelStreakPopover } from './AxelStreakPopover'
import { MobileSidebarDrawer } from './MobileSidebarDrawer'
import { PinnedNavEditor } from './PinnedNavEditor'
import { AxelPageBack } from './AxelPageBack'
import { NotificationDropdown } from './NotificationDropdown'
import { AxelCompanionAvatar } from '../Onboarding/AxelCompanionAvatar'
import { iniciaisDe } from '../../lib/axelAvatarPresets'
import {
  Search, SlidersHorizontal, LogOut, Bell,
  PanelLeft,
} from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { AccessibilityQuickMenu } from '../dashboard/AccessibilityQuickMenu'
import {
  AXEL_CHROME_PLANE,
  AXEL_HEADER_ACTION,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

import { normalizePinnedModules } from '../../store/slices/uiSlice'

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
  const pinnedModulesRaw = useTaskStore((s) => s.pinnedModules)
  const pinnedModules = useMemo(
    () => normalizePinnedModules(pinnedModulesRaw),
    [pinnedModulesRaw],
  )
  const toggleSidebar = useTaskStore((s) => s.toggleSidebar)
  const setMobileSidebarOpen = useTaskStore((s) => s.setMobileSidebarOpen)
  const sidebarCollapsed = useTaskStore((s) => s.sidebarCollapsed)
  const notificacoes = useTaskStore((s) => s.notificacoes)
  const fetchNotificacoes = useTaskStore((s) => s.fetchNotificacoes)
  const sinoDestaqueAte = useTaskStore((s) => s.sinoDestaqueAte)
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)
  const userProfile = useTaskStore((s) => s.userProfile)

  const profileInitials = iniciaisDe(
    workspacePrefs.axel_calls_you
    || workspacePrefs.display_name
    || userProfile?.nome
    || '',
  )

  const isPinnedActive = pinnedModules.includes(activeView)
  const showBreadcrumbPage = !isPinnedActive

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [sinoAtivo, setSinoAtivo] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const tarefas = useTaskStore((s) => s.tarefas)
  const alertTotal = useMemo(
    () => countAlertasHeader(notificacoes, tarefas),
    [notificacoes, tarefas],
  )
  const urgentDeadlineCount = useMemo(
    () => countUrgentDeadlines(tarefas),
    [tarefas],
  )
  const unreadNotifCount = useMemo(
    () => notificacoes.filter((n) => !isNotificacaoLida(n.lida)).length,
    [notificacoes],
  )

  useEffect(() =>
  {
    fetchNotificacoes()
  }, [fetchNotificacoes])

  useEffect(() =>
  {
    const tick = () =>
    {
      setSinoAtivo(sinoDestaqueAte > Date.now())
    }
    tick()
    const id = window.setInterval(tick, 400)
    return () => window.clearInterval(id)
  }, [sinoDestaqueAte])

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
    <>
      <MobileSidebarDrawer />
      <header className={`shrink-0 w-full border-b border-line relative z-50 ${AXEL_CHROME_PLANE}`}>
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
          <button
            type="button"
            onClick={() =>
            {
              if (window.matchMedia('(min-width: 768px)').matches)
              {
                toggleSidebar()
              }
              else
              {
                setMobileSidebarOpen(true)
              }
            }}
            className="p-2 -ml-1 rounded-sl text-ink-muted hover:text-ink hover:bg-chrome transition-colors shrink-0"
            aria-label={sidebarCollapsed ? 'Abrir menu lateral' : 'Alternar menu lateral'}
            title="Menu"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <AxelPageBack />
          {showBreadcrumbPage && (
            <>
              <span className={`font-mono text-[11px] uppercase tracking-wider hidden sm:inline ${AXEL_TEXT_SECONDARY}`}>Simply-Life</span>
              <span className="text-ink-muted hidden sm:inline">/</span>
              <span className={`text-[13px] sm:text-[14px] font-display truncate ${AXEL_TEXT_PRIMARY}`}>
                {VIEW_LABELS[activeView] || activeView}
              </span>
            </>
          )}
        </div>

        {pinnedModules.length > 0 && (
          <nav className="flex items-center gap-0.5 sm:gap-1 flex-1 justify-center min-w-0 max-w-[50vw] sm:max-w-xl overflow-x-auto scrollbar-none px-1">
            {pinnedModules.map((moduleId) =>
            {
              const isActive = activeView === moduleId
              return (
                <button
                  key={moduleId}
                  type="button"
                  onClick={() => navigate(VIEW_TO_PATH[moduleId] || '/')}
                  className={`relative px-2 sm:px-3 py-1.5 rounded-sl text-[11px] sm:text-[12px] font-mono transition-colors whitespace-nowrap border shrink-0 ${
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

        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
          <PinnedNavEditor />
          <div className="hidden lg:flex items-center gap-2 bg-chrome border border-line rounded-sl px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-ink-muted" />
            <span className={`font-mono text-[11px] ${AXEL_TEXT_SECONDARY}`}>Buscar</span>
          </div>

          <AccessibilityQuickMenu />

          <AxelStreakPopover />

          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => { setIsNotifOpen((v) => !v); if (!isNotifOpen) fetchNotificacoes() }}
              className={`relative ${AXEL_HEADER_ACTION} ${
                sinoAtivo ? 'ring-2 ring-rose-400/70 ring-offset-2 ring-offset-[#08090D] rounded-full animate-pulse' : ''
              }`}
              aria-label={
                alertTotal > 0
                  ? `Notificações: ${unreadNotifCount} não lidas${
                      urgentDeadlineCount > 0 ? `, ${urgentDeadlineCount} prazo(s) em 24h` : ''
                    }`
                  : 'Notificações'
              }
            >
              <Bell className={`w-4 h-4 ${sinoAtivo ? 'text-rose-400' : ''}`} />
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
              <NotificationDropdown onClose={() => setIsNotifOpen(false)} />
            )}
          </div>

          <div ref={profileRef} className="relative z-[100]">
            <button
              type="button"
              onClick={() => setIsProfileOpen((v) => !v)}
              className="w-9 h-9 rounded-sl border border-line hover:border-accent/40 transition-colors flex items-center justify-center bg-card overflow-hidden"
              aria-label="Perfil"
            >
              <AxelCompanionAvatar
                style={workspacePrefs.avatar_style}
                initials={profileInitials}
                size={32}
              />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-10 w-44 rounded-sl border border-line bg-card shadow-lg overflow-hidden z-[100]">
                <button
                  type="button"
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] hover:bg-chrome transition-colors ${AXEL_TEXT_PRIMARY}`}
                  onClick={() => { navigate('/perfil'); setIsProfileOpen(false) }}
                >
                  <span className="w-6 h-6 shrink-0 overflow-hidden rounded-sl">
                    <AxelCompanionAvatar
                      style={workspacePrefs.avatar_style}
                      initials={profileInitials}
                      size={24}
                    />
                  </span>
                  Meu Perfil
                </button>
                <button
                  type="button"
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] hover:bg-chrome transition-colors ${AXEL_TEXT_PRIMARY}`}
                  onClick={() => { navigate('/configuracoes'); setIsProfileOpen(false) }}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-ink-muted" />
                  Preferências
                </button>
                <div className="h-px bg-line mx-3" />
                <button
                  type="button"
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] text-urgente hover:bg-chrome transition-colors"
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
    </>
  )
}
