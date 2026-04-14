import { motion } from 'framer-motion';
import {
  CalendarDays, MapPin, Link2, CalendarOff, Clock, AlertTriangle,
} from 'lucide-react';
import { fadeUp, Skeleton } from './DashboardPrimitives';
import type { CalendarEvent, ActiveView } from '../../store/useTaskStore';

export function AgendaSection({
  calendarEvents,
  calendarLoading,
  calendarError,
  googleConnected,
  setActiveView,
}: {
  calendarEvents: CalendarEvent[];
  calendarLoading: boolean;
  calendarError: string | null;
  googleConnected: boolean;
  setActiveView: (view: ActiveView) => void;
}) {
  return (
    <motion.div {...fadeUp}>
      <div className="relative overflow-hidden bg-zinc-950/50 backdrop-blur-2xl border border-white/5 rounded-[2rem] shadow-2xl transition-all duration-300 hover:border-violet-500/20">
        {/* Header */}
        <div className="p-8 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-white">Agenda de Hoje</h3>
                <p className="text-[11px] text-zinc-600">Google Calendar</p>
              </div>
            </div>
            {googleConnected && calendarEvents.length > 0 && (
              <span className="text-[11px] text-zinc-500 tabular-nums px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/10">
                {calendarEvents.length} evento{calendarEvents.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        {calendarLoading ? (
          <div className="px-8 pb-8 space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-12 w-3/4" />
          </div>
        ) : calendarError === '403' ? (
          <ErrorState403 setActiveView={setActiveView} />
        ) : !googleConnected ? (
          <DisconnectedState setActiveView={setActiveView} />
        ) : calendarEvents.length === 0 ? (
          <EmptyState />
        ) : (
          <EventTimeline events={calendarEvents} />
        )}
      </div>
    </motion.div>
  );
}

/* ── Error 403 — Rose accent glass card ──────────────────────── */
function ErrorState403({ setActiveView }: { setActiveView: (v: ActiveView) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
      <div className="w-16 h-16 rounded-[1.5rem] bg-rose-500/10 border border-rose-500/10 flex items-center justify-center mb-5">
        <AlertTriangle className="w-7 h-7 text-rose-400/80" />
      </div>
      <p className="text-[15px] font-semibold text-rose-300 mb-2">Permissao Negada</p>
      <p className="text-[12px] text-rose-200/30 max-w-sm mb-6 leading-relaxed">
        Permissao negada pelo Google. Por favor, reconecte nas Configuracoes e nao esqueca de marcar a caixa de acesso a agenda na tela do Google.
      </p>
      <button
        onClick={() => setActiveView('configuracoes')}
        className="px-5 py-2.5 text-[13px] font-semibold rounded-2xl bg-rose-500/15 text-rose-300 border border-rose-500/15 hover:bg-rose-500/25 hover:border-rose-500/25 transition-all duration-300 flex items-center gap-2"
      >
        <Link2 className="w-4 h-4" />
        Reconectar nas Configuracoes
      </button>
    </div>
  );
}

/* ── Disconnected State ──────────────────────────────────────── */
function DisconnectedState({ setActiveView }: { setActiveView: (v: ActiveView) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-800/30 border border-white/5 flex items-center justify-center mb-5">
        <CalendarOff className="w-7 h-7 text-zinc-600" />
      </div>
      <p className="text-[15px] font-semibold text-zinc-300 mb-2">Agenda Desconectada</p>
      <p className="text-[12px] text-zinc-500 max-w-xs mb-6 leading-relaxed">
        Conecte sua conta Google para visualizar compromissos e eventos do dia
      </p>
      <button
        onClick={() => setActiveView('configuracoes')}
        className="px-5 py-2.5 text-[13px] font-semibold rounded-2xl bg-violet-500/15 text-violet-300 border border-violet-500/15 hover:bg-violet-500/25 hover:border-violet-500/25 transition-all duration-300 flex items-center gap-2"
      >
        <Link2 className="w-4 h-4" />
        Ir para Integracoes
      </button>
    </div>
  );
}

/* ── Empty State ─────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
      <CalendarDays className="w-8 h-8 text-zinc-700 mb-3" />
      <p className="text-[13px] text-zinc-500">Nenhum evento para hoje</p>
      <p className="text-[11px] text-zinc-600 mt-0.5">Seu dia esta livre</p>
    </div>
  );
}

/* ── Event Timeline ──────────────────────────────────────────── */
function EventTimeline({ events }: { events: CalendarEvent[] }) {
  return (
    <div className="px-8 pb-6">
      <div className="border-l-2 border-blue-500/15 ml-3 space-y-0">
        {events.map((ev, i) => {
          const inicio = ev.inicio.includes('T')
            ? new Date(ev.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : 'Dia todo';
          const fim = ev.fim.includes('T')
            ? new Date(ev.fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : '';
          return (
            <div key={i} className="relative pl-6 py-3.5 group">
              {/* Timeline dot */}
              <div className="absolute left-[-5px] top-[20px] w-2 h-2 rounded-full bg-blue-400 ring-4 ring-zinc-950 group-hover:ring-blue-500/10 transition-all" />
              <div className="flex items-start gap-4">
                <div className="shrink-0 pt-0.5 min-w-[60px]">
                  <p className="text-[12px] font-semibold text-blue-400 tabular-nums flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {inicio}
                  </p>
                  {fim && <p className="text-[10px] text-zinc-600 tabular-nums ml-4">{fim}</p>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-zinc-200 truncate">{ev.titulo}</p>
                  {ev.local && (
                    <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 shrink-0" /> {ev.local}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
