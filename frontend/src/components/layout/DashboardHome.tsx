import { useEffect, useRef } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { Skeleton, CardSkeleton } from '../dashboard/DashboardPrimitives';
import { HeroSection } from '../dashboard/HeroSection';
import { KPISection } from '../dashboard/KPISection';
import { HealthSection } from '../dashboard/HealthSection';
import { KeywordsRadarSection } from '../dashboard/KeywordsRadarSection';
import { FocusScoreSection } from '../dashboard/FocusScoreSection';
import { SmartNudgesSection } from '../dashboard/SmartNudgesSection';
import { AgendaSection } from '../dashboard/AgendaSection';


export function DashboardHome() {
  const fetchDashboard = useTaskStore((s) => s.fetchDashboard);
  const resumo = useTaskStore((s) => s.dashboardResumo);
  const loading = useTaskStore((s) => s.dashboardLoading);
  const notificacoes = useTaskStore((s) => s.notificacoes);
  const fetchNotificacoes = useTaskStore((s) => s.fetchNotificacoes);
  const calendarEvents = useTaskStore((s) => s.calendarEvents);
  const calendarLoading = useTaskStore((s) => s.calendarLoading);
  const calendarError = useTaskStore((s) => s.calendarError);
  const fetchCalendarEvents = useTaskStore((s) => s.fetchCalendarEvents);
  const googleConnected = useTaskStore((s) => s.googleCalendarConnected);
  const checkGoogleStatus = useTaskStore((s) => s.checkGoogleStatus);
  const setActiveView = useTaskStore((s) => s.setActiveView);
  const keywords = useTaskStore((s) => s.keywords);
  const scoreDiario = useTaskStore((s) => s.scoreDiario);
  const fetchPreferencias = useTaskStore((s) => s.fetchPreferencias);
  const tarefas = useTaskStore((s) => s.tarefas);
  const fetchTarefas = useTaskStore((s) => s.fetchTarefas);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchDashboard();
    fetchNotificacoes();
    fetchPreferencias();
    fetchTarefas();
    checkGoogleStatus().then(() => fetchCalendarEvents());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const naoLidas = resumo?.notificacoes_nao_lidas ?? notificacoes.filter((n) => !n.lida).length;
  const tarefasIA = tarefas.filter((t) => t.origem && t.origem !== 'manual' && t.prioridade === 'critica').length;

  /* ── Loading State ─────────────────────────────────────────── */
  if (loading && !resumo) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-12 pb-24">
        <div className="space-y-3">
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-4 w-[420px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-16 pb-24 text-zinc-50">
      {/* Camada 1 — Contexto Imediato */}
      <HeroSection resumo={resumo} naoLidas={naoLidas} />
      <KPISection resumo={resumo} tarefasIA={tarefasIA} />

      {/* Camada 2 — Fluxo Tático */}
      <HealthSection resumo={resumo} />

      {/* Camada 2.5 — Gamificação & Score */}
      <FocusScoreSection resumo={resumo} scoreDiario={scoreDiario} />

      {/* Camada 3 — Radar de Monitoramento */}
      <KeywordsRadarSection keywords={keywords} />

      {/* Camada 3.5 — Insights Proativos (JARVIS) */}
      <SmartNudgesSection
        resumo={resumo}
        calendarEvents={calendarEvents}
        saldoMes={resumo?.saldo_mes ?? 0}
        keywords={keywords}
        setActiveView={setActiveView}
      />

      {/* Camada 4 — Agenda */}
      <AgendaSection
        calendarEvents={calendarEvents}
        calendarLoading={calendarLoading}
        calendarError={calendarError}
        googleConnected={googleConnected}
        setActiveView={setActiveView}
      />
    </div>
  );
}
