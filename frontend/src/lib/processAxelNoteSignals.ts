// Processa sinais de anotações - 1 nudge/dia, log explicável

import { toast } from 'sonner'
import { useTaskStore } from '../store/useTaskStore'
import { buildDayCapacity } from './dayCapacity'
import { bucketByDueDate } from './dueBucket'
import { buildCategoryBudgetRows } from './financeCategoryBudget'
import {
  buildNoteSignalNudge,
  extractNoteSignals,
} from './axelNoteSignals'
import { canEmitNoteNudgeToday, markNoteNudgeEmitted } from './axelNoteNudgeGate'
import { buildMoodOrchestrationContext } from './moodOrchestration'
import { getActiveStorageUserId } from './userScopedStorage'

export function processAxelNoteSignals(text: string): void
{
  const trimmed = text.trim()
  if (trimmed.length < 8) return

  const signals = extractNoteSignals(trimmed)
  if (!signals.length) return

  const uid = getActiveStorageUserId()
  if (!canEmitNoteNudgeToday(uid)) return

  const s = useTaskStore.getState()
  const mood = buildMoodOrchestrationContext(
    s.humorHojeLista,
    s.humorSemanaAgregado,
    s.dailyScoreCap,
  )

  const buckets = bucketByDueDate(s.tarefas.filter((t) => t.status !== 'concluida'))
  const hojeTasks = [...buckets.hoje, ...buckets.vencido]

  const capacity = buildDayCapacity({
    hojeTasks,
    dailyScoreCap: s.dailyScoreCap,
    mood,
    transactions: s.transactions,
    cashAccount: s.cashAccount,
    reservedBills: s.reservedBills,
    contasFixas: s.contasFixas,
    billSettlements: s.billSettlements ?? [],
  })

  const now = new Date()
  const monthTx = s.transactions.filter((t) =>
  {
    const d = new Date(`${t.data.slice(0, 10)}T12:00:00`)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const rows = buildCategoryBudgetRows(s.categories, s.budgetLimits, monthTx)
  const lazer = rows.find((r) => /lazer/i.test(r.nome))
  const lazerPct = lazer && lazer.limite > 0 ? (lazer.gasto / lazer.limite) * 100 : 0

  const nudge = buildNoteSignalNudge(signals, {
    impulseRisk: capacity.impulseRisk,
    kanbanLoadPct: capacity.factors.find((f) => f.id === 'kanban')?.pct,
    lazerBudgetPct: lazerPct,
  })

  if (!nudge) return

  markNoteNudgeEmitted(uid)
  s.pushAiDecision(`Nota: ${nudge.title} (${nudge.rules.join(' + ')})`)
  toast.message(nudge.title, { description: nudge.body, duration: 6000 })
}
