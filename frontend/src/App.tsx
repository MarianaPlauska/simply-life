// frontend/src/App.tsx
import { Toaster } from 'sonner';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { GlassHeader } from './components/layout/GlassHeader';
import { DashboardHome } from './components/layout/DashboardHome';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { AnotacoesView } from './components/Anotacoes/AnotacoesView';
import { FocusModeView } from './components/FocusModeView';
import { SettingsView } from './components/Settings/SettingsView';
import { FinanceView } from './components/Finance/FinanceView';
import { HealthView } from './components/Health/HealthView';
import { PreferencesView } from './components/Settings/PreferencesView';
import { FinancePlannerView } from './components/Finance/FinancePlannerView';
import { CalendarView } from './components/Calendar/CalendarView';
import { DriveVaultView } from './components/Drive/DriveVaultView';
import { QuickCaptureModal } from './components/Anotacoes/QuickCaptureModal';
import { LoginView } from './components/Auth/LoginView';
import { ProfileView } from './components/Auth/ProfileView';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { GoogleCallbackView } from './components/Auth/GoogleCallbackView';
import { useTaskStore, type ActiveView } from './store/useTaskStore';
import { useEffect, useRef } from 'react';
import { CalendarDays, Briefcase, Brain, Rocket } from 'lucide-react';

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

/* ── Route ↔ ActiveView mapping ──────────────────────────────── */
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
};

const VIEW_TO_PATH: Record<ActiveView, string> = Object.fromEntries(
  Object.entries(ROUTE_MAP).map(([path, view]) => [view, path])
) as Record<ActiveView, string>;

/**
 * Bidirectional sync: URL ↔ Zustand activeView.
 * - URL change → updates activeView in store
 * - setActiveView() anywhere in the app → navigates to the correct URL
 */
function NavigationSync() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeView = useTaskStore((s) => s.activeView);
  const setActiveView = useTaskStore((s) => s.setActiveView);
  const lastPathRef = useRef(location.pathname);
  const lastViewRef = useRef(activeView);

  // URL → Store
  useEffect(() => {
    const viewFromUrl = ROUTE_MAP[location.pathname];
    if (viewFromUrl && viewFromUrl !== activeView) {
      lastViewRef.current = viewFromUrl;
      setActiveView(viewFromUrl);
    }
    lastPathRef.current = location.pathname;
  }, [location.pathname, activeView, setActiveView]);

  // Store → URL (for setActiveView calls from buttons, nudges, etc.)
  useEffect(() => {
    const pathForView = VIEW_TO_PATH[activeView];
    if (pathForView && pathForView !== location.pathname && activeView !== lastViewRef.current) {
      navigate(pathForView, { replace: false });
    }
    lastViewRef.current = activeView;
  }, [activeView, location.pathname, navigate]);

  return null;
}

/* ── Layout shell (Header + Sidebar + routed content) ──────── */
function AppLayout() {
  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-200 overflow-hidden">
      <QuickCaptureModal />
      <NavigationSync />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <GlassHeader />
        <main className="flex-1 overflow-y-auto px-6 pt-6 pb-8" role="main">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="kanban" element={<KanbanBoard />} />
            <Route path="anotacoes" element={<AnotacoesView />} />
            <Route path="foco" element={<FocusModeView />} />
            <Route path="configuracoes" element={<SettingsView />} />
            <Route path="financeiro" element={<FinanceView />} />
            <Route path="saude" element={<HealthView />} />
            <Route path="preferencias" element={<PreferencesView />} />
            <Route path="perfil" element={<ProfileView />} />
            <Route path="planner" element={<FinancePlannerView />} />
            <Route path="calendario" element={<CalendarView />} />
            <Route path="drive" element={<DriveVaultView />} />
            <Route path="superhuman" element={
              <PlaceholderView title="Agenda" subtitle="Conecte sua conta Google para sincronizar eventos e compromissos." icon={CalendarDays} />
            } />
            <Route path="inteligencia" element={
              <PlaceholderView title="Motor de Inteligência" subtitle="O filtro de keywords está ativo nas Preferências. Configure suas palavras-chave para triagem automática." icon={Brain} />
            } />
            <Route path="carreira" element={
              <PlaceholderView title="Radar de Carreira" subtitle="Monitoramento de vagas e oportunidades profissionais será ativado em breve." icon={Briefcase} />
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  useAccessibilityInit();

  return (
    <>
      <Toaster theme="dark" position="bottom-right" richColors />
      <Routes>
        <Route path="/login" element={<LoginView />} />
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