import { useState, useRef, useEffect, useMemo } from 'react'
import { countAlertasHeader } from '../../lib/notificacaoUtils'
import { useNavigate } from 'react-router-dom'
import { MobileSidebarDrawer } from './MobileSidebarDrawer'
import { PinnedNavEditor } from './PinnedNavEditor'
import { AxelPageBack } from './AxelPageBack'
import { NotificationDropdown } from './NotificationDropdown'
import { AxelCompanionAvatar } from '../Onboarding/AxelCompanionAvatar'
import { iniciaisDe } from '../../lib/axelAvatarPresets'
import { Bell, LogOut, PanelLeft, SlidersHorizontal, Sparkles, Accessibility } from 'lucide-react'
import { CapturePlusButton } from '../capture/CapturePlusButton'
import { useTaskStore } from '../../store/useTaskStore'
import { AccessibilityPanel } from '../dashboard/AccessibilityQuickMenu'
import { ICON } from '../../design/identityTokens'
import {
  AXEL_GLASS_CHROME,
  AXEL_HEADER_ACTION,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
  AXEL_TOUCH_PRESS,
} from '../../constants/axelSurfaces'

import { normalizePinnedModules, PINNED_DASHBOARD_ID } from '../../store/slices/uiSlice'
import { SimplyLifeMark } from '../brand/SimplyLifeMark'

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

  const profileInitials = iniciaisDe(
    workspacePrefs.axel_calls_you
    || workspacePrefs.display_name
    || userProfile?.nome
    || '',
  )

  const isPinnedActive = pinnedModules.includes(activeView)
  const extraPins = pinnedModules.filter((id) => id !== PINNED_DASHBOARD_ID)
  const showCenterNav = extraPins.length > 0 || (activeView !== 'dashboard' && !isPinnedActive)
  const showBreadcrumbPage = !isPinnedActive && pinnedModules.length === 0

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [appearanceOpen, setAppearanceOpen] = useState(false)
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
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
      {
        setIsProfileOpen(false)
        setAppearanceOpen(false)
      }
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
            className={`sl-touch -ml-1 ${AXEL_HEADER_ACTION} shrink-0`}
            aria-label={sidebarCollapsed ? 'Abrir menu lateral' : 'Alternar menu lateral'}
            title="Menu"
          >
            <PanelLeft size={ICON.sizeNav} strokeWidth={ICON.stroke} />
          </button>
          <AxelPageBack />
          {showBreadcrumbPage && (
            <>
              <SimplyLifeMark variant="icon" className="w-7 h-7 hidden md:block" />
              <span className={`text-[11px] font-sans tracking-wide hidden md:inline ${AXEL_TEXT_SECONDARY}`}>Simply-Life</span>
              <span className="text-ink-muted hidden md:inline">/</span>
              <span className={`text-[13px] sm:text-[14px] font-display truncate max-w-[7rem] sm:max-w-[12rem] md:max-w-none ${AXEL_TEXT_PRIMARY}`}>
                {VIEW_LABELS[activeView] || activeView}
              </span>
            </>
          )}
        </div>

        {showCenterNav ? (
          <nav
            className="flex items-center justify-center gap-0.5 sm:gap-1 justify-self-center min-w-0 max-w-full overflow-x-auto scrollbar-none px-0.5"
            aria-label="Atalhos fixos"
          >
            {extraPins.map((moduleId) =>
            {
              const isActive = activeView === moduleId
              const label = VIEW_LABELS[moduleId] || moduleId
              return (
                <button
                  key={moduleId}
                  type="button"
                  onClick={() => navigate(VIEW_TO_PATH[moduleId] || '/')}
                  className={`sl-touch relative px-2.5 py-1.5 rounded-sl text-[13px] font-sans font-medium whitespace-nowrap border shrink-0 ${AXEL_TOUCH_PRESS} ${
                    isActive
                      ? 'text-ink bg-chrome border-line'
                      : 'text-ink-muted border-transparent hover:text-ink hover:bg-chrome'
                  }`}
                >
                  {label}
                </button>
              )
            })}
            {activeView !== 'dashboard' && !isPinnedActive && (
              <span
                className="px-2.5 py-1.5 rounded-sl text-[13px] font-sans font-medium whitespace-nowrap border shrink-0 text-ink bg-chrome border-line"
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

          <CapturePlusButton placement="header" />

          <button
            type="button"
            onClick={() => setAxelAskOpen(true)}
            className={`sl-touch ${AXEL_HEADER_ACTION} text-axel hover:text-axel hover:bg-axel-muted`}
            aria-label="Consultar AXEL. Posso fazer isso hoje?"
            title="Consultar AXEL"
          >
            <Sparkles size={ICON.sizeNav} strokeWidth={ICON.stroke} className="text-axel" />
          </button>

          <div ref={notifRef} className="relative z-[200]">
            <button
              type="button"
              onClick={() => { setIsNotifOpen((v) => !v); if (!isNotifOpen) fetchNotificacoes() }}
              className={`relative ${AXEL_HEADER_ACTION} ${
                sinoAtivo ? 'ring-2 ring-urgente/70 ring-offset-2 ring-offset-chrome rounded-sl' : ''
              }`}
              aria-label={
                alertTotal > 0
                  ? `Notificações: ${alertTotal} alerta${alertTotal !== 1 ? 's' : ''}`
                  : 'Notificações'
              }
            >
              <Bell size={ICON.sizeNav} strokeWidth={ICON.stroke} className={sinoAtivo ? 'text-urgente' : ''} />
              {alertTotal > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 text-fundo text-[10px] font-bold rounded-full flex items-center justify-center px-1 bg-urgente"
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
              className={`sl-touch w-9 h-9 rounded-full overflow-hidden ${AXEL_TOUCH_PRESS} hover:opacity-90`}
              aria-label="Perfil"
            >
              <AxelCompanionAvatar
                style={workspacePrefs.avatar_style}
                initials={profileInitials}
                size={32}
              />
            </button>

            {isProfileOpen && (
              <div className={`absolute right-0 top-10 rounded-sl border border-line bg-card shadow-lg overflow-hidden z-[100] ${appearanceOpen ? 'w-72' : 'w-44'}`}>
                {appearanceOpen ? (
                  <div>
                    <button
                      type="button"
                      className={`w-full px-3.5 py-2.5 text-left text-[12px] hover:bg-chrome border-b border-line ${AXEL_TEXT_SECONDARY}`}
                      onClick={() => setAppearanceOpen(false)}
                    >
                      Voltar
                    </button>
                    <AccessibilityPanel variant="menu" />
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] hover:bg-chrome transition-colors ${AXEL_TEXT_PRIMARY}`}
                      onClick={() => { navigate('/perfil'); setIsProfileOpen(false); setAppearanceOpen(false) }}
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
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] hover:bg-chrome transition-colors ${AXEL_TEXT_PRIMARY}`}
                      onClick={() => setAppearanceOpen(true)}
                    >
                      <Accessibility className="w-3.5 h-3.5 text-ink-muted" />
                      Aparência
                    </button>
                    <button
                      type="button"
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] hover:bg-chrome transition-colors ${AXEL_TEXT_PRIMARY}`}
                      onClick={() => { navigate('/configuracoes'); setIsProfileOpen(false); setAppearanceOpen(false) }}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-ink-muted" />
                      Configurações
                    </button>
                    <div className="h-px bg-line mx-3" />
                    <button
                      type="button"
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-urgente hover:bg-chrome transition-colors"
                      onClick={() => { useTaskStore.getState().logout(); setIsProfileOpen(false) }}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sair
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
    </>
  )
}
