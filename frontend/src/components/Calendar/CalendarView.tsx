import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';

/* ── Tipos ── */
interface CalendarEvent {
  id: number;
  titulo: string;
  data: string; // YYYY-MM-DD
  hora: string;
  cor: 'blue' | 'red' | 'amber' | 'emerald' | 'ia';
  local?: string;
}

const EVENT_COLORS: Record<string, { pill: string; dot: string; text: string }> = {
  blue: { pill: 'bg-blue-500/15 text-blue-400 border-blue-500/20', dot: 'bg-blue-500', text: 'text-blue-400' },
  red: { pill: 'bg-red-500/15 text-red-400 border-red-500/20', dot: 'bg-red-500', text: 'text-red-400' },
  amber: { pill: 'bg-amber-500/15 text-amber-400 border-amber-500/20', dot: 'bg-amber-500', text: 'text-amber-400' },
  emerald: { pill: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500', text: 'text-emerald-400' },
  ia: { pill: 'bg-ia/15 text-ia border-ia/20', dot: 'bg-ia', text: 'text-ia' },
};

const MOCK_EVENTS: CalendarEvent[] = [
  { id: 1, titulo: 'Daily Stand-up', data: '2026-01-12', hora: '09:00', cor: 'blue', local: 'Google Meet' },
  { id: 2, titulo: 'Entrega Sprint 14', data: '2026-01-15', hora: '17:00', cor: 'red' },
  { id: 3, titulo: 'Almoço com equipe', data: '2026-01-15', hora: '12:30', cor: 'emerald', local: 'Restaurante Bossa' },
  { id: 4, titulo: '1:1 com gestor', data: '2026-01-20', hora: '10:00', cor: 'amber', local: 'Zoom' },
  { id: 5, titulo: 'Sessão IA Review', data: '2026-01-22', hora: '14:00', cor: 'ia' },
  { id: 6, titulo: 'Code Review', data: '2026-01-08', hora: '11:00', cor: 'blue' },
  { id: 7, titulo: 'Hackathon interno', data: '2026-01-28', hora: '08:00', cor: 'emerald', local: 'Escritório' },
  { id: 8, titulo: 'Deploy produção', data: '2026-01-30', hora: '22:00', cor: 'red' },
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function CalendarView() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const monthLabel = new Date(year, month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    MOCK_EVENTS.forEach((ev) => {
      const d = new Date(ev.data + 'T12:00:00');
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(ev);
      }
    });
    return map;
  }, [year, month]);

  const selectedEvents = selectedDay ? (eventsByDay[selectedDay] || []) : [];

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
    setSelectedDay(null);
  };

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Calendário</h1>
        <p className="text-sm text-zinc-500 mt-1">Visão mensal dos seus compromissos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Calendar Grid ── */}
        <div className="lg:col-span-3 rounded-2xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-sm p-6">
          {/* Month Nav */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-zinc-800/60 transition-colors">
              <ChevronLeft className="w-5 h-5 text-zinc-400" />
            </button>
            <span className="text-[15px] font-semibold text-white capitalize">{monthLabel}</span>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-zinc-800/60 transition-colors">
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[11px] font-semibold text-zinc-500 uppercase tracking-wider py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = eventsByDay[day] || [];
              const selected = selectedDay === day;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square flex flex-col items-center justify-start pt-2 rounded-xl transition-all relative ${
                    selected
                      ? 'bg-ia/10 ring-1 ring-ia/30'
                      : 'hover:bg-zinc-800/30'
                  }`}
                >
                  <span
                    className={`text-[13px] font-semibold w-7 h-7 flex items-center justify-center rounded-full ${
                      isToday(day)
                        ? 'bg-ia text-white'
                        : selected ? 'text-ia' : 'text-zinc-300'
                    }`}
                  >
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-1">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <div key={ev.id} className={`w-1.5 h-1.5 rounded-full ${EVENT_COLORS[ev.cor].dot}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Day Agenda Sidebar ── */}
        <div className="lg:col-span-1 rounded-2xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-sm p-5">
          <h3 className="text-[14px] font-semibold text-white mb-4">
            {selectedDay
              ? new Date(year, month, selectedDay).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', weekday: 'long' })
              : 'Selecione um dia'}
          </h3>

          {selectedEvents.length === 0 ? (
            <p className="text-[12px] text-zinc-500">Nenhum evento neste dia.</p>
          ) : (
            <div className="space-y-3">
              {selectedEvents
                .sort((a, b) => a.hora.localeCompare(b.hora))
                .map((ev) => {
                  const colors = EVENT_COLORS[ev.cor];
                  return (
                    <div
                      key={ev.id}
                      className={`rounded-xl border p-3 ${colors.pill}`}
                    >
                      <p className="text-[13px] font-semibold">{ev.titulo}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="w-3 h-3" />
                        <span className="text-[11px]">{ev.hora}</span>
                      </div>
                      {ev.local && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span className="text-[11px]">{ev.local}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
