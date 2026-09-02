import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, CalendarDays } from 'lucide-react';
import { useTaskStore, type CalendarEvent } from '../../store/useTaskStore';
import { AXEL_PAGE_GUTTER, AXEL_PAGE_SHELL } from '../../constants/axelSurfaces';
import { tarefasToCalendarEvents } from '../../lib/tarefasToCalendarEvents';
import { PageIntro } from '../layout/PageIntro';

/* ── Adapt store events to local display model ── */
interface DisplayEvent {
  id: string;
  titulo: string;
  data: string; // YYYY-MM-DD
  hora: string;
  cor: string;
  local?: string;
}

const EVENT_COLORS: Record<string, { pill: string; dot: string; text: string }> = {
  tasks: { pill: 'bg-tasks-muted text-tasks border-tasks/25', dot: 'bg-tasks', text: 'text-tasks' },
  health: { pill: 'bg-health-muted text-health border-health/25', dot: 'bg-health', text: 'text-health' },
  finance: { pill: 'bg-finance-muted text-finance border-finance/25', dot: 'bg-finance', text: 'text-finance' },
}

const COLOR_CYCLE = ['tasks', 'health', 'finance']

function storeToDisplay(events: CalendarEvent[]): DisplayEvent[] {
  return events.map((ev, i) => {
    const start = new Date(ev.inicio);
    return {
      id: `${ev.titulo}-${ev.inicio}-${i}`,
      titulo: ev.titulo,
      data: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
      hora: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
      cor: COLOR_CYCLE[i % COLOR_CYCLE.length],
      local: ev.local ?? undefined,
    };
  });
}

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

  const tarefas = useTaskStore((s) => s.tarefas);
  const storeEvents = useTaskStore((s) => s.calendarEvents);

  const displayEvents = useMemo(() => {
    const fromTasks = tarefasToCalendarEvents(tarefas);
    return storeToDisplay([...fromTasks, ...storeEvents]);
  }, [tarefas, storeEvents]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const monthLabel = new Date(year, month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const eventsByDay = useMemo(() => {
    const map: Record<number, DisplayEvent[]> = {};
    displayEvents.forEach((ev) => {
      const d = new Date(ev.data + 'T12:00:00');
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(ev);
      }
    });
    return map;
  }, [displayEvents, year, month]);

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
    <div className={`${AXEL_PAGE_SHELL} ${AXEL_PAGE_GUTTER} pb-16`}>
      <div className="mb-6">
        <PageIntro
          title="Calendário"
          lede="Compromissos e prazos do dia."
        />
      </div>

      {displayEvents.length === 0 && (
        <div className="mb-6 rounded-sl border border-line bg-card p-10 flex flex-col items-center gap-3 text-center">
          <CalendarDays className="w-10 h-10 text-ink-muted" />
          <p className="text-sm text-ink-muted">Nenhum compromisso com data.</p>
          <p className="text-xs text-ink-faint">Despeje a cabeça no + — o lote com horário aparece aqui.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Calendar Grid ── */}
        <div className="lg:col-span-3 rounded-sl border border-line bg-card p-6">
         
          <div className="flex items-center justify-between mb-6">
            <button type="button" onClick={prevMonth} className="p-2 rounded-sl hover:bg-chrome min-h-11 min-w-11 inline-flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-ink-muted" />
            </button>
            <span className="text-[15px] font-semibold text-ink capitalize">{monthLabel}</span>
            <button type="button" onClick={nextMonth} className="p-2 rounded-sl hover:bg-chrome min-h-11 min-w-11 inline-flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-ink-muted" />
            </button>
          </div>

         
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[11px] font-semibold text-ink-muted uppercase tracking-wider py-2">
                {d}
              </div>
            ))}
          </div>

          
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
                      ? 'bg-chrome ring-1 ring-line'
                      : 'hover:bg-chrome/60'
                  }`}
                >
                  <span
                    className={`text-[13px] font-semibold w-7 h-7 flex items-center justify-center rounded-full ${
                      isToday(day)
                        ? 'bg-ink text-fundo'
                        : selected ? 'text-ink' : 'text-ink-muted'
                    }`}
                  >
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-1">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <div key={ev.id} className={`w-1.5 h-1.5 rounded-full ${(EVENT_COLORS[ev.cor] || EVENT_COLORS.tasks).dot}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      
        <div className="lg:col-span-1 rounded-sl border border-line bg-card p-5">
          <h3 className="text-[14px] font-semibold text-ink mb-4">
            {selectedDay
              ? new Date(year, month, selectedDay).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', weekday: 'long' })
              : 'Selecione um dia'}
          </h3>

          {selectedEvents.length === 0 ? (
            <p className="text-[12px] text-ink-muted">Nenhum evento neste dia.</p>
          ) : (
            <div className="space-y-3">
              {selectedEvents
                .sort((a, b) => a.hora.localeCompare(b.hora))
                .map((ev) => {
                  const colors = EVENT_COLORS[ev.cor] || EVENT_COLORS.tasks;
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
