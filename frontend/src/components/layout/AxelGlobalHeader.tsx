import { useState, useRef, useEffect, useMemo } from 'react'
import { countAlertasHeader } from '../../lib/notificacaoUtils'
import { useNavigate } from 'react-router-dom'
import { MobileSidebarDrawer } from './MobileSidebarDrawer'
import { PinnedNavEditor } from './PinnedNavEditor'
import { AxelPageBack } from './AxelPageBack'
import { NotificationDropdown } from './NotificationDropdown'
import { AxelCompanionAvatar } from '../Onboarding/AxelCompanionAvatar'
import { iniciaisDe } from '../../lib/axelAvatarPresets'
import {
  SlidersHorizontal, LogOut, Bell,
  PanelLeft, Sparkles,
} from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { AccessibilityQuickMenu } from '../dashboard/AccessibilityQuickMenu'
import {
  AXEL_GLASS_CHROME,
  AXEL_HEADER_ACTION,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
  AXEL_TOUCH_PRESS,
} from '../../constants/axelSurfaces'

import { normalizePinnedModules, PINNED_DASHBOARD_ID } from '../../store/slices/uiSlice'

// Header global AXEL — navegação, notificações e acessibilidade em todas as páginas

const VIEW_TO_PATH: Record<string, string> = {
  dashboard: '/',
  kanban: '/kanban',
  anotacoes: '/anotacoes',
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
    () => normalizePinnedModules(Array.isArray(pinnedModulesRaw) ? pinnedModulesRaw : []),
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
  const setAxelAskOpen = useTaskStore((s) => s.setAxelAskOpen)
  const userStats = useTaskStore((s) => s.userStats)

  const profileInitials = iniciaisDe(
    workspacePrefs.axel_calls_you
    || workspacePrefs.display_name
    || userProfile?.nome
    || '',
  )

  const isPinnedActive = pinnedModules.includes(activeView)
  // Com atalhos fixos, o título da página fica no conteúdo — evita 3+ rótulos no header
  const showBreadcrumbPage = !isPinnedActive && pinnedModules.length === 0

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [sinoAtivo, setSinoAtivo] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const tarefas = useTaskStore((s) => s.tarefas)
  const billSettlements = useTaskStore((s) => s.billSettlements)
  const transactions = useTaskStore((s) => s.transactions)
  const alertCtx = useMemo(
    () => ({ settlements: billSettlements, transactions }),
    [billSettlements, transactions],
  )
  const alertTotal = useMemo(
    () => countAlertasHeader(notificacoes, tarefas, alertCtx),
    [notificacoes, tarefas, alertCtx],
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
      <header className={`sl-glass-chrome shrink-0 w-full border-b relative z-50 overflow-visible ${AXEL_GLASS_CHROME}`}>
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 min-h-14 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 sm:gap-x-3">
        <div className="flex items-center gap-0.5 sm:gap-1 min-w-0 justify-self-start">
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
            className={`sl-touch p-2 -ml-1 rounded-sl text-ink-muted hover:text-ink hover:bg-chrome shrink-0 ${AXEL_TOUCH_PRESS}`}
            aria-label={sidebarCollapsed ? 'Abrir menu lateral' : 'Alternar menu lateral'}
            title="Menu"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <AxelPageBack />
          {showBreadcrumbPage && (
            <>
              <span className={`font-mono text-[11px] uppercase tracking-wider hidden md:inline ${AXEL_TEXT_SECONDARY}`}>Simply-Life</span>
              <span className="text-ink-muted hidden md:inline">/</span>
              <span className={`text-[13px] sm:text-[14px] font-display truncate max-w-[7rem] sm:max-w-[12rem] md:max-w-none ${AXEL_TEXT_PRIMARY}`}>
                {VIEW_LABELS[activeView] || activeView}
              </span>
            </>
          )}
        </div>

        {pinnedModules.length > 0 || !isPinnedActive ? (
          <nav
            className="flex items-center justify-center gap-0.5 sm:gap-1 justify-self-center min-w-0 max-w-full overflow-x-auto scrollbar-none px-0.5"
            aria-label="Atalhos fixos"
          >
            {pinnedModules.map((moduleId) =>
            {
              if (moduleId === PINNED_DASHBOARD_ID)
              {
                return (
                  <button
                    key={moduleId}
                    type="button"
                    onClick={() => navigate(VIEW_TO_PATH[moduleId] || '/')}
                    className={`sl-touch relative hidden sm:inline-flex px-2 sm:px-2.5 py-1.5 rounded-sl text-[10px] sm:text-[12px] font-mono whitespace-nowrap border shrink-0 ${AXEL_TOUCH_PRESS} ${
                      activeView === moduleId
                        ? 'text-ink bg-accent-muted border-accent/30'
                        : 'text-ink-muted border-transparent hover:text-ink hover:bg-chrome'
                    }`}
                  >
                    {VIEW_LABELS[moduleId] || moduleId}
                  </button>
                )
              }

              const isActive = activeView === moduleId
              const label = VIEW_LABELS[moduleId] || moduleId
              return (
                <button
                  key={moduleId}
                  type="button"
                  onClick={() => navigate(VIEW_TO_PATH[moduleId] || '/')}
                  className={`sl-touch relative px-2 sm:px-2.5 py-1.5 rounded-sl text-[10px] sm:text-[12px] font-mono whitespace-nowrap border shrink-0 ${AXEL_TOUCH_PRESS} ${
                    isActive
                      ? 'text-ink bg-accent-muted border-accent/30'
                      : 'text-ink-muted border-transparent hover:text-ink hover:bg-chrome'
                  }`}
                >
                  {label}
                </button>
              )
            })}
            {!isPinnedActive && (
              <span
                className="px-2 sm:px-2.5 py-1.5 rounded-sl text-[10px] sm:text-[12px] font-mono whitespace-nowrap border shrink-0 text-ink bg-accent-muted border-accent/30"
                aria-current="page"
              >
                {VIEW_LABELS[activeView] || activeView}
              </span>
            )}
          </nav>
        ) : (
          <div aria-hidden />
        )}

        <div className="flex items-center gap-0.5 sm:gap-1 min-w-0 justify-self-end">
          <div className="hidden md:flex items-center gap-0.5">
            <PinnedNavEditor />
          </div>

          <button
            type="button"
            onClick={() => setAxelAskOpen(true)}
            className={`sl-touch relative p-2 rounded-sl border border-accent/30 bg-accent/10 hover:bg-accent/15 ${AXEL_TOUCH_PRESS}`}
            aria-label="Consultar AXEL — posso fazer isso hoje?"
            title="Consultar AXEL"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            {(userStats?.level ?? 1) < 3 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-atencao ring-2 ring-card" aria-hidden />
            )}
          </button>

          <AccessibilityQuickMenu />

          <div ref={notifRef} className="relative z-[200]">
            <button
              type="button"
              onClick={() => { setIsNotifOpen((v) => !v); if (!isNotifOpen) fetchNotificacoes() }}
              className={`relative ${AXEL_HEADER_ACTION} ${
                sinoAtivo ? 'ring-2 ring-rose-400/70 ring-offset-2 ring-offset-[#08090D] rounded-full animate-pulse' : ''
              }`}
              aria-label={
                alertTotal > 0
                  ? `Notificações: ${alertTotal} alerta${alertTotal !== 1 ? 's' : ''}`
                  : 'Notificações'
              }
            >
              <Bell className={`w-4 h-4 ${sinoAtivo ? 'text-rose-400' : ''}`} />
              {alertTotal > 0 && (
                <span
                  className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse ring-2 ring-[#08090D]"
                  aria-hidden
                />
              )}
              {alertTotal > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 text-white text-[10px] font-bold font-mono rounded-full flex items-center justify-center px-1 bg-red-500 animate-pulse"
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
              className={`sl-touch w-9 h-9 rounded-sl border border-line hover:border-accent/40 flex items-center justify-center bg-card overflow-hidden ${AXEL_TOUCH_PRESS}`}
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
                  Configurações
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
