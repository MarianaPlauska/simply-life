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

type DiaryView = 'semana' | 'mes' | 'diario'

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

type FeedItem =
  | { kind: 'humor'; key: string; sort: string; registro: HumorRegistro }
  | { kind: 'journal'; key: string; sort: string; entrada: EntradaDiario }

interface MoodDiarySectionProps
{
  defaultView?: DiaryView
}

function parseDiarioContexto(prompt: string | null | undefined): { label: string; tone: string } | null
{
  if (!prompt) return null
  const match = prompt.match(/^\[ctx:(geral|gasto|tarefa|saude)\]/i)
  if (!match) return null
  const map: Record<string, { label: string; tone: string }> = {
    gasto: { label: 'Gasto', tone: 'text-atencao border-atencao/30' },
    tarefa: { label: 'Tarefa', tone: 'text-accent border-accent/30' },
    saude: { label: 'Saúde', tone: 'text-concluido border-concluido/30' },
    geral: { label: 'Geral', tone: 'text-ink-muted border-line' },
  }
  return map[match[1].toLowerCase()] ?? null
}

export function MoodDiarySection({ defaultView = 'semana' }: MoodDiarySectionProps)
{
  const [view, setView] = useState<DiaryView>(defaultView)
  const humorSemana = useTaskStore((s) => s.humorSemana)
  const humorMes = useTaskStore((s) => s.humorMes)
  const humorSemanaAgregado = useTaskStore((s) => s.humorSemanaAgregado)
  const humorMesAgregado = useTaskStore((s) => s.humorMesAgregado)
  const entradasRecentes = useTaskStore((s) => s.entradasRecentes)
  const fetchEntradasRecentes = useTaskStore((s) => s.fetchEntradasRecentes)

  useEffect(() =>
  {
    void fetchEntradasRecentes(60)
  }, [fetchEntradasRecentes])

  const mediaSemana = mediaHumor(humorSemana)
  const mediaMes = mediaHumor(humorMes)
  const tendencia = tendenciaSemana(humorSemanaAgregado)

  const feed = useMemo(() =>
  {
    const items: FeedItem[] = []

    for (const r of humorMes)
    {
      items.push({
        kind: 'humor',
        key: `h-${r.id}`,
        sort: `${r.data}T${r.created_at?.slice(11, 19) || '12:00:00'}`,
        registro: r,
      })
    }

    for (const e of entradasRecentes)
    {
      items.push({
        kind: 'journal',
        key: `j-${e.id}`,
        sort: `${e.data}T23:59:00`,
        entrada: e,
      })
    }

    return items.sort((a, b) => b.sort.localeCompare(a.sort))
  }, [humorMes, entradasRecentes])

  const views: { id: DiaryView; label: string }[] = [
    { id: 'semana', label: 'Semana' },
    { id: 'mes', label: 'Mês' },
    { id: 'diario', label: 'Diário' },
  ]

  return (
    <section className="sl-panel p-4 sm:p-5 space-y-4">
      <header className="flex items-start gap-2">
        <BookOpen className="w-4 h-4 text-accent shrink-0 mt-0.5" strokeWidth={1.75} />
        <div className="min-w-0">
          <h2 className={`font-display text-base ${AXEL_TEXT_PRIMARY}`}>
            Seus registros
          </h2>
          <p className={`text-[12px] mt-0.5 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
            Humor, notas e reflexões — só você vê.
          </p>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-0.5">
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

      {view === 'semana' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-sl border border-line bg-chrome/40 px-3 py-2.5">
              <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Média 7 dias</p>
              <p className={`text-xl font-display tabular-nums mt-0.5 ${AXEL_TEXT_PRIMARY}`}>
                {humorSemana.length > 0 ? `${mediaSemana}/5` : '—'}
              </p>
            </div>
            <div className="rounded-sl border border-line bg-chrome/40 px-3 py-2.5">
              <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Registros</p>
              <p className={`text-xl font-display tabular-nums mt-0.5 ${AXEL_TEXT_PRIMARY}`}>
                {humorSemana.length}
              </p>
            </div>
          </div>
          {humorSemanaAgregado.length > 0 && (
            <>
              <p className={`flex items-center gap-1.5 text-[12px] ${AXEL_TEXT_SECONDARY}`}>
                <TrendingUp className="w-3.5 h-3.5 text-accent" />
                {tendenciaLabel(tendencia)}
              </p>
              <MoodWeekSparkline dias={humorSemanaAgregado} />
              <ul className="divide-y divide-line border border-line rounded-sl">
                {[...humorSemanaAgregado].reverse().map((d) => (
                  <li
                    key={d.data}
                    className={`flex items-center justify-between gap-2 px-3 py-2 text-[12px] ${AXEL_ROW_HOVER}`}
                  >
                    <span className={AXEL_TEXT_PRIMARY}>{formatDay(d.data)}</span>
                    <span className="font-mono tabular-nums text-ink-muted">
                      {d.humor}/5 · {d.registros} {d.registros === 1 ? 'vez' : 'vezes'}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {humorSemana.length === 0 && (
            <p className={`text-center py-6 text-[12px] ${AXEL_TEXT_SECONDARY}`}>
              Nenhum registro nesta semana ainda.
            </p>
          )}
        </div>
      )}

      {view === 'mes' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-sl border border-line bg-chrome/40 px-3 py-2.5">
              <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Média 30 dias</p>
              <p className={`text-xl font-display tabular-nums mt-0.5 ${AXEL_TEXT_PRIMARY}`}>
                {humorMes.length > 0 ? `${mediaMes}/5` : '—'}
              </p>
            </div>
            <div className="rounded-sl border border-line bg-chrome/40 px-3 py-2.5">
              <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Dias com registro</p>
              <p className={`text-xl font-display tabular-nums mt-0.5 ${AXEL_TEXT_PRIMARY}`}>
                {humorMesAgregado.length}
              </p>
            </div>
          </div>
          <MoodMonthHeatmap agregados={humorMesAgregado} />
          {humorMes.length === 0 && (
            <p className={`text-center py-4 text-[12px] ${AXEL_TEXT_SECONDARY}`}>
              O mapa aparece conforme você registra o humor.
            </p>
          )}
        </div>
      )}

      {view === 'diario' && (
        <div className="space-y-2">
          {feed.length === 0 ? (
            <p className={`text-center py-8 text-[12px] ${AXEL_TEXT_SECONDARY}`}>
              Seu diário aparece aqui — humor com nota e reflexões escritas.
            </p>
          ) : (
            <ul className="divide-y divide-line border border-line rounded-sl max-h-[min(420px,50vh)] overflow-y-auto">
              {feed.map((item) =>
              {
                if (item.kind === 'humor')
                {
                  const r = item.registro
                  return (
                    <li key={item.key} className={`px-3 py-2.5 space-y-1 ${AXEL_ROW_HOVER}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1.5 text-[12px] ${AXEL_TEXT_PRIMARY}`}>
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: MOOD_HEX[r.humor] }}
                          />
                          {moodLabel(r.humor)}
                        </span>
                        <span className={`font-mono text-[10px] tabular-nums ${AXEL_TEXT_SECONDARY}`}>
                          {formatDay(r.data)}
                          {r.created_at ? ` · ${formatTime(r.created_at)}` : ''}
                        </span>
                      </div>
                      {r.nota && (
                        <p className={`text-[12px] leading-relaxed pl-3.5 border-l-2 border-line ${AXEL_TEXT_SECONDARY}`}>
                          {r.nota}
                        </p>
                      )}
                    </li>
                  )
                }

                const e = item.entrada
                const ctx = parseDiarioContexto(e.prompt_usado)
                return (
                  <li key={item.key} className={`px-3 py-2.5 space-y-1 ${AXEL_ROW_HOVER}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1.5 text-[12px] ${AXEL_TEXT_PRIMARY}`}>
                        <CalendarDays className="w-3.5 h-3.5 text-accent" />
                        Nota
                        {ctx && (
                          <span className={`font-mono text-[8px] uppercase px-1 py-0.5 rounded-sl border ${ctx.tone}`}>
                            {ctx.label}
                          </span>
                        )}
                      </span>
                      <span className={`font-mono text-[10px] ${AXEL_TEXT_SECONDARY}`}>
                        {formatDay(e.data)}
                      </span>
                    </div>
                    <p className={`text-[12px] leading-relaxed ${AXEL_TEXT_PRIMARY}`}>
                      {e.conteudo}
                    </p>
                    {e.prompt_usado && !e.prompt_usado.startsWith('[ctx:') && (
                      <p className={`text-[10px] italic ${AXEL_TEXT_SECONDARY}`}>
                        “{e.prompt_usado}”
                      </p>
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
