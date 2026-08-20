import { useTaskStore } from '../store/useTaskStore'
import { bucketByDueDate } from './dueBucket'
import { fetchMorningBrief } from './morningBriefApi'
import { resolveTemporalHorizon } from './temporalHorizon'
import { grantDailyCheckinXp, recordHomeDayCheckin } from './dayCheckinReward'

let secondaryStarted = false

/** Dashboard + humor + tarefas/hábitos se ainda não vieram do layout */
export async function hydrateHomeEssential(): Promise<void>
{
  const s = useTaskStore.getState()
  const jobs: Promise<unknown>[] = [
    s.fetchDashboard(),
    s.fetchHumorResumo(),
  ]
  if (s.tarefas.length === 0)
  {
    jobs.push(s.fetchTarefas())
  }
  if (s.habitos.length === 0)
  {
    jobs.push(s.fetchHabitos())
  }
  await Promise.all(jobs)
  recordHomeDayCheckin()
}

/** Inbox, prefs, checks — depois do primeiro paint */
export async function hydrateHomeSecondary(): Promise<void>
{
  const s = useTaskStore.getState()
  await Promise.all([
    s.fetchNotificacoes(),
    s.fetchPreferencias(),
    s.fetchGamificacaoStats(),
  ])
  await grantDailyCheckinXp()
  s.syncStreakCalendarDay()
  await Promise.all([
    s.fetchPalavrasChave(),
    s.checkGoogleStatus(),
    s.fetchInbox(),
    s.fetchContasFixas(),
  ])
  await s.runFinanceCheck()
  await s.runHealthCheck()
}

export function scheduleHomeSecondary(): void
{
  if (secondaryStarted)
  {
    return
  }
  secondaryStarted = true
  const run = () =>
  {
    void hydrateHomeSecondary()
  }
  if (typeof requestIdleCallback === 'function')
  {
    requestIdleCallback(run, { timeout: 2500 })
    return
  }
  setTimeout(run, 1200)
}

/** Headline do morning-brief para o bloco de voz */
export async function fetchHomeVoiceLine(): Promise<string | null>
{
  const s = useTaskStore.getState()
  const ativas = s.tarefas.filter((t) => t.status !== 'concluida')
  const hojeTasks = ativas.filter((t) => resolveTemporalHorizon(t) === 'hoje')
  const due = bucketByDueDate(ativas)

  try
  {
    const brief = await fetchMorningBrief({
      hojeTasks,
      dueToday: due.hoje.length,
      overdue: due.vencido.length,
      dailyScoreCap: s.dailyScoreCap,
    })
    return brief.headline || null
  }
  catch
  {
    return null
  }
}
