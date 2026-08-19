// frontend/src/App.tsx
import { lazy, Suspense, useEffect, useRef } from 'react'
import { Toaster } from 'sonner'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { LoginView } from './components/Auth/LoginView'
import { PrivacyView } from './components/legal/PrivacyView'
import { TermsView } from './components/legal/TermsView'
import { ProtectedRoute } from './components/Auth/ProtectedRoute'
import { SetupGuard } from './components/Auth/SetupGuard'
import { JoinFriendView } from './components/Auth/JoinFriendView'
import { GoogleCallbackView } from './components/Auth/GoogleCallbackView'
import { AuthCallbackView } from './components/Auth/AuthCallbackView'
import { ResetPasswordView } from './components/Auth/ResetPasswordView'
import { AxelSetupWizard } from './components/Onboarding/AxelSetupWizard'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { AxelLoader } from './components/ui/AxelLoader'
import { useTaskStore, type ActiveView } from './store/useTaskStore'
import { applyColorScheme } from './utils/applyColorScheme'
import { AppLayout } from './components/layout/AppLayout'
import { Briefcase, Rocket } from 'lucide-react'
import { useUserSessionIsolation } from './hooks/useUserSessionIsolation'

const DashboardView = lazy(() => import('./components/layout/DashboardView').then((m) => ({ default: m.DashboardView })))
const KanbanView = lazy(() => import('./components/kanban/KanbanView').then((m) => ({ default: m.KanbanView })))
const AnotacoesView = lazy(() => import('./components/Anotacoes/AnotacoesView').then((m) => ({ default: m.AnotacoesView })))
const FocusImmersiveOverlay = lazy(() => import('./components/FocusModeView').then((m) => ({ default: m.FocusImmersiveOverlay })))
const SettingsView = lazy(() => import('./components/Settings/SettingsView').then((m) => ({ default: m.SettingsView })))
const HealthView = lazy(() => import('./components/Health/HealthView').then((m) => ({ default: m.HealthView })))
const PreferencesView = lazy(() => import('./components/Settings/PreferencesView').then((m) => ({ default: m.PreferencesView })))
const FinancePlannerView = lazy(() => import('./components/Finance/FinancePlannerView').then((m) => ({ default: m.FinancePlannerView })))
const CalendarView = lazy(() => import('./components/Calendar/CalendarView').then((m) => ({ default: m.CalendarView })))
const DriveVaultView = lazy(() => import('./components/Drive/DriveVaultView').then((m) => ({ default: m.DriveVaultView })))
const ProfileView = lazy(() => import('./components/Auth/ProfileView').then((m) => ({ default: m.ProfileView })))
const PreferenciasIA = lazy(() => import('./components/Settings/PreferenciasIA').then((m) => ({ default: m.PreferenciasIA })))
const RelatoriosView = lazy(() => import('./components/Relatorios/RelatoriosView').then((m) => ({ default: m.RelatoriosView })))
const SuperhumanView = lazy(() => import('./components/kanban/SuperhumanView').then((m) => ({ default: m.SuperhumanView })))

function useAccessibilityInit()
{
  const a = useTaskStore((s) => s.accessibility)
  const applyWorkspaceTheme = useTaskStore((s) => s.applyWorkspaceTheme)
  useEffect(() =>
  {
    document.documentElement.style.fontSize = `${a.fontSize}px`
    document.documentElement.classList.toggle('high-contrast', a.highContrast)
    document.documentElement.classList.toggle('reduce-motion', a.reducedMotion)
    document.documentElement.classList.toggle('focus-enhanced', a.focusVisible)
    applyColorScheme(a.colorScheme)
    applyWorkspaceTheme()
  }, [a.fontSize, a.highContrast, a.reducedMotion, a.colorScheme, a.focusVisible, applyWorkspaceTheme])
}

function PlaceholderView({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon?: React.ElementType })
{
  const ViewIcon = Icon || Rocket
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-[50vh] gap-4 px-6">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/40 flex items-center justify-center">
        <ViewIcon className="w-6 h-6 text-zinc-500" />
      </div>
      <div className="text-center">
        <p className="text-zinc-900 dark:text-zinc-200 text-lg font-semibold">{title}</p>
        <p className="text-zinc-500 text-sm mt-1 max-w-md">{subtitle}</p>
      </div>
    </div>
  )
}

const ROUTE_MAP: Record<string, ActiveView> = {
  '/':              'dashboard',
  '/kanban':        'kanban',
  '/kanban/board':  'kanban',
  '/anotacoes':     'anotacoes',
  '/configuracoes': 'configuracoes',
  '/financeiro':    'financeiro',
  '/saude':         'saude',
  '/preferencias':  'preferencias',
  '/perfil':        'perfil',
  '/planner':       'planner',
  '/calendario':    'calendario',
  '/drive':         'drive',
  '/superhuman':    'superhuman',
  '/inteligencia':  'inteligencia',
  '/carreira':      'carreira',
  '/relatorios':    'relatorios',
}

const VIEW_TO_PATH: Record<ActiveView, string> = Object.fromEntries(
  Object.entries(ROUTE_MAP)
    .filter(([path]) => path !== '/kanban/board')
    .map(([path, view]) => [view, path]),
) as Record<ActiveView, string>

function NavigationSync()
{
  const location = useLocation()
  const navigate = useNavigate()
  const activeView = useTaskStore((s) => s.activeView)
  const setActiveView = useTaskStore((s) => s.setActiveView)
  const isUpdating = useRef(false)

  useEffect(() =>
  {
    if (isUpdating.current) return
    const viewFromUrl = ROUTE_MAP[location.pathname]
    if (viewFromUrl && viewFromUrl !== activeView)
    {
      isUpdating.current = true
      setActiveView(viewFromUrl)
      requestAnimationFrame(() => { isUpdating.current = false })
    }
  }, [location.pathname, activeView, setActiveView])

  useEffect(() =>
  {
    if (isUpdating.current) return
    const pathForView = VIEW_TO_PATH[activeView]
    if (pathForView && pathForView !== location.pathname)
    {
      isUpdating.current = true
      navigate(pathForView, { replace: false })
      requestAnimationFrame(() => { isUpdating.current = false })
    }
  }, [activeView, location.pathname, navigate])

  return null
}

function AppShell()
{
  return (
    <>
      <NavigationSync />
      <SetupGuard>
        <Routes>
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
          <Route index element={
            <ErrorBoundary fallbackTitle="Erro no Dashboard">
              <DashboardView />
            </ErrorBoundary>
          } />
          <Route path="kanban" element={
            <ErrorBoundary fallbackTitle="Erro no Kanban">
              <KanbanView />
            </ErrorBoundary>
          } />
          <Route path="kanban/board" element={<Navigate to="/kanban" replace />} />
          <Route path="anotacoes" element={<ErrorBoundary fallbackTitle="Erro nas Anotações"><AnotacoesView /></ErrorBoundary>} />
          <Route path="foco" element={<Navigate to="/saude#academia" replace />} />
          <Route path="configuracoes" element={<ErrorBoundary fallbackTitle="Erro nas Configurações"><SettingsView /></ErrorBoundary>} />
          <Route path="financeiro" element={<ErrorBoundary fallbackTitle="Erro no Financeiro"><FinancePlannerView /></ErrorBoundary>} />
          <Route path="saude" element={<ErrorBoundary fallbackTitle="Erro na Saúde"><HealthView /></ErrorBoundary>} />
          <Route path="preferencias" element={<ErrorBoundary fallbackTitle="Erro nas Preferências"><PreferencesView /></ErrorBoundary>} />
          <Route path="perfil" element={<ErrorBoundary fallbackTitle="Erro no Perfil"><ProfileView /></ErrorBoundary>} />
          <Route path="planner" element={<Navigate to="/financeiro" replace />} />
          <Route path="calendario" element={<ErrorBoundary fallbackTitle="Erro no Calendário"><CalendarView /></ErrorBoundary>} />
          <Route path="drive" element={<ErrorBoundary fallbackTitle="Erro no Drive"><DriveVaultView /></ErrorBoundary>} />
          <Route path="superhuman" element={<ErrorBoundary fallbackTitle="Erro no Superhuman"><SuperhumanView /></ErrorBoundary>} />
          <Route path="inteligencia" element={<PreferenciasIA />} />
          <Route path="relatorios" element={<ErrorBoundary fallbackTitle="Erro nos Relatórios"><RelatoriosView /></ErrorBoundary>} />
          <Route path="carreira" element={
            <PlaceholderView title="Radar de Carreira" subtitle="Monitoramento de vagas e oportunidades profissionais será ativado em breve." icon={Briefcase} />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        </Routes>
      </SetupGuard>
    </>
  )
}

function App()
{
  useAccessibilityInit()
  useUserSessionIsolation()
  const fetchWorkspacePrefs = useTaskStore((s) => s.fetchWorkspacePrefs)
  const colorScheme = useTaskStore((s) => s.accessibility.colorScheme)

  useEffect(() =>
  {
    void fetchWorkspacePrefs()
  }, [fetchWorkspacePrefs])

  return (
    <>
      <Toaster
        theme={colorScheme === 'dark' ? 'dark' : 'light'}
        position="bottom-right"
        richColors
        duration={5000}
        closeButton
        visibleToasts={2}
      />
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route path="/privacidade" element={<PrivacyView />} />
        <Route path="/termos" element={<TermsView />} />
        <Route path="/reset-password" element={<ResetPasswordView />} />
        <Route path="/auth/callback" element={<AuthCallbackView />} />
        <Route path="/google-callback" element={<GoogleCallbackView />} />
        <Route path="/join/:code" element={<JoinFriendView />} />
        <Route
          path="/setup"
          element={
            <ProtectedRoute>
              <ErrorBoundary fallbackTitle="Erro no wizard AXEL">
                <AxelSetupWizard />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route path="/*" element={
          <>
            <Suspense fallback={null}>
              <FocusImmersiveOverlay />
            </Suspense>
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-fundo gap-3">
                <AxelLoader />
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                  Carregando…
                </p>
              </div>
            }>
              <AppShell />
            </Suspense>
          </>
        } />
      </Routes>
    </>
  )
}

export default App
