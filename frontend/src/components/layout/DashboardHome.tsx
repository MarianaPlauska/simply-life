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
      <div className="relative">
        <HeroSection resumo={resumo} naoLidas={naoLidas} />

        {/* botão de debug — simula email recebido pelo motor de triagem */}
        <button
          id="debug-mock-email"
          onClick={handleMockEmail}
          disabled={mockLoading}
          title="Simular E-mail (debug)"
          className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5
            rounded-xl text-[10px] font-medium tracking-wide uppercase
            bg-zinc-900/60 backdrop-blur-sm border border-white/5
            text-zinc-600 opacity-30 hover:opacity-100
            hover:border-violet-500/30 hover:text-violet-400
            transition-all duration-300 disabled:cursor-wait"
        >
          {mockLoading
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : <Bug className="w-3 h-3" />
          }
          <span>Simular E-mail</span>
        </button>
      </div>

      {/* Camada 0.5 — Onboarding gamificado (some quando completo) */}
      <SetupQuestsSection />

      <KPISection resumo={resumo} tarefasIA={tarefasIA} />

      {/* Camada 1.5 — Inbox IA (e-mails/Teams processados) */}
      <TriagemInboxWidget setActiveView={setActiveView} />

      {/* Camada 2 — Fluxo Tático */}
      <HealthSection resumo={resumo} />

      {/* Camada 2.5 — Gamificação & Score */}
      <FocusScoreSection resumo={resumo} scoreDiario={scoreDiario} />

      {/* Camada 2.7 — Performance Report Card */}
      <ReportCardSection />

      {/* Camada 3 — Radar de Monitoramento */}
      <KeywordsRadarSection keywords={keywords} />

      {/* Camada 3.2 — Radar de Notícias (IA curada) */}
      <NewsRadarSection />

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
