// Vista Gantt - linha do tempo por data de vencimento (só tarefas com prazo)
import { useMemo, useState } from 'react'
import type { TarefaUnificada } from '../../types'
import { STATUS_CONFIG } from '../../constants/kanbanConfig'
import {
  AXEL_STATUS_BADGE,
  AXEL_TEXT_PRIMARY,
  AXEL_VIEW_SWITCHER_SHELL,
  AXEL_VIEW_TAB_ACTIVE,
  AXEL_VIEW_TAB_IDLE,
} from '../../constants/axelSurfaces'
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
const ROW_H = 48
const HEADER_H = 52
const BAR_H = 24

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

function taskBarRange(t: TarefaUnificada, today: Date): { start: Date; end: Date }
{
  const end = startOfDay(new Date(t.data_vencimento!))
  const created = t.created_at ? startOfDay(new Date(t.created_at)) : addDays(end, -4)
  let start = created <= end ? created : end
  if (dayDiff(start, end) < 1)
  {
    start = addDays(end, -1)
  }
  if (start > today && dayDiff(today, end) > 3)
  {
    start = today
  }
  return { start, end }
}

function taskProgressRatio(t: TarefaUnificada): number
{
  const subs = t.subtarefas ?? []
  if (subs.length > 0)
  {
    const done = subs.filter((s) => s.concluida).length
    return done / subs.length
  }
  if (t.status === 'em_progresso') return 0.45
  const deadline = t.data_vencimento ? startOfDay(new Date(t.data_vencimento)) : null
  const today = startOfDay(new Date())
  if (deadline && dayDiff(today, deadline) < 0) return 0.9
  return 0.12
}

function barTone(t: TarefaUnificada, today: Date): { base: string; fill: string }
{
  const deadline = startOfDay(new Date(t.data_vencimento!))
  const daysLeft = dayDiff(today, deadline)
  if (daysLeft < 0)
  {
    return { base: 'bg-urgente/25', fill: 'bg-urgente' }
  }
  if (daysLeft <= 2)
  {
    return { base: 'bg-atencao/25', fill: 'bg-atencao' }
  }
  if (t.prioridade === 'critica' || t.prioridade === 'alta')
  {
    return { base: 'bg-atencao/20', fill: 'bg-atencao/90' }
  }
  return { base: 'bg-accent/20', fill: 'bg-accent' }
}

const MOBILE_DAY_PX = 32
const MOBILE_HEADER_H = 14

function GanttMobileTimeline({
  task,
  today,
  rangeStart,
  dayCount,
  onSelect,
}: {
  task: TarefaUnificada
  today: Date
  rangeStart: Date
  dayCount: number
  onSelect: () => void
})
{
  const { start, end } = taskBarRange(task, today)
  const tone = barTone(task, today)
  const progress = taskProgressRatio(task)
  const width = dayCount * MOBILE_DAY_PX
  const todayOffset = dayDiff(rangeStart, today)
  const barLeft = dayDiff(rangeStart, start) * MOBILE_DAY_PX + 3
  const barWidth = Math.max(MOBILE_DAY_PX * Math.max(1, dayDiff(start, end) + 1) - 6, 24)

  return (
    <div className="mt-2 rounded-md border border-line bg-chrome/25 p-1.5 overflow-hidden">
      <div className="overflow-x-auto scrollbar-none touch-pan-x">
        <div className="relative" style={{ width, height: MOBILE_HEADER_H + 28 }}>
          {Array.from({ length: dayCount }, (_, i) =>
          {
            const d = addDays(rangeStart, i)
            const isToday = dayDiff(today, d) === 0
            const dayNum = d.getDate()
            return (
              <div
                key={`lbl-${i}`}
                className={`absolute top-0 text-center font-mono text-[8px] tabular-nums ${
                  isToday ? 'text-accent font-semibold' : 'text-zinc-500'
                }`}
                style={{ left: i * MOBILE_DAY_PX, width: MOBILE_DAY_PX }}
              >
                {dayNum}
              </div>
            )
          })}
          <div
            className="absolute left-0 right-0 rounded-sm bg-card/80 border border-line/60"
            style={{ top: MOBILE_HEADER_H, height: 24 }}
          >
            {Array.from({ length: dayCount }, (_, i) =>
            {
              const d = addDays(rangeStart, i)
              const isToday = dayDiff(today, d) === 0
              const weekend = d.getDay() === 0 || d.getDay() === 6
              return (
                <div
                  key={`col-${i}`}
                  className={`absolute top-0 bottom-0 border-r border-line/40 last:border-r-0 ${
                    isToday ? 'bg-accent/[0.08]' : weekend ? 'bg-chrome/40' : ''
                  }`}
                  style={{ left: i * MOBILE_DAY_PX, width: MOBILE_DAY_PX }}
                  aria-hidden
                />
              )
            })}
            {todayOffset >= 0 && todayOffset < dayCount && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-accent z-[1] pointer-events-none"
                style={{ left: todayOffset * MOBILE_DAY_PX + MOBILE_DAY_PX / 2 }}
              />
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSelect() }}
              className={`absolute top-1/2 -translate-y-1/2 h-3.5 rounded-full overflow-hidden z-[2] shadow-sm border border-black/5 dark:border-white/10 ${tone.base}`}
              style={{ left: barLeft, width: barWidth }}
            >
              <div
                className={`h-full ${tone.fill} opacity-95`}
                style={{ width: `${Math.max(10, Math.round(progress * 100))}%` }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
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
    for (const t of comPrazo)
    {
      const { start: barStart } = taskBarRange(t, today)
      if (barStart < start) start = barStart
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

  return (
    <div className="px-3 py-3 sm:px-5 sm:py-4 space-y-3 flex flex-col min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-wide text-ink-muted">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-urgente" />Atrasada</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-atencao" />≤2 dias</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-accent" />No prazo</span>
          <span className="flex items-center gap-1.5"><span className="w-0.5 h-3 bg-accent" />Hoje</span>
        </div>
        <div className={AXEL_VIEW_SWITCHER_SHELL}>
          {([7, 14, 30] as GanttZoom[]).map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => setZoom(z)}
              className={zoom === z ? AXEL_VIEW_TAB_ACTIVE : AXEL_VIEW_TAB_IDLE}
            >
              {z}d
            </button>
          ))}
        </div>
      </div>

      {comPrazo.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Nenhuma tarefa pendente com prazo. Defina datas no planejador ou use a aba Lista.
        </p>
      ) : (
        <>
          <div className="md:hidden space-y-2">
            <p className="text-[11px] text-zinc-500 font-mono px-0.5">
              Deslize a linha do tempo · grade completa no desktop
            </p>
            {comPrazo.map((t) =>
            {
              const cfg = STATUS_CONFIG[t.status]
              const progress = Math.round(taskProgressRatio(t) * 100)
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTarefa(t)}
                  className="w-full text-left rounded-lg border border-line bg-card shadow-sl px-2.5 py-2 hover:bg-chrome/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${AXEL_TEXT_PRIMARY}`}>
                      {cleanTitleForDisplay(t.titulo)}
                    </p>
                    <GanttMobileTimeline
                      task={t}
                      today={today}
                      rangeStart={rangeStart}
                      dayCount={dayCount}
                      onSelect={() => onSelectTarefa(t)}
                    />
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <DueDateChip date={t.data_vencimento} compact />
                      {cfg && (
                        <span className={AXEL_STATUS_BADGE}>
                          {cfg.label}
                        </span>
                      )}
                      <span className="font-mono text-[9px] text-zinc-500 tabular-nums">{progress}%</span>
                    </div>
                  </div>
                </button>
              )
            })}
            <p className="text-[11px] text-zinc-500 font-mono">
              {comPrazo.length} com prazo · {dayCount} dias na faixa
            </p>
          </div>

          <div className="hidden md:flex border border-line rounded-lg bg-card shadow-sl overflow-hidden flex-col min-h-0 max-h-[calc(100vh-320px)]">
            <div className="overflow-auto custom-scrollbar flex-1 min-h-0">
              <div style={{ minWidth: LABEL_COL + timelineWidth }}>
                <div className="flex border-b border-line bg-chrome/40 sticky top-0 z-20">
                  <div
                    className="shrink-0 px-3 py-2 border-r border-line font-mono text-[9px] uppercase tracking-wide text-zinc-500 bg-card"
                    style={{ width: LABEL_COL }}
                  >
                    Tarefa
                  </div>
                  <div className="relative shrink-0 bg-chrome/30" style={{ width: timelineWidth, height: HEADER_H }}>
                    {days.map((d, i) =>
                    {
                      const { top, bottom, isToday } = formatHeader(d, today)
                      const weekend = d.getDay() === 0 || d.getDay() === 6
                      return (
                        <div
                          key={i}
                          className={`absolute top-0 bottom-0 border-r border-line/80 text-center flex flex-col justify-center ${
                            isToday ? 'bg-accent/15' : weekend ? 'bg-chrome/30' : ''
                          }`}
                          style={{ left: i * PX_PER_DAY, width: PX_PER_DAY }}
                        >
                          <span className={`font-mono text-[9px] uppercase ${isToday ? 'text-accent font-semibold' : 'text-ink-muted'}`}>
                            {top}
                          </span>
                          <span className={`font-mono text-[11px] tabular-nums mt-0.5 ${isToday ? 'text-accent font-semibold' : 'text-zinc-500'}`}>
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

                <div>
                  {comPrazo.map((t, rowIdx) =>
                  {
                    const { start, end } = taskBarRange(t, today)
                    const barLeft = dayLeft(start) + 4
                    const spanDays = Math.max(1, dayDiff(start, end) + 1)
                    const barWidth = spanDays * PX_PER_DAY - 8
                    const title = cleanTitleForDisplay(t.titulo)
                    const progress = taskProgressRatio(t)
                    const tone = barTone(t, today)
                    const cfg = STATUS_CONFIG[t.status]
                    const stripe = rowIdx % 2 === 1 ? 'bg-chrome/15' : ''

                    return (
                      <div
                        key={t.id}
                        className={`flex items-stretch border-b border-line hover:bg-chrome/25 transition-colors ${stripe}`}
                        style={{ minHeight: ROW_H }}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectTarefa(t)}
                          className={`shrink-0 px-4 py-2.5 text-left text-[13px] leading-snug border-r border-line line-clamp-2 font-sans ${AXEL_TEXT_PRIMARY}`}
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
                                className={`absolute top-0 bottom-0 border-r border-line/40 ${
                                  isToday ? 'bg-accent/[0.04]' : weekend ? 'bg-chrome/20' : ''
                                }`}
                                style={{ left: i * PX_PER_DAY, width: PX_PER_DAY }}
                                aria-hidden
                              />
                            )
                          })}
                          {todayOffset >= 0 && todayOffset < dayCount && (
                            <div
                              className="absolute top-1 bottom-1 w-px bg-accent/60 pointer-events-none z-[1]"
                              style={{ left: todayOffset * PX_PER_DAY + PX_PER_DAY / 2 }}
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => onSelectTarefa(t)}
                            className={`absolute top-1/2 -translate-y-1/2 z-[2] cursor-pointer rounded-full overflow-hidden border border-black/10 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow ${tone.base}`}
                            style={{
                              left: barLeft,
                              width: barWidth,
                              height: BAR_H,
                            }}
                            title={`${start.toLocaleDateString('pt-BR')} → ${end.toLocaleDateString('pt-BR')}`}
                          >
                            <div
                              className={`absolute inset-y-0 left-0 rounded-full ${tone.fill}`}
                              style={{ width: `${Math.max(6, Math.round(progress * 100))}%` }}
                            />
                            {barWidth > 120 && (
                              <span className="relative z-[1] flex items-center h-full px-2.5 text-[10px] font-medium text-white truncate drop-shadow-sm pointer-events-none">
                                {title}
                              </span>
                            )}
                          </button>
                          {cfg && barWidth <= 120 && (
                            <span
                              className={`absolute top-1/2 -translate-y-1/2 font-mono text-[9px] px-1.5 py-0.5 rounded-pill z-[2] pointer-events-none ${cfg.bg} ${cfg.color}`}
                              style={{ left: barLeft + barWidth + 6 }}
                            >
                              {cfg.label}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            <p className="shrink-0 px-3 py-1.5 border-t border-line text-[11px] text-zinc-500 font-mono bg-chrome/20">
              {comPrazo.length} com prazo · {dayCount} dias visíveis · barras do início ao vencimento
            </p>
          </div>
        </>
      )}
    </div>
  )
}
