// frontend/src/App.tsx
import { lazy, Suspense } from 'react';
import { Toaster } from 'sonner';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { GlassHeader } from './components/layout/GlassHeader';
import { QuickCaptureModal } from './components/Anotacoes/QuickCaptureModal';
import { LoginView } from './components/Auth/LoginView';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { GoogleCallbackView } from './components/Auth/GoogleCallbackView';
import { ResetPasswordView } from './components/Auth/ResetPasswordView';
import { CommandPalette } from './components/ui/CommandPalette';
import { AmbientBackground } from './components/ui/AmbientBackground';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useTaskStore, type ActiveView } from './store/useTaskStore';
import { useEffect, useRef } from 'react';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { OnboardingChecklist } from './components/Onboarding/OnboardingChecklist';
import { Briefcase, Rocket } from 'lucide-react';

// Lazy-loaded views
const DashboardHome    = lazy(() => import('./components/layout/DashboardHome').then((m) => ({ default: m.DashboardHome })));
const KanbanBoard      = lazy(() => import('./components/kanban/KanbanBoard').then((m) => ({ default: m.KanbanBoard })));
const AnotacoesView    = lazy(() => import('./components/Anotacoes/AnotacoesView').then((m) => ({ default: m.AnotacoesView })));
const FocusModeView    = lazy(() => import('./components/FocusModeView').then((m) => ({ default: m.FocusModeView })));
const FocusImmersiveOverlay = lazy(() => import('./components/FocusModeView').then((m) => ({ default: m.FocusImmersiveOverlay })));
const SettingsView     = lazy(() => import('./components/Settings/SettingsView').then((m) => ({ default: m.SettingsView })));
const HealthView       = lazy(() => import('./components/Health/HealthView').then((m) => ({ default: m.HealthView })));
const PreferencesView  = lazy(() => import('./components/Settings/PreferencesView').then((m) => ({ default: m.PreferencesView })));
const FinancePlannerView = lazy(() => import('./components/Finance/FinancePlannerView').then((m) => ({ default: m.FinancePlannerView })));
const CalendarView     = lazy(() => import('./components/Calendar/CalendarView').then((m) => ({ default: m.CalendarView })));
const DriveVaultView   = lazy(() => import('./components/Drive/DriveVaultView').then((m) => ({ default: m.DriveVaultView })));
const ProfileView      = lazy(() => import('./components/Auth/ProfileView').then((m) => ({ default: m.ProfileView })));
const PreferenciasIA   = lazy(() => import('./components/Settings/PreferenciasIA').then((m) => ({ default: m.PreferenciasIA })));
const RelatoriosView   = lazy(() => import('./components/Relatorios/RelatoriosView').then((m) => ({ default: m.RelatoriosView })));
const SuperhumanView   = lazy(() => import('./components/kanban/SuperhumanView').then((m) => ({ default: m.SuperhumanView })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-violet-500 animate-spin" />
    </div>
  );
}

function useAccessibilityInit() {
  const a = useTaskStore((s) => s.accessibility);
  useEffect(() => {
    document.documentElement.style.fontSize = `${a.fontSize}px`;
    document.documentElement.classList.toggle('high-contrast', a.highContrast);
    document.documentElement.classList.toggle('reduce-motion', a.reducedMotion);
  }, [a.fontSize, a.highContrast, a.reducedMotion]);
}

function PlaceholderView({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon?: React.ElementType }) {
  const ViewIcon = Icon || Rocket;
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] gap-4">
      <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 border border-zinc-700/40 flex items-center justify-center">
        <ViewIcon className="w-6 h-6 text-zinc-500" />
      </div>
      <div className="text-center">
        <p className="text-zinc-200 text-lg font-semibold">{title}</p>
        <p className="text-zinc-500 text-sm mt-1 max-w-md">{subtitle}</p>
      </div>
    </div>
  );
}

/* ── ActiveView mapping ──────────────────────────────── */
const ROUTE_MAP: Record<string, ActiveView> = {
  '/':              'dashboard',
  '/kanban':        'kanban',
  '/anotacoes':     'anotacoes',
  '/foco':          'foco',
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
};

const VIEW_TO_PATH: Record<ActiveView, string> = Object.fromEntries(
  Object.entries(ROUTE_MAP).map(([path, view]) => [view, path])
) as Record<ActiveView, string>;

function NavigationSync() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeView = useTaskStore((s) => s.activeView);
  const setActiveView = useTaskStore((s) => s.setActiveView);
  // flag que impede o efeito de URL disparar navegação de volta
  const isUpdating = useRef(false);

  // url mudou → sincroniza o store
  useEffect(() =>
  {
    if ( isUpdating.current ) return;
    const viewFromUrl = ROUTE_MAP[location.pathname];
    if ( viewFromUrl && viewFromUrl !== activeView )
    {
      isUpdating.current = true;
      setActiveView(viewFromUrl);
      // libera o lock no próximo tick
      requestAnimationFrame(() => { isUpdating.current = false; });
    }
  }, [location.pathname, activeView, setActiveView]);

  // store mudou → sincroniza a url
  useEffect(() =>
  {
    if ( isUpdating.current ) return;
    const pathForView = VIEW_TO_PATH[activeView];
    if ( pathForView && pathForView !== location.pathname )
    {
      isUpdating.current = true;
      navigate(pathForView, { replace: false });
      requestAnimationFrame(() => { isUpdating.current = false; });
    }
  }, [activeView, location.pathname, navigate]);

  return null;
}

/* ── Layout ──────── */
function AppLayout() {
  const mainRef = useRef<HTMLElement>(null);
  useRealtimeSync();
  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-200 overflow-hidden">
      <AmbientBackground scrollContainerRef={mainRef} />
      <QuickCaptureModal />
      <CommandPalette />
      <NavigationSync />
      <Suspense fallback={null}>
        <FocusImmersiveOverlay />
      </Suspense>
      <Sidebar />
      <OnboardingChecklist />
      <div className="flex-1 flex flex-col min-w-0">
        <GlassHeader />
        <main ref={mainRef} className="flex-1 overflow-y-auto px-6 pt-6 pb-8" role="main">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route index element={<ErrorBoundary fallbackTitle="Erro no Dashboard"><DashboardHome /></ErrorBoundary>} />
              <Route path="kanban" element={<ErrorBoundary fallbackTitle="Erro no Kanban"><KanbanBoard /></ErrorBoundary>} />
              <Route path="anotacoes" element={<ErrorBoundary fallbackTitle="Erro nas Anotações"><AnotacoesView /></ErrorBoundary>} />
              <Route path="foco" element={<ErrorBoundary fallbackTitle="Erro no Modo Foco"><FocusModeView /></ErrorBoundary>} />
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
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function App() {
  useAccessibilityInit();
  const checkSession = useTaskStore((s) => s.checkSession);

  // restaura sessão do supabase ao abrir o app
  useEffect(() =>
  {
    checkSession();
  }, [checkSession]);

  return (
    <>
      <Toaster theme="dark" position="bottom-right" richColors />
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route path="/reset-password" element={<ResetPasswordView />} />
        <Route path="/google-callback" element={<GoogleCallbackView />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;