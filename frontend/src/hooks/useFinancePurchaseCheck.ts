import { useCallback, useState } from 'react'
import {
  buildLocalPurchaseVerdict,
  buildPurchaseCheckContext,
  type PurchaseCheckInput,
  type PurchaseVerdict,
} from '../lib/financePurchaseCheck'
import { fetchFinancePurchaseCheckIA } from '../services/jarvisApi'

export function useFinancePurchaseCheck()
{
  const [loading, setLoading] = useState(false)
  const [verdict, setVerdict] = useState<PurchaseVerdict | null>(null)
  const [iaAtiva, setIaAtiva] = useState(false)

  const checkPurchase = useCallback(async (input: PurchaseCheckInput) =>
  {
    setLoading(true)
    const local = buildLocalPurchaseVerdict(input)
    setVerdict(local)

    try
    {
      const ctx = buildPurchaseCheckContext(input)
      const ia = await fetchFinancePurchaseCheckIA({
        context: ctx,
        localVerdict: { ...local },
      })
      setVerdict({
        ...local,
        tone: ia.tone,
        headline: ia.headline,
        detail: ia.detail,
        diasSugeridos: ia.diasSugeridos ?? local.diasSugeridos,
        source: ia.source === 'groq' ? 'groq' : 'local',
      })
      setIaAtiva(ia.iaDisponivel === true)
    }
    catch
    {
      setVerdict(local)
      setIaAtiva(false)
    }
    finally
    {
      setLoading(false)
    }

    return local
  }, [])

  const reset = useCallback(() =>
  {
    setVerdict(null)
    setIaAtiva(false)
  }, [])

  return { loading, verdict, iaAtiva, checkPurchase, reset }
}
