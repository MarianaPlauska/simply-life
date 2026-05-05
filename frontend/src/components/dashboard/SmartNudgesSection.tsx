import { motion } from 'framer-motion';
import {
  Lightbulb, AlertTriangle, Pill, TrendingDown,
  CalendarClock, DollarSign, Sparkles, ArrowRight,
  Activity, Target,
} from 'lucide-react';
import { fadeUp, staggerContainer, staggerChild } from './DashboardPrimitives';
import type { DashboardResumo, CalendarEvent, ActiveView } from '../../store/useTaskStore';

/* ══════════════════════════════════════════════════════════════
   SmartNudgesSection — Proactive AI Insights
   Analyses the current state of the user's day and generates
   contextual "nudges" — short, actionable suggestions that
   anticipate needs before the user asks.  This is the core
   JARVIS behaviour: proactive + context-aware.
   ══════════════════════════════════════════════════════════════ */

interface Nudge {
  id: string;
  icon: React.ElementType;
  title: string;
  body: string;
  accent: string;        // tailwind gradient
  accentBorder: string;  // border on hover
  action?: { label: string; view: ActiveView };
}

interface SmartNudgesProps {
  resumo: DashboardResumo | null;
  calendarEvents: CalendarEvent[];
  saldoMes: number;
  keywords: string[];
  setActiveView: (v: ActiveView) => void;
}

/* ── Nudge generation engine ─────────────────────────────────── */
function generateNudges({
  resumo,
  calendarEvents,
  saldoMes,
  keywords,
}: Omit<SmartNudgesProps, 'setActiveView'>): Nudge[] {
  const nudges: Nudge[] = [];
  if (!resumo) return nudges;

  // 1. Critical tasks overdue
  if (resumo.tarefas_criticas > 0) {
    nudges.push({
      id: 'critical',
      icon: AlertTriangle,
      title: `${resumo.tarefas_criticas} tarefa${resumo.tarefas_criticas > 1 ? 's' : ''} critica${resumo.tarefas_criticas > 1 ? 's' : ''} pendente${resumo.tarefas_criticas > 1 ? 's' : ''}`,
      body: 'Score de urgencia >= 100. Considere resolver antes de qualquer outra atividade.',
      accent: 'from-red-500/20 to-rose-500/10',
      accentBorder: 'hover:border-red-500/20',
      action: { label: 'Ver Kanban', view: 'kanban' },
    });
  }

  // 2. Medications not taken
  if (resumo.medicamentos_total > 0 && resumo.medicamentos_tomados < resumo.medicamentos_total) {
    const faltam = resumo.medicamentos_total - resumo.medicamentos_tomados;
    nudges.push({
      id: 'meds',
      icon: Pill,
      title: `${faltam} medicamento${faltam > 1 ? 's' : ''} pendente${faltam > 1 ? 's' : ''}`,
      body: 'Nao esqueca de registrar seus medicamentos para manter o streak de saude.',
      accent: 'from-emerald-500/20 to-teal-500/10',
      accentBorder: 'hover:border-emerald-500/20',
      action: { label: 'Ir para Saude', view: 'saude' },
    });
  }

  // 3. Habits below 50%
  if ((resumo.habitos ?? []).length > 0 && resumo.habitos_progresso_pct < 50) {
    nudges.push({
      id: 'habits-low',
      icon: Activity,
      title: 'Habitos abaixo de 50%',
      body: `Progresso atual: ${resumo.habitos_progresso_pct.toFixed(0)}%. Registre pelo menos um habito agora para ganhar momentum.`,
      accent: 'from-cyan-500/20 to-blue-500/10',
      accentBorder: 'hover:border-cyan-500/20',
      action: { label: 'Ir para Saude', view: 'saude' },
    });
  }

  // 4. Upcoming meeting soon (within 30 min)
  const now = new Date();
  const soon = calendarEvents.find((ev) => {
    if (!ev.inicio.includes('T')) return false;
    const start = new Date(ev.inicio);
    const diff = (start.getTime() - now.getTime()) / 60000;
    return diff > 0 && diff <= 30;
  });
  if (soon) {
    const startTime = new Date(soon.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    nudges.push({
      id: 'meeting-soon',
      icon: CalendarClock,
      title: `Reuniao em breve: ${startTime}`,
      body: soon.titulo + (soon.local ? ` — ${soon.local}` : ''),
      accent: 'from-blue-500/20 to-indigo-500/10',
      accentBorder: 'hover:border-blue-500/20',
      action: { label: 'Ver Agenda', view: 'calendario' },
    });
  }

  // 5. Negative monthly balance
  if (saldoMes < 0) {
    nudges.push({
      id: 'budget',
      icon: DollarSign,
      title: 'Saldo mensal negativo',
      body: `Voce esta ${Math.abs(saldoMes).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} acima do orcamento. Revise seus gastos.`,
      accent: 'from-rose-500/20 to-red-500/10',
      accentBorder: 'hover:border-rose-500/20',
      action: { label: 'Ver Financas', view: 'planner' },
    });
  }

  // 6. Budget OK but daily spend high (>30% of remaining)
  if (saldoMes > 0 && resumo.despesas_dia > 0) {
    const dayRatio = resumo.despesas_dia / saldoMes;
    if (dayRatio > 0.3) {
      nudges.push({
        id: 'spend-high',
        icon: TrendingDown,
        title: 'Gasto diario elevado',
        body: `Voce gastou ${(dayRatio * 100).toFixed(0)}% do saldo restante do mes em um unico dia. Considere conter gastos.`,
        accent: 'from-amber-500/20 to-orange-500/10',
        accentBorder: 'hover:border-amber-500/20',
        action: { label: 'Ver Financas', view: 'planner' },
      });
    }
  }

  // 7. No keywords configured
  if (keywords.length === 0) {
    nudges.push({
      id: 'no-keywords',
      icon: Target,
      title: 'Radar desativado',
      body: 'Configure suas Palavras-Chave de Foco para que o motor de triagem priorize seus e-mails automaticamente.',
      accent: 'from-violet-500/20 to-indigo-500/10',
      accentBorder: 'hover:border-violet-500/20',
      action: { label: 'Ir para Configuracoes', view: 'configuracoes' },
    });
  }

  // 8. Perfect day! (positive reinforcement)
  if (
    resumo.tarefas_criticas === 0 &&
    resumo.medicamentos_total > 0 && resumo.medicamentos_tomados === resumo.medicamentos_total &&
    resumo.habitos_progresso_pct >= 100
  ) {
    nudges.push({
      id: 'perfect',
      icon: Sparkles,
      title: 'Dia Perfeito!',
      body: 'Todas as tarefas criticas resolvidas, medicamentos em dia e habitos 100%. Continue assim!',
      accent: 'from-amber-500/20 to-yellow-500/10',
      accentBorder: 'hover:border-amber-500/20',
    });
  }

  return nudges;
}

/* ── Component ───────────────────────────────────────────────── */
export function SmartNudgesSection(props: SmartNudgesProps) {
  const nudges = generateNudges(props);

  if (nudges.length === 0) return null; // Nothing to suggest — no noise

  return (
    <motion.div {...fadeUp}>
      <div className="relative overflow-hidden bg-zinc-950/50 backdrop-blur-2xl border border-white/5 rounded-[2rem] shadow-2xl transition-all duration-300 hover:border-violet-500/20">
        {/* Subtle glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(168,85,247,0.04),transparent_50%)] pointer-events-none" />

        <div className="p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center relative">
              <Lightbulb className="w-5 h-5 text-violet-400" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-white">Insights Proativos</h3>
              <p className="text-[11px] text-zinc-600">
                {nudges.length} sugestao{nudges.length !== 1 ? 'es' : ''} baseada{nudges.length !== 1 ? 's' : ''} no seu dia
              </p>
            </div>
          </div>

          {/* Nudge list */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="space-y-3"
          >
            {nudges.map((nudge) => (
              <NudgeCard key={nudge.id} nudge={nudge} setActiveView={props.setActiveView} />
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Individual Nudge Card ───────────────────────────────────── */
function NudgeCard({
  nudge,
  setActiveView,
}: {
  nudge: Nudge;
  setActiveView: (v: ActiveView) => void;
}) {
  const Icon = nudge.icon;

  return (
    <motion.div
      variants={staggerChild}
      className={`group relative rounded-2xl border border-white/5 bg-gradient-to-r ${nudge.accent} backdrop-blur-sm p-4 transition-all duration-300 ${nudge.accentBorder}`}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <Icon className="w-4.5 h-4.5 text-zinc-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-zinc-200">{nudge.title}</p>
          <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{nudge.body}</p>
        </div>
        {nudge.action && (
          <button
            onClick={() => setActiveView(nudge.action!.view)}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-zinc-300 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300"
          >
            {nudge.action.label}
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
