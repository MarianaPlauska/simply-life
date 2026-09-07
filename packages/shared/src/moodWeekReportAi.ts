import type { HumorRegistro } from './mood'
import { isDemoHumorRow } from './mood'
import type { MoodAlertLevel, MoodRecurringTheme, MoodWeekReport } from './moodWeekReport'

export type MoodWeekReportAiTheme = {
  label: string
  count: number
  examples: string[]
}

export type MoodWeekReportAiResponse = {
  summary: string
  themes: MoodWeekReportAiTheme[]
  careNote: string
  alertLevel: MoodAlertLevel
  source: 'ai' | 'local' | 'cache' | 'groq' | 'gemini'
  iaDisponivel: boolean
}

export type MoodWeekReportAiRequest = {
  weekStart: string
  weekEnd: string
  stats: {
    totalEntries: number
    daysLogged: number
    topMoods: { label: string; pct: number; count: number }[]
    terribleCount: number
    terriblePct: number
    alertLevel: MoodAlertLevel
  }
  notes: string[]
  localThemes: MoodRecurringTheme[]
  goalContext?: {
    title: string
    terribleDuringGoal?: { count: number; pct: number }
  } | null
}

/** Notas de humor na semana do relatório (sem demo). */
export function moodWeekReportNotes(
  rows: HumorRegistro[],
  weekStart: string,
  weekEnd: string,
): string[]
{
  return rows
    .filter((r) => !isDemoHumorRow(r))
    .filter((r) =>
    {
      const d = (r.data || '').slice(0, 10)
      return d >= weekStart && d <= weekEnd
    })
    .map((r) => r.nota?.trim())
    .filter((n): n is string => Boolean(n))
    .slice(0, 24)
}

/** Payload para POST /api/axel/mood-week-report */
export function buildMoodWeekReportAiRequest(
  report: MoodWeekReport,
  rows: HumorRegistro[],
  goalContext?: MoodWeekReportAiRequest['goalContext'],
): MoodWeekReportAiRequest
{
  return {
    weekStart: report.weekStart,
    weekEnd: report.weekEnd,
    stats: {
      totalEntries: report.totalEntries,
      daysLogged: report.daysLogged,
      topMoods: report.topMoods.map((m) => ({
        label: m.label,
        pct: m.pct,
        count: m.count,
      })),
      terribleCount: report.terribleCount,
      terriblePct: report.terriblePct,
      alertLevel: report.alertLevel,
    },
    notes: moodWeekReportNotes(rows, report.weekStart, report.weekEnd),
    localThemes: report.recurringThemes,
    goalContext: goalContext ?? null,
  }
}

/** Fallback local quando IA indisponível. */
export function buildLocalMoodWeekReportAi(
  report: MoodWeekReport,
): MoodWeekReportAiResponse
{
  const top = report.topMoods.map((m) => `${m.label} (${m.pct}%)`).join(' e ')
  const summary = top
    ? `Na semana, ${top} foram os humores mais frequentes entre ${report.totalEntries} registros.`
    : 'Semana com poucos registros de humor.'

  const themes: MoodWeekReportAiTheme[] = report.recurringThemes.map((t) => ({
    label: t.theme,
    count: t.count,
    examples: [t.theme],
  }))

  let careNote = 'Registro pessoal — não é diagnóstico. Cuide-se no seu ritmo.'
  if (report.alertLevel === 'concern')
  {
    careNote = 'Vários dias difíceis apareceram. Se continuar pesado, vale conversar com alguém de confiança ou buscar apoio profissional (CVV 188).'
  }
  else if (report.alertLevel === 'watch')
  {
    careNote = 'Alguns dias foram mais pesados. Observe o que ajuda e o que cansa — sem se cobrar.'
  }

  return {
    summary,
    themes,
    careNote,
    alertLevel: report.alertLevel,
    source: 'local',
    iaDisponivel: false,
  }
}
