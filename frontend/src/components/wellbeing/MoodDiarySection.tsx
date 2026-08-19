import { useEffect, useMemo, useState } from 'react'
import { BookOpen, CalendarDays, TrendingUp } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import type { EntradaDiario, HumorRegistro } from '../../store/slices/bemEstarSlice'
import {
  mediaHumor,
  tendenciaLabel,
  tendenciaSemana,
} from '../../lib/moodInsights'
import { moodLabel, MOOD_HEX } from '../../lib/moodConstants'
import { MoodWeekSparkline } from './MoodWeekSparkline'
import { MoodMonthHeatmap } from './MoodMonthHeatmap'
import {
  AXEL_LIST_FILTER_ACTIVE,
  AXEL_LIST_FILTER_IDLE,
  AXEL_ROW_HOVER,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

type DiaryView = 'resumo' | 'historico'
type PeriodPreset = '7d' | '30d' | '90d' | 'all' | 'custom'

function formatDay(iso: string): string
{
  return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function formatTime(iso?: string): string
{
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function isoDaysAgo(days: number): string
{
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function todayIso(): string
{
  return new Date().toISOString().slice(0, 10)
}

function resolvePeriodRange(
  preset: PeriodPreset,
  customFrom: string,
  customTo: string,
): { from: string; to: string }
{
  const to = todayIso()
  if (preset === '7d') return { from: isoDaysAgo(6), to }
  if (preset === '30d') return { from: isoDaysAgo(29), to }
  if (preset === '90d') return { from: isoDaysAgo(89), to }
  if (preset === 'custom' && customFrom)
  {
    return { from: customFrom, to: customTo || to }
  }
  return { from: '1970-01-01', to }
}

function inRange(iso: string, from: string, to: string): boolean
{
  return iso >= from && iso <= to
}

type FeedItem =
  | { kind: 'humor'; key: string; sort: string; registro: HumorRegistro }
  | { kind: 'journal'; key: string; sort: string; entrada: EntradaDiario }

type DiaryGroup =
{
  key: string
  sort: string
  humor?: HumorRegistro
  journal?: EntradaDiario
}

function isHumorJournalDuplicate(entrada: EntradaDiario, humorLista: HumorRegistro[]): boolean
{
  if (!entrada.prompt_usado?.match(/^Humor:/i)) return false
  const texto = entrada.conteudo.trim()
  return humorLista.some(
    (r) => r.data === entrada.data && r.nota?.trim() === texto,
  )
}

function buildDiaryGroups(feed: FeedItem[]): DiaryGroup[]
{
  const groups: DiaryGroup[] = []
  const usedJournal = new Set<string>()

  for (const item of feed)
  {
    if (item.kind !== 'humor') continue
    const r = item.registro
    const journalMatch = feed.find(
      (f) =>
        f.kind === 'journal'
        && !usedJournal.has(f.key)
        && f.entrada.data === r.data
        && (
          f.entrada.conteudo.trim() === (r.nota?.trim() ?? '')
          || f.entrada.prompt_usado?.match(/^Humor:/i)
        ),
    )
    if (journalMatch?.kind === 'journal')
    {
      usedJournal.add(journalMatch.key)
    }
    groups.push({
      key: item.key,
      sort: item.sort,
      humor: r,
      journal: journalMatch?.kind === 'journal' ? journalMatch.entrada : undefined,
    })
  }

  for (const item of feed)
  {
    if (item.kind !== 'journal' || usedJournal.has(item.key)) continue
    groups.push({
      key: item.key,
      sort: item.sort,
      journal: item.entrada,
    })
  }

  return groups.sort((a, b) => b.sort.localeCompare(a.sort))
}

interface MoodDiarySectionProps
{
  defaultView?: DiaryView
}

function parseDiarioContexto(prompt: string | null | undefined): { label: string; tone: string } | null
{
  if (!prompt) return null
  const match = prompt.match(/^\[ctx:(geral|gasto|tarefa|saude|lembrete)\]/i)
  if (!match) return null
  const map: Record<string, { label: string; tone: string }> = {
    gasto: { label: 'Gasto', tone: 'text-atencao border-atencao/30 bg-atencao/10' },
    tarefa: { label: 'Tarefa', tone: 'text-accent border-accent/30 bg-accent-muted/40' },
    saude: { label: 'Saúde', tone: 'text-rose-300 border-rose-400/30 bg-rose-500/10' },
    lembrete: { label: 'Lembrete', tone: 'text-amber-200 border-amber-400/30 bg-amber-500/10' },
    geral: { label: 'Geral', tone: 'text-ink-muted border-line bg-chrome/40' },
  }
  return map[match[1].toLowerCase()] ?? null
}

const PERIOD_PRESETS: { id: PeriodPreset; label: string }[] = [
  { id: '7d', label: '7 dias' },
  { id: '30d', label: '30 dias' },
  { id: '90d', label: '90 dias' },
  { id: 'all', label: 'Tudo' },
  { id: 'custom', label: 'Período' },
]

export function MoodDiarySection({ defaultView = 'resumo' }: MoodDiarySectionProps)
{
  const [view, setView] = useState<DiaryView>(defaultView)
  const [period, setPeriod] = useState<PeriodPreset>('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const humorMes = useTaskStore((s) => s.humorMes)
  const humorSemanaAgregado = useTaskStore((s) => s.humorSemanaAgregado)
  const entradasRecentes = useTaskStore((s) => s.entradasRecentes)
  const fetchEntradasRecentes = useTaskStore((s) => s.fetchEntradasRecentes)

  useEffect(() =>
  {
    void fetchEntradasRecentes(120)
  }, [fetchEntradasRecentes])

  const range = useMemo(
    () => resolvePeriodRange(period, customFrom, customTo),
    [period, customFrom, customTo],
  )

  const humorFiltrado = useMemo(
    () => humorMes.filter((r) => inRange(r.data, range.from, range.to)),
    [humorMes, range],
  )

  const humorAgregadoFiltrado = useMemo(() =>
  {
    const map = new Map<string, { data: string; humor: number; registros: number }>()
    for (const r of humorFiltrado)
    {
      const prev = map.get(r.data)
      if (prev)
      {
        const n = prev.registros + 1
        map.set(r.data, {
          data: r.data,
          humor: Math.round(((prev.humor * prev.registros) + r.humor) / n),
          registros: n,
        })
      }
      else
      {
        map.set(r.data, { data: r.data, humor: r.humor, registros: 1 })
      }
    }
    return [...map.values()].sort((a, b) => a.data.localeCompare(b.data))
  }, [humorFiltrado])

  const entradasFiltradas = useMemo(
    () => entradasRecentes.filter((e) => inRange(e.data, range.from, range.to)),
    [entradasRecentes, range],
  )

  const mediaPeriodo = mediaHumor(humorFiltrado)
  const tendencia = tendenciaSemana(humorSemanaAgregado)

  const feed = useMemo(() =>
  {
    const items: FeedItem[] = []

    for (const r of humorFiltrado)
    {
      items.push({
        kind: 'humor',
        key: `h-${r.id}`,
        sort: `${r.data}T${r.created_at?.slice(11, 19) || '12:00:00'}`,
        registro: r,
      })
    }

    for (const e of entradasFiltradas)
    {
      if (isHumorJournalDuplicate(e, humorFiltrado)) continue
      items.push({
        kind: 'journal',
        key: `j-${e.id}`,
        sort: `${e.data}T23:59:00`,
        entrada: e,
      })
    }

    return items.sort((a, b) => b.sort.localeCompare(a.sort))
  }, [humorFiltrado, entradasFiltradas])

  const diaryGroups = useMemo(() => buildDiaryGroups(feed), [feed])

  const views: { id: DiaryView; label: string }[] = [
    { id: 'resumo', label: 'Resumo' },
    { id: 'historico', label: 'Histórico' },
  ]

  const showSparkline = period === '7d' || (period === 'custom' && range.to >= range.from
    && (new Date(range.to).getTime() - new Date(range.from).getTime()) <= 8 * 86400000)

  return (
    <section className="sl-panel p-4 sm:p-5 space-y-4 border border-accent/10">
      <header className="flex items-start gap-2.5">
        <div className="p-1.5 rounded-sl bg-accent/10 border border-accent/20 shrink-0">
          <BookOpen className="w-4 h-4 text-accent" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <h2 className={`font-display text-base ${AXEL_TEXT_PRIMARY}`}>
            Seus registros
          </h2>
          <p className={`text-[12px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
            Só você vê
          </p>
        </div>
      </header>

      <div className="space-y-2">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {PERIOD_PRESETS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPeriod(id)}
              className={period === id
                ? 'shrink-0 px-3 py-1.5 rounded-pill text-[12px] font-medium border border-accent/35 bg-accent-muted/50 text-accent'
                : 'shrink-0 px-3 py-1.5 rounded-pill text-[12px] font-medium border border-line/70 text-ink-muted hover:text-ink hover:border-line'}
            >
              {label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className={`font-mono text-[10px] uppercase ${AXEL_TEXT_SECONDARY}`}>De</span>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full min-h-[40px] border border-line/80 rounded-sl bg-card/40 px-2 text-[13px] text-ink outline-none focus:border-accent/40"
              />
            </label>
            <label className="space-y-1">
              <span className={`font-mono text-[10px] uppercase ${AXEL_TEXT_SECONDARY}`}>Até</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full min-h-[40px] border border-line/80 rounded-sl bg-card/40 px-2 text-[13px] text-ink outline-none focus:border-accent/40"
              />
            </label>
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-0.5 border-b border-line/60 pb-px">
        {views.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={view === id ? AXEL_LIST_FILTER_ACTIVE : AXEL_LIST_FILTER_IDLE}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'resumo' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-sl border border-accent/15 bg-accent-muted/20 px-3 py-2.5">
              <p className={`font-mono text-[10px] uppercase ${AXEL_TEXT_SECONDARY}`}>Média</p>
              <p className={`text-xl font-display tabular-nums mt-0.5 ${AXEL_TEXT_PRIMARY}`}>
                {humorFiltrado.length > 0 ? `${mediaPeriodo}/5` : '·'}
              </p>
            </div>
            <div className="rounded-sl border border-line/80 bg-card/30 px-3 py-2.5">
              <p className={`font-mono text-[10px] uppercase ${AXEL_TEXT_SECONDARY}`}>Registros</p>
              <p className={`text-xl font-display tabular-nums mt-0.5 ${AXEL_TEXT_PRIMARY}`}>
                {humorFiltrado.length}
              </p>
            </div>
          </div>

          {humorAgregadoFiltrado.length > 0 && (
            <>
              {period === '7d' && humorSemanaAgregado.length > 0 && (
                <p className={`flex items-center gap-1.5 text-[13px] ${AXEL_TEXT_SECONDARY}`}>
                  <TrendingUp className="w-3.5 h-3.5 text-accent" />
                  {tendenciaLabel(tendencia)}
                </p>
              )}
              {showSparkline && humorAgregadoFiltrado.length > 1 ? (
                <MoodWeekSparkline dias={humorAgregadoFiltrado} />
              ) : (
                <MoodMonthHeatmap agregados={humorAgregadoFiltrado} />
              )}
              <ul className="divide-y divide-line/60 border border-line/70 rounded-sl overflow-hidden">
                {[...humorAgregadoFiltrado].reverse().slice(0, 14).map((d) => (
                  <li
                    key={d.data}
                    className={`flex items-center justify-between gap-2 px-3 py-2 text-[13px] ${AXEL_ROW_HOVER}`}
                  >
                    <span className={AXEL_TEXT_PRIMARY}>{formatDay(d.data)}</span>
                    <span className="font-mono tabular-nums text-ink-muted">
                      {d.humor}/5
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {humorFiltrado.length === 0 && (
            <p className={`text-center py-6 text-[13px] ${AXEL_TEXT_SECONDARY}`}>
              Nada neste período ainda.
            </p>
          )}
        </div>
      )}

      {view === 'historico' && (
        <div className="space-y-2">
          {diaryGroups.length === 0 ? (
            <p className={`text-center py-8 text-[13px] ${AXEL_TEXT_SECONDARY}`}>
              Nada neste período ainda.
            </p>
          ) : (
            <ul className="space-y-2 max-h-[min(420px,50vh)] overflow-y-auto pr-0.5">
              {diaryGroups.map((group) =>
              {
                const r = group.humor
                const e = group.journal
                const ctx = e ? parseDiarioContexto(e.prompt_usado) : null
                const dayIso = r?.data ?? e?.data ?? ''
                const moodColor = r ? MOOD_HEX[r.humor] : undefined
                const timeLabel = r?.created_at
                  ? `${formatDay(dayIso)} · ${formatTime(r.created_at)}`
                  : formatDay(dayIso)

                return (
                  <li
                    key={group.key}
                    className={`rounded-sl border border-line/70 bg-card/25 px-3 py-2.5 space-y-2 ${AXEL_ROW_HOVER}`}
                    style={moodColor ? { borderLeftWidth: 3, borderLeftColor: moodColor } : undefined}
                  >
                    {r && (
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1.5 text-[13px] ${AXEL_TEXT_PRIMARY}`}>
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white/10"
                            style={{ backgroundColor: moodColor }}
                          />
                          {moodLabel(r.humor)}
                        </span>
                        <span className={`font-mono text-[11px] tabular-nums ${AXEL_TEXT_SECONDARY}`}>
                          {timeLabel}
                        </span>
                      </div>
                    )}

                    {e && !r && (
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1.5 text-[13px] ${AXEL_TEXT_PRIMARY}`}>
                          <CalendarDays className="w-3.5 h-3.5 text-accent" />
                          Nota
                          {ctx && (
                            <span className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-sl border ${ctx.tone}`}>
                              {ctx.label}
                            </span>
                          )}
                        </span>
                        <span className={`font-mono text-[11px] ${AXEL_TEXT_SECONDARY}`}>
                          {formatDay(e.data)}
                        </span>
                      </div>
                    )}

                    {(r?.nota || e?.conteudo) && (
                      <p className={`text-[13px] leading-relaxed ${r ? 'pl-3 border-l border-line/60' : ''} ${AXEL_TEXT_PRIMARY}`}>
                        {r?.nota ?? e?.conteudo}
                      </p>
                    )}

                    {e && r && ctx && (
                      <span className={`inline-block font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-sl border ${ctx.tone}`}>
                        {ctx.label}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
