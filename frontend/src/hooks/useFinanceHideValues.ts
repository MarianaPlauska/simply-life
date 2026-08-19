import { useCallback, useEffect, useState } from 'react'
import { readFinanceHideValues, writeFinanceHideValues } from '../lib/financeHideValues'
import { useTaskStore } from '../store/useTaskStore'

export function useFinanceHideValues(): { hidden: boolean; toggle: () => void }
{
  const userId = useTaskStore((s) => s.userId)
  const [hidden, setHidden] = useState(() => readFinanceHideValues(userId || null))

  useEffect(() =>
  {
    setHidden(readFinanceHideValues(userId || null))
  }, [userId])

  const toggle = useCallback(() =>
  {
    setHidden((prev) =>
    {
      const next = !prev
      writeFinanceHideValues(userId || null, next)
      return next
    })
  }, [userId])

  return { hidden, toggle }
}
