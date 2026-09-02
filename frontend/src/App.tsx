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
import { BentoGridSkeleton } from './components/ui/Skeleton'
import { useTaskStore, type ActiveView } from './store/useTaskStore'
import { applyColorScheme, readDedicatedColorScheme } from './utils/applyColorScheme'
import { AppLayout } from './components/layout/AppLayout'
import { useUserSessionIsolation } from './hooks/useUserSessionIsolation'
import { usePushActionBridge } from './hooks/usePushActionBridge'

const DashboardView = lazy(() => import('./components/layout/DashboardView').then((m) => ({ default: m.DashboardView })))
const KanbanView = lazy(() => import('./components/kanban/KanbanView').then((m) => ({ default: m.KanbanView })))
const AnotacoesView = lazy(() => import('./components/Anotacoes/AnotacoesView').then((m) => ({ default: m.AnotacoesView })))
const FocusImmersiveOverlay = lazy(() => import('./components/FocusModeView').then((m) => ({ default: m.FocusImmersiveOverlay })))
const SettingsView = lazy(() => import('./components/Settings/SettingsView').then((m) => ({ default: m.SettingsView })))
const HealthView = lazy(() => import('./components/Health/HealthView').then((m) => ({ default: m.HealthView })))
const PreferencesView = lazy(() => import('./components/Settings/PreferencesView').then((m) => ({ default: m.PreferencesView })))
const FinancePlannerView = lazy(() => import('./components/Finance/FinancePlannerView').then((m) => ({ default: m.FinancePlannerView })))
const CalendarView = lazy(() => import('./components/Calendar/CalendarView').then((m) => ({ default: m.CalendarView })))
const ProfileView = lazy(() => import('./components/Auth/ProfileView').then((m) => ({ default: m.ProfileView })))
const PreferenciasIA = lazy(() => import('./components/Settings/PreferenciasIA').then((m) => ({ default: m.PreferenciasIA })))
const RelatoriosView = lazy(() => import('./components/Relatorios/RelatoriosView').then((m) => ({ default: m.RelatoriosView })))
const AxelHistoryView = lazy(() => import('./components/axel/AxelHistoryView').then((m) => ({ default: m.AxelHistoryView })))
const SuperhumanView = lazy(() => import('./components/kanban/SuperhumanView').then((m) => ({ default: m.SuperhumanView })))
const HealthDiaryChartsPreview = import.meta.env.DEV
  ? lazy(() => import('./dev/HealthDiaryChartsPreview').then((m) => ({ default: m.HealthDiaryChartsPreview })))
  : null

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
    const scheme = readDedicatedColorScheme() ?? a.colorScheme
    if (scheme !== a.colorScheme)
    {
      useTaskStore.setState({
        accessibility: { ...useTaskStore.getState().accessibility, colorScheme: scheme },
      })
    }
    applyColorScheme(scheme)
    applyWorkspaceTheme()
  }, [a.fontSize, a.highContrast, a.reducedMotion, a.colorScheme, a.focusVisible, applyWorkspaceTheme])
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
  '/superhuman':    'superhuman',
  '/inteligencia':  'inteligencia',
  '/relatorios':    'relatorios',
  '/axel/historico': 'axel-historico',
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
          <Route path="foco" element={<Navigate to="/kanban?foco=1" replace />} />
          <Route path="configuracoes" element={<ErrorBoundary fallbackTitle="Erro nas Configurações"><SettingsView /></ErrorBoundary>} />
          <Route path="financeiro" element={<ErrorBoundary fallbackTitle="Erro no Financeiro"><FinancePlannerView /></ErrorBoundary>} />
          <Route path="saude" element={<ErrorBoundary fallbackTitle="Erro na Saúde"><HealthView /></ErrorBoundary>} />
          <Route path="preferencias" element={<ErrorBoundary fallbackTitle="Erro nas Preferências"><PreferencesView /></ErrorBoundary>} />
          <Route path="perfil" element={<ErrorBoundary fallbackTitle="Erro no Perfil"><ProfileView /></ErrorBoundary>} />
          <Route path="planner" element={<Navigate to="/financeiro" replace />} />
          <Route path="calendario" element={<ErrorBoundary fallbackTitle="Erro no Calendário"><CalendarView /></ErrorBoundary>} />
          <Route path="drive" element={<Navigate to="/configuracoes" replace />} />
          <Route path="superhuman" element={<ErrorBoundary fallbackTitle="Erro no Superhuman"><SuperhumanView /></ErrorBoundary>} />
          <Route path="inteligencia" element={<PreferenciasIA />} />
          <Route path="relatorios" element={<ErrorBoundary fallbackTitle="Erro nos Relatórios"><RelatoriosView /></ErrorBoundary>} />
          <Route path="axel/historico" element={<ErrorBoundary fallbackTitle="Erro no histórico AXEL"><AxelHistoryView /></ErrorBoundary>} />
          <Route path="carreira" element={<Navigate to="/configuracoes" replace />} />
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
  usePushActionBridge()
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
        {import.meta.env.DEV && HealthDiaryChartsPreview && (
          <Route
            path="/__dev/health-diary-charts"
            element={(
              <ErrorBoundary fallbackTitle="Erro no preview">
                <Suspense fallback={<BentoGridSkeleton variant="health" />}>
                  <HealthDiaryChartsPreview />
                </Suspense>
              </ErrorBoundary>
            )}
          />
        )}
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
              <div className="min-h-[100dvh] bg-canvas px-4 py-6">
                <BentoGridSkeleton variant="default" />
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
