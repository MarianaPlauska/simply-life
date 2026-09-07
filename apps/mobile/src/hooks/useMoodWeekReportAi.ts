import { useEffect, useState } from 'react'
import {
  buildLocalMoodWeekReportAi,
  buildMoodWeekReportAiRequest,
  moodGoalPeriodStats,
  type HumorRegistro,
  type LifeGoal,
  type MoodWeekReport,
  type MoodWeekReportAiResponse,
} from '@simply-life/shared'
import { apiFetch } from '../lib/apiBase'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { usePrefsStore } from '../store/prefsStore'

type State = {
  ai: MoodWeekReportAiResponse | null
  loading: boolean
  error: string | null
}

/** Busca leitura AXEL do relatório semanal (cache servidor + fallback local). */
export function useMoodWeekReportAi(
  report: MoodWeekReport | null,
  humor: HumorRegistro[],
  lifeGoal: LifeGoal | null | undefined,
): State
{
  const isGuest = useAuthStore((s) => s.isGuest)
  const aiCoach = usePrefsStore((s) => s.prefs.ai_coach_enabled)
  const [state, setState] = useState<State>({
    ai: null,
    loading: false,
    error: null,
  })

  useEffect(() =>
  {
    if (!report)
    {
      setState({ ai: null, loading: false, error: null })
      return
    }

    const local = buildLocalMoodWeekReportAi(report)

    if (isGuest || !aiCoach || !supabaseConfigured)
    {
      setState({ ai: local, loading: false, error: null })
      return
    }

    let cancelled = false
    setState({ ai: local, loading: true, error: null })

    const run = async () =>
    {
      try
      {
        const goalStats = moodGoalPeriodStats(humor, lifeGoal)
        const goalContext = lifeGoal?.title?.trim()
          ? {
              title: lifeGoal.title.trim(),
              terribleDuringGoal: goalStats && goalStats.terribleCount > 0
                ? { count: goalStats.terribleCount, pct: goalStats.terriblePct }
                : undefined,
            }
          : null

        const body = buildMoodWeekReportAiRequest(report, humor, goalContext)
        const { data: session } = await supabase.auth.getSession()
        const token = session.session?.access_token

        if (!token)
        {
          if (!cancelled)
          {
            setState({ ai: local, loading: false, error: null })
          }
          return
        }

        const res = await apiFetch('/api/axel/mood-week-report', {
          method: 'POST',
          token,
          body,
        })

        const json = (await res.json().catch(() => ({}))) as Partial<MoodWeekReportAiResponse>

        if (!res.ok)
        {
          if (!cancelled)
          {
            setState({
              ai: local,
              loading: false,
              error: String((json as { error?: string }).error || 'Falha na leitura AXEL'),
            })
          }
          return
        }

        if (!cancelled)
        {
          setState({
            ai: {
              summary: String(json.summary || local.summary),
              themes: Array.isArray(json.themes) && json.themes.length
                ? json.themes
                : local.themes,
              careNote: String(json.careNote || local.careNote),
              alertLevel: json.alertLevel || local.alertLevel,
              source: json.source || 'local',
              iaDisponivel: Boolean(json.iaDisponivel),
            },
            loading: false,
            error: null,
          })
        }
      }
      catch
      {
        if (!cancelled)
        {
          setState({ ai: local, loading: false, error: null })
        }
      }
    }

    void run()

    return () =>
    {
      cancelled = true
    }
  }, [
    report?.weekStart,
    report?.weekEnd,
    report?.totalEntries,
    humor,
    lifeGoal,
    isGuest,
    aiCoach,
  ])

  return state
}
