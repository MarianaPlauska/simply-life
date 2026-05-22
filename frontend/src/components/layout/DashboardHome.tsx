import { useEffect, useRef, useState } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { Skeleton, CardSkeleton } from '../dashboard/DashboardPrimitives';
import { HeroSection } from '../dashboard/HeroSection';
import { SetupQuestsSection } from '../dashboard/SetupQuestsSection';
import { KPISection } from '../dashboard/KPISection';
import { HealthSection } from '../dashboard/HealthSection';
import { KeywordsRadarSection } from '../dashboard/KeywordsRadarSection';
import { FocusScoreSection } from '../dashboard/FocusScoreSection';
import { SmartNudgesSection } from '../dashboard/SmartNudgesSection';
import { ReportCardSection } from '../dashboard/ReportCardSection';
import { AgendaSection } from '../dashboard/AgendaSection';
import { TriagemInboxWidget } from '../dashboard/TriagemInboxWidget';
import { NewsRadarSection } from '../dashboard/NewsRadarSection';
import { AvatarStatusWidget } from '../dashboard/AvatarStatusWidget';
import { ActiveQuestsList } from '../dashboard/ActiveQuestsList';
import { ExecutionLineSection } from '../dashboard/ExecutionLineSection';
import { Bug, Loader2 } from 'lucide-react';


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
  const simularEmail = useTaskStore((s) => s.simularEmailRecebido);
  const fetchPalavrasChave = useTaskStore((s) => s.fetchPalavrasChave);
  const cards = useTaskStore((s) => s.cards);
  const contasFixas = useTaskStore((s) => s.contasFixas);
  const medicamentos = useTaskStore((s) => s.medicamentos);
  const runFinanceCheck = useTaskStore((s) => s.runFinanceCheck);
  const runHealthCheck = useTaskStore((s) => s.runHealthCheck);
  const hasFetched = useRef(false);
  const [mockLoading, setMockLoading] = useState(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    // carrega em lotes de 2 pra não estourar o limite de sockets do chrome
    const init = async () =>
    {
      await Promise.all([fetchDashboard(), fetchTarefas()]);
      await Promise.all([fetchNotificacoes(), fetchPreferencias()]);
      await Promise.all([fetchPalavrasChave(), checkGoogleStatus()]);
      fetchCalendarEvents();
      // Rodar os verificadores ativos
      await runFinanceCheck();
      await runHealthCheck();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // dispara a simulação de email pelo motor de triagem
  const handleMockEmail = async () =>
  {
    if ( mockLoading ) return;
    setMockLoading(true);
    try
    {
      await simularEmail(
        'E-mail do Diretor: Mariana, por favor, verifique aquele pagamento urgente da plataforma.',
        'Diretoria'
      );
    }
    finally
    {
      setMockLoading(false);
    }
  };

  const naoLidas = resumo?.notificacoes_nao_lidas ?? notificacoes.filter((n) => !n.lida).length;
  const tarefasIA = tarefas.filter((t) => t.origem && t.origem !== 'manual' && t.prioridade === 'critica').length;

  /* ── Loading State ─────────────────────────────────────────── */
  if (loading && !resumo) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-8 pb-16">
        <div className="space-y-2">
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-3 w-[380px]" />
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
    <>
      <div className="max-w-6xl mx-auto p-4 space-y-4 pb-16 text-zinc-50">
        {/* Camada 1 — Hero (saudacao + status) */}
        <div className="relative">
          <HeroSection resumo={resumo} naoLidas={naoLidas} />

          <button
            id="debug-mock-email"
            onClick={handleMockEmail}
            disabled={mockLoading}
            title="Simular E-mail (debug)"
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1
              rounded text-[10px] font-medium tracking-wide uppercase
              bg-card border border-zinc-900
              text-zinc-600 opacity-30 hover:opacity-100
              hover:border-violet-500/30 hover:text-violet-400
              transition-colors disabled:cursor-wait"
          >
            {mockLoading
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <Bug className="w-3 h-3" />
            }
            <span>Simular E-mail</span>
          </button>
        </div>

        {/* Onboarding — some quando completo */}
        <SetupQuestsSection />

        {/* LAYOUT ORION — 2 colunas no topo: execucao ativa + avatar status */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">
          <div className="space-y-4 min-w-0">
            <ExecutionLineSection />
            <KPISection resumo={resumo} tarefasIA={tarefasIA} />
            <TriagemInboxWidget setActiveView={setActiveView} />
          </div>

          <div className="space-y-4">
            <AvatarStatusWidget />
            <ActiveQuestsList />
          </div>
        </div>

        {/* Camada 2 — Saude + Foco */}
        <HealthSection resumo={resumo} />

        <FocusScoreSection resumo={resumo} scoreDiario={scoreDiario} />

        <ReportCardSection />

        {/* Camada 3 — Radares */}
        <KeywordsRadarSection keywords={keywords} />

        <NewsRadarSection />

        <SmartNudgesSection
          resumo={resumo}
          calendarEvents={calendarEvents}
          saldoMes={resumo?.saldo_mes ?? 0}
          keywords={keywords}
          cards={cards}
          contasFixas={contasFixas}
          medicamentos={medicamentos}
          setActiveView={setActiveView}
        />

        <AgendaSection
          calendarEvents={calendarEvents}
          calendarLoading={calendarLoading}
          calendarError={calendarError}
          googleConnected={googleConnected}
          setActiveView={setActiveView}
        />
      </div>
    </>
  );
}
