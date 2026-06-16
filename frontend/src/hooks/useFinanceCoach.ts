import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  buildFinanceCoachContext,
  buildLocalFinanceCoachAdvice,
  serializeCoachContextForIA,
  type FinanceCoachAdvice,
} from '../lib/financeCoachContext'
import { fetchFinanceCoachIA } from '../services/jarvisApi'
import { useTaskStore } from '../store/useTaskStore'
import { resolveAiTonePrompt } from '../lib/axelCosmetics'
import type { Transaction } from '../store/storeTypes'

interface UseFinanceCoachOptions
{
  monthTransactions: Transaction[]
  enabled?: boolean
}

interface UseFinanceCoachResult
{
  advice: FinanceCoachAdvice | null
  loading: boolean
  iaAtiva: boolean
  refresh: () => void
}

export function useFinanceCoach({
  monthTransactions,
  enabled = true,
}: UseFinanceCoachOptions): UseFinanceCoachResult
{
  const transactions = useTaskStore((s) => s.transactions)
  const categories = useTaskStore((s) => s.categories)
  const budgetLimits = useTaskStore((s) => s.budgetLimits)
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)
  const userStats = useTaskStore((s) => s.userStats)
  const streakCount = useTaskStore((s) => s.streakCount)

  const [advice, setAdvice] = useState<FinanceCoachAdvice | null>(null)
  const [loading, setLoading] = useState(false)
  const [iaAtiva, setIaAtiva] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const ctx = useMemo(
    () => buildFinanceCoachContext({
      transactions,
      monthTransactions,
      categories,
      budgetLimits,
      saldoInicial: cashAccount.saldo_inicial,
      reservedBills,
    }),
    [
      transactions,
      monthTransactions,
      categories,
      budgetLimits,
      cashAccount.saldo_inicial,
      reservedBills,
    ],
  )

  const localAdvice = useMemo(
    () => buildLocalFinanceCoachAdvice(
      ctx,
      transactions,
      cashAccount.saldo_inicial,
      reservedBills,
    ),
    [ctx, transactions, cashAccount.saldo_inicial, reservedBills],
  )

  const runCoach = useCallback(async (signal?: AbortSignal) =>
  {
    setLoading(true)
    setAdvice(localAdvice)

    try
    {
      const aiTone = resolveAiTonePrompt(
        workspacePrefs.active_cosmetics.ai_tone,
        { level: userStats?.level ?? 1, streakCount },
        workspacePrefs.unlocked_cosmetics,
      )

      const ia = await fetchFinanceCoachIA({
        context: serializeCoachContextForIA(ctx),
        localAdvice: { ...localAdvice },
        aiTone,
        signal,
      })

      if (signal?.aborted) return

      const merged: FinanceCoachAdvice = {
        ...localAdvice,
        ...ia,
        limitSuggestions: mergeLimitSuggestions(localAdvice, ia, categories),
        source: ia.source === 'groq' ? 'groq' : 'local',
      }

      setAdvice(merged)
      setIaAtiva(ia.iaDisponivel === true)
    }
    catch
    {
      if (!signal?.aborted)
      {
        setAdvice(localAdvice)
        setIaAtiva(false)
      }
    }
    finally
    {
      if (!signal?.aborted) setLoading(false)
    }
  }, [ctx, localAdvice, categories, workspacePrefs, userStats?.level, streakCount])

  const refresh = useCallback(() =>
  {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    void runCoach(ctrl.signal)
  }, [runCoach])

  useEffect(() =>
  {
    if (!enabled)
    {
      setAdvice(null)
      return
    }

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    void runCoach(ctrl.signal)

    return () => ctrl.abort()
  }, [enabled, runCoach])

  return {
    advice: advice ?? localAdvice,
    loading,
    iaAtiva,
    refresh,
  }
}

function mergeLimitSuggestions(
  local: FinanceCoachAdvice,
  ia: {
    limitSuggestions?: Array<{
      categoriaNome: string
      valorSugerido: number
      motivo: string
    }>
  },
  categories: { id: number; nome: string }[],
): FinanceCoachAdvice['limitSuggestions']
{
  const fromIa = (ia.limitSuggestions ?? [])
    .map((s) =>
    {
      const cat = categories.find(
        (c) => c.nome.toLowerCase() === s.categoriaNome.toLowerCase(),
      )
      if (!cat || s.valorSugerido <= 0) return null
      return {
        categoriaId: cat.id,
        categoriaNome: cat.nome,
        valorSugerido: s.valorSugerido,
        motivo: s.motivo,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x != null)

  if (fromIa.length > 0) return fromIa.slice(0, 3)
  return local.limitSuggestions
}
