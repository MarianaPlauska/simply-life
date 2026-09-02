import { toast } from 'sonner'
import type { DumpCard } from './lifeDumpParse'
import { guessCategoryId } from './financeQuickCapture'
import { findCategory } from './financeCategoryTree'
import { useTaskStore } from '../store/useTaskStore'

const ORIGEM = 'dump'

async function requestNotifIfNeeded(): Promise<void>
{
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'default') return
  try
  {
    await Notification.requestPermission()
  }
  catch { /* ignore */ }
}

/** Grava cartões confirmados — nada entra sem kept */
export async function commitLifeDump(cards: DumpCard[]): Promise<number>
{
  const kept = cards.filter((c) => c.kept)
  if (kept.length === 0) return 0

  const store = useTaskStore.getState()
  let saved = 0

  const needsReminder = kept.some((c) => c.kind === 'compromisso' && c.hora)
  if (needsReminder)
  {
    await requestNotifIfNeeded()
  }

  for (const card of kept)
  {
    if (card.kind === 'gasto' && card.gasto)
    {
      const catId = guessCategoryId(card.gasto.descricao, store.categories, card.gasto.tipo)
      const cat = catId ? findCategory(store.categories, catId) : undefined
      await store.addTransaction({
        descricao: card.gasto.descricao,
        valor: card.gasto.valor,
        tipo: card.gasto.tipo,
        categoria: card.gasto.tipo === 'receita'
          ? (cat?.nome ?? 'receita')
          : (cat?.nome ?? 'outros'),
        categoria_id: catId,
        data: new Date().toISOString().slice(0, 10),
        status_pagamento: 'pago',
        forma_pagamento: 'pix',
      })
      store.registerInteraction?.('financeiro')
      saved += 1
      continue
    }

    const notas = card.medo > 0 ? `medo:${card.medo}` : undefined
    const scoreBoost = card.medo === 2 ? 12 : card.medo === 1 ? 6 : 0
    const id = await store.createTarefa(
      card.titulo,
      notas,
      {
        data_vencimento: card.dataVencimento ?? undefined,
        origem: ORIGEM,
      },
    )
    if (id && scoreBoost > 0)
    {
      const current = store.tarefas.find((t) => t.id === id)
      const next = Math.min(100, (current?.score_urgencia ?? 20) + scoreBoost)
      await store.updateTarefa(id, { score_urgencia: next })
    }
    saved += 1
  }

  store.completeOnboardingStep?.('dump_vida')
  toast.success(
    saved === 1 ? '1 item na sua vida' : `${saved} itens na sua vida`,
    { description: 'Confira a Agenda e o Kanban.' },
  )
  return saved
}
