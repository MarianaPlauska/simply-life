import {
  checkPurchase,
  formatBRL,
  purchaseCheckMessage,
  type PurchaseCheck,
  type PurchaseLaunch,
} from '@simply-life/shared'
import { useDataStore } from '../store/dataStore'
import { useSpendGuardStore, type SpendGuardHostId } from '../store/spendGuardStore'
import { currentMonthProjection, expectedMonthlyIncome, hydrateProjectionStores } from './monthProjection'

let hydrated: Promise<void> | null = null

export type SpendGuardInput = {
  /** cada lançamento que o gasto vai criar (uma linha por parcela) */
  launches: PurchaseLaunch[]
  /** cartão de crédito usado, se for no crédito */
  cardId?: string | null
  host?: SpendGuardHostId
}

/** Refaz a conta do mês (e dos próximos, se houver parcelas) com o gasto novo. */
export function evaluateSpend(input: Omit<SpendGuardInput, 'host'>): PurchaseCheck
{
  const { finance: txs, contasFixas: fixas, financeCards } = useDataStore.getState()
  const card = input.cardId ? financeCards.find((c) => c.id === input.cardId) : null
  return checkPurchase({
    projection: currentMonthProjection(),
    launches: input.launches,
    credito: card ? { diaVencimento: card.diaVencimento } : null,
    txs,
    fixas,
    rendaMensal: expectedMonthlyIncome(),
  })
}

/**
 * Chamar antes de salvar um gasto, em qualquer tela.
 * Se o gasto aperta o mês, abre o aviso e espera: true = pode salvar, false = a pessoa desistiu.
 * Nunca impede: no nível "Firme" o "Salvar mesmo assim" só demora alguns segundos para liberar.
 */
export async function guardSpend(input: SpendGuardInput): Promise<boolean>
{
  const guard = useSpendGuardStore.getState()
  await guard.hydrate()
  if (useSpendGuardStore.getState().level === 'desligado') return true
  try
  {
    hydrated ??= hydrateProjectionStores()
    await hydrated
    const check = evaluateSpend(input)
    if (check.tom !== 'apertado') return true
    const msg = purchaseCheckMessage(check, formatBRL)
    return await useSpendGuardStore.getState().ask({
      host: input.host ?? 'root',
      titulo: msg.titulo,
      mensagem: msg.mensagem,
      check,
      firme: useSpendGuardStore.getState().level === 'firme',
    })
  }
  catch
  {
    // a conta nunca trava o lançamento
    return true
  }
}
