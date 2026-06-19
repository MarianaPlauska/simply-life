// Vista Gantt — linha do tempo por data de vencimento (só tarefas com prazo)
import { useMemo, useState } from 'react'
import type { TarefaUnificada } from '../../types'
import { STATUS_CONFIG } from '../../constants/kanbanConfig'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'
import { DueDateChip } from './DueDateChip'
import { cleanTitleForDisplay } from './axelKanbanUtils'

type GanttZoom = 7 | 14 | 30

interface GanttViewProps
{
  tarefas: TarefaUnificada[]
  onSelectTarefa: (t: TarefaUnificada) => void
}

const PX_PER_DAY = 72
const LABEL_COL = 280
const ROW_H = 52
const HEADER_H = 56

function startOfDay(d: Date): Date
{
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(d: Date, n: number): Date
{
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function dayDiff(a: Date, b: Date): number
{
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000)
}

function formatHeader(d: Date, today: Date): { top: string; bottom: string; isToday: boolean }
{
  const isToday = dayDiff(today, d) === 0
  const weekday = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
  const day = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  return { top: weekday, bottom: day, isToday }
}

export function GanttView({ tarefas, onSelectTarefa }: GanttViewProps)
{
  const [zoom, setZoom] = useState<GanttZoom>(14)

  const today = useMemo(() => startOfDay(new Date()), [])

  const comPrazo = useMemo(() =>
    tarefas
      .filter((t) => t.data_vencimento && t.status !== 'concluida')
      .sort((a, b) => new Date(a.data_vencimento!).getTime() - new Date(b.data_vencimento!).getTime()),
  [tarefas])

  const { rangeStart, dayCount } = useMemo(() =>
  {
    let start = today
    if (comPrazo.length > 0)
    {
      const earliest = startOfDay(new Date(comPrazo[0].data_vencimento!))
      if (earliest < start)
      {
        start = earliest
      }
    }

    const end = addDays(today, zoom)
    let finalEnd = end
    if (comPrazo.length > 0)
    {
      const latest = startOfDay(new Date(comPrazo[comPrazo.length - 1].data_vencimento!))
      if (latest > finalEnd)
      {
        finalEnd = latest
      }
    }

    const days = Math.max(zoom, dayDiff(start, finalEnd) + 1)
  return {
      rangeStart: start,
      dayCount: days,
    }
  }, [comPrazo, today, zoom])

  const days = useMemo(() =>
  {
    const list: Date[] = []
    for (let i = 0; i < dayCount; i++)
    {
      list.push(addDays(rangeStart, i))
    }
    return list
  }, [rangeStart, dayCount])

  const timelineWidth = dayCount * PX_PER_DAY
  const todayOffset = dayDiff(rangeStart, today)

  function dayLeft(d: Date): number
  {
    return dayDiff(rangeStart, d) * PX_PER_DAY
  }

  function barColor(t: TarefaUnificada): string
  {
    const deadline = startOfDay(new Date(t.data_vencimento!))
    const daysLeft = dayDiff(today, deadline)
    if (daysLeft < 0)
    {
      return 'bg-urgente'
    }
    if (daysLeft <= 2)
    {
      return 'bg-atencao'
    }
    return t.prioridade === 'critica' ? 'bg-urgente/85' : t.prioridade === 'alta' ? 'bg-atencao/85' : 'bg-accent'
  }

  return (
    <div className="px-5 py-5 space-y-5 flex flex-col min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-wide text-ink-muted">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sl bg-urgente" />Atrasada</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sl bg-atencao" />≤2 dias</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sl bg-accent" />No prazo</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-accent" />Hoje</span>
        </div>
        <div className="inline-flex rounded-sl border border-line overflow-hidden">
          {([7, 14, 30] as GanttZoom[]).map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => setZoom(z)}
              className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide transition-colors ${
                zoom === z
                  ? 'bg-accent/15 text-accent'
                  : 'text-ink-muted hover:bg-chrome/40'
              }`}
            >
              {z}d
            </button>
          ))}
        </div>
      </div>

      {comPrazo.length === 0 ? (
        <p className={`text-sm ${AXEL_TEXT_SECONDARY}`}>
          Nenhuma tarefa pendente com prazo. Defina datas no planejador ou use a aba Lista.
        </p>
      ) : (
        <>
          <div className="md:hidden space-y-2">
            {comPrazo.map((t) =>
            {
              const cfg = STATUS_CONFIG[t.status]
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTarefa(t)}
                  className="w-full text-left rounded-sl border border-line bg-card px-3 py-3 flex items-start gap-3 hover:bg-chrome/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${AXEL_TEXT_PRIMARY}`}>
                      {cleanTitleForDisplay(t.titulo)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <DueDateChip date={t.data_vencimento} compact />
                      {cfg && (
                        <span className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-sm ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
            <p className={`font-mono text-[9px] ${AXEL_TEXT_SECONDARY}`}>
              {comPrazo.length} com prazo · vista simplificada no celular
            </p>
          </div>

          <div className="hidden md:flex border border-line rounded-sl bg-card overflow-hidden flex-col min-h-0 max-h-[calc(100vh-320px)]">
          <div className="overflow-auto custom-scrollbar flex-1 min-h-0">
            <div style={{ minWidth: LABEL_COL + timelineWidth }}>
              {/* cabeçalho de dias */}
              <div className="flex border-b border-line bg-chrome/30 sticky top-0 z-20">
                <div
                  className="shrink-0 px-3 py-2 border-r border-line font-mono text-[9px] uppercase tracking-wide text-ink-muted"
                  style={{ width: LABEL_COL }}
                >
                  Tarefa
                </div>
                <div className="relative shrink-0" style={{ width: timelineWidth, height: HEADER_H }}>
                  {days.map((d, i) =>
                  {
                    const { top, bottom, isToday } = formatHeader(d, today)
                    const weekend = d.getDay() === 0 || d.getDay() === 6
                    return (
                      <div
                        key={i}
                        className={`absolute top-0 bottom-0 border-r border-line/80 text-center flex flex-col justify-center ${
                          isToday ? 'bg-accent/12' : weekend ? 'bg-chrome/25' : ''
                        }`}
                        style={{ left: i * PX_PER_DAY, width: PX_PER_DAY }}
                      >
                        <span className={`font-mono text-[9px] uppercase ${isToday ? 'text-accent' : 'text-ink-muted'}`}>
                          {top}
                        </span>
                        <span className={`font-mono text-[11px] tabular-nums mt-0.5 ${isToday ? 'text-accent font-semibold' : AXEL_TEXT_SECONDARY}`}>
                          {bottom}
                        </span>
                      </div>
                    )
                  })}
                  {todayOffset >= 0 && todayOffset < dayCount && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-accent z-10 pointer-events-none"
                      style={{ left: todayOffset * PX_PER_DAY + PX_PER_DAY / 2 }}
                      aria-hidden
                    />
                  )}
                </div>
              </div>

              {/* linhas */}
              <div className="divide-y divide-line">
                {comPrazo.map((t) =>
                {
                  const deadline = startOfDay(new Date(t.data_vencimento!))
                  const left = dayLeft(deadline)
                  const title = cleanTitleForDisplay(t.titulo)

                  return (
                    <div key={t.id} className="flex items-stretch hover:bg-chrome/20 transition-colors" style={{ minHeight: ROW_H }}>
                      <button
                        type="button"
                        onClick={() => onSelectTarefa(t)}
                        className={`shrink-0 px-4 py-3 text-left text-[13px] leading-snug border-r border-line line-clamp-2 ${AXEL_TEXT_PRIMARY}`}
                        style={{ width: LABEL_COL }}
                        title={title}
                      >
                        {title}
                      </button>
                      <div className="relative shrink-0" style={{ width: timelineWidth, minHeight: ROW_H }}>
                        {days.map((d, i) =>
                        {
                          const weekend = d.getDay() === 0 || d.getDay() === 6
                          const isToday = dayDiff(today, d) === 0
                          return (
                            <div
                              key={i}
                              className={`absolute top-0 bottom-0 border-r border-line/50 ${
                                isToday ? 'bg-accent/5' : weekend ? 'bg-chrome/15' : ''
                              }`}
                              style={{ left: i * PX_PER_DAY, width: PX_PER_DAY }}
                              aria-hidden
                            />
                          )
                        })}
                        {todayOffset >= 0 && todayOffset < dayCount && (
                          <div
                            className="absolute top-1 bottom-1 w-px bg-accent/50 pointer-events-none z-[1]"
                            style={{ left: todayOffset * PX_PER_DAY + PX_PER_DAY / 2 }}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectTarefa(t)}
                          className={`absolute top-1/2 -translate-y-1/2 h-5 rounded-sl z-[2] cursor-pointer hover:opacity-90 shadow-sm ${barColor(t)}`}
                          style={{
                            left: Math.max(6, left + 6),
                            width: Math.max(PX_PER_DAY - 12, 20),
                          }}
                          title={deadline.toLocaleDateString('pt-BR')}
                        />
                        <span className={`absolute top-1/2 -translate-y-1/2 ml-1 font-mono text-[9px] px-1 rounded-sm z-[2] pointer-events-none ${STATUS_CONFIG[t.status]?.bg} ${STATUS_CONFIG[t.status]?.color}`}
                          style={{ left: left + PX_PER_DAY }}
                        >
                          {STATUS_CONFIG[t.status]?.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <p className={`shrink-0 px-3 py-2 border-t border-line font-mono text-[9px] ${AXEL_TEXT_SECONDARY}`}>
            {comPrazo.length} com prazo · {dayCount} dias visíveis · sem prazo não aparece aqui
          </p>
        </div>
        </>
      )}
    </div>
  )
}
