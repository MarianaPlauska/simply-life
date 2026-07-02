import { useCallback, useMemo, useState } from 'react'
import { useTaskStore } from '../store/useTaskStore'
import { useMoodOrchestration } from './useMoodOrchestration'
import {
  buildAxelTodayVerdict,
  canUseAxelAsk,
  type AxelTodayVerdict,
} from '../lib/axelTodayVerdict'
import { buildUnifiedNoteSnippet } from '../lib/axelUnifiedNotes'
import { bucketByDueDate } from '../lib/dueBucket'
import { fetchAxelTodayVerdictIA } from '../services/axelApi'

export function useAxelAsk()
{
  const [loading, setLoading] = useState(false)
  const [lastVerdict, setLastVerdict] = useState<AxelTodayVerdict | null>(null)
  const [iaAtiva, setIaAtiva] = useState(false)

  const tarefas = useTaskStore((s) => s.tarefas)
  const dailyScoreCap = useTaskStore((s) => s.dailyScoreCap)
  const transactions = useTaskStore((s) => s.transactions)
  const categories = useTaskStore((s) => s.categories)
  const budgetLimits = useTaskStore((s) => s.budgetLimits)
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const billSettlements = useTaskStore((s) => s.billSettlements)
  const cards = useTaskStore((s) => s.cards)
  const anotacoes = useTaskStore((s) => s.anotacoes)
  const entradasRecentes = useTaskStore((s) => s.entradasRecentes)
  const userStats = useTaskStore((s) => s.userStats)
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)
  const pushAiDecision = useTaskStore((s) => s.pushAiDecision)
  const mood = useMoodOrchestration()

  const level = userStats?.level ?? 1
  const unlocked = canUseAxelAsk(level)

  const hojeTasks = useMemo(() =>
  {
    const active = tarefas.filter((t) => t.status !== 'concluida')
    const buckets = bucketByDueDate(active)
    return [...buckets.hoje, ...buckets.vencido, ...active.filter((t) =>
      !buckets.hoje.some((x) => x.id === t.id)
      && !buckets.vencido.some((x) => x.id === t.id),
    )].slice(0, 40)
  }, [tarefas])

  const monthTransactions = useMemo(() =>
  {
    const now = new Date()
    const m = now.getMonth()
    const y = now.getFullYear()
    return transactions.filter((t) =>
    {
      const d = new Date(`${t.data.slice(0, 10)}T12:00:00`)
      return d.getMonth() === m && d.getFullYear() === y
    })
  }, [transactions])

  const ask = useCallback(async (question: string) =>
  {
    const q = question.trim()
    if (!q) return null

    setLoading(true)
    setIaAtiva(false)
    try
    {
      const recentNoteSnippet = buildUnifiedNoteSnippet(anotacoes, entradasRecentes)
      const localVerdict = buildAxelTodayVerdict({
        question: q,
        hojeTasks,
        dailyScoreCap,
        mood,
        transactions,
        monthTransactions,
        categories,
        budgetLimits,
        cashAccount,
        reservedBills,
        contasFixas,
        billSettlements,
        cards,
        recentNoteSnippet,
      })

      setLastVerdict(localVerdict)

      let verdict: AxelTodayVerdict = localVerdict

      if (workspacePrefs.ai_coach_enabled)
      {
        try
        {
          const ia = await fetchAxelTodayVerdictIA({
            context: {
              question: q,
              recentNotes: recentNoteSnippet,
              moodProfile: mood.profile,
              humorMedia: mood.humorMedia,
              effectiveDailyCap: mood.effectiveDailyCap,
              kanbanLoad: hojeTasks.filter((t) => t.status !== 'concluida').length,
            },
            localVerdict,
          })
          verdict = {
            ...localVerdict,
            tone: ia.tone,
            headline: ia.headline,
            summary: ia.summary,
            suggestedAction: ia.suggestedAction ?? localVerdict.suggestedAction,
          }
          setLastVerdict(verdict)
          setIaAtiva(ia.iaDisponivel === true)
        }
        catch
        {
          setIaAtiva(false)
        }
      }

      pushAiDecision(
        `Pergunta: "${q.slice(0, 80)}" → ${verdict.headline} (${verdict.rulesApplied.join(', ')})`,
      )
      return verdict
    }
    finally
    {
      setLoading(false)
    }
  }, [
    anotacoes,
    entradasRecentes,
    hojeTasks,
    dailyScoreCap,
    mood,
    transactions,
    monthTransactions,
    categories,
    budgetLimits,
    cashAccount,
    reservedBills,
    contasFixas,
    billSettlements,
    cards,
    workspacePrefs.ai_coach_enabled,
    pushAiDecision,
  ])

  const reset = useCallback(() =>
  {
    setLastVerdict(null)
    setIaAtiva(false)
  }, [])

  return { ask, loading, lastVerdict, unlocked, level, reset, iaAtiva }
}
