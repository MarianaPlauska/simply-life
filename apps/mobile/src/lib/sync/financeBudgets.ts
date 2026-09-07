import { supabase } from '../supabase'

export type MobileBudgetCategory = {
  id: number
  nome: string
  cor: string
  icone: string
  limite: number
  gasto: number
}

export async function fetchBudgetPlanning(monthOffset = 0): Promise<MobileBudgetCategory[]>
{
  const now = new Date()
  const view = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const y = view.getFullYear()
  const m = view.getMonth()
  const prefix = `${y}-${String(m + 1).padStart(2, '0')}`

  const [{ data: cats }, { data: budgets }, { data: txs }] = await Promise.all([
    supabase.from('fin_categorias').select('id, nome, cor, icone, tipo').eq('tipo', 'despesa'),
    supabase.from('fin_orcamentos').select('categoria_id, limite'),
    supabase
      .from('despesas')
      .select('categoria_id, valor, tipo, data_gasto, status_pagamento')
      .like('data_gasto', `${prefix}%`),
  ])

  const limitByCat = new Map<number, number>()
  for (const b of budgets ?? [])
  {
    if (b.categoria_id != null)
    {
      limitByCat.set(Number(b.categoria_id), Number(b.limite) || 0)
    }
  }

  const spendByCat = new Map<number, number>()
  for (const t of txs ?? [])
  {
    if (String(t.tipo || 'despesa') !== 'despesa') continue
    if (t.status_pagamento && t.status_pagamento !== 'pago') continue
    const id = Number(t.categoria_id)
    if (!id) continue
    spendByCat.set(id, (spendByCat.get(id) || 0) + (Number(t.valor) || 0))
  }

  return (cats ?? [])
    .map((c) =>
    {
      const id = Number(c.id)
      return {
        id,
        nome: String(c.nome || 'Categoria'),
        cor: String(c.cor || '#E8734A'),
        icone: String(c.icone || 'Tag'),
        limite: limitByCat.get(id) || 0,
        gasto: spendByCat.get(id) || 0,
      }
    })
    .filter((c) => c.limite > 0 || c.gasto > 0)
    .sort((a, b) => b.gasto - a.gasto)
}

export async function upsertBudgetLimit(categoriaId: number, limite: number): Promise<void>
{
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) throw new Error('Não autenticado')

  const { error } = await supabase.from('fin_orcamentos').upsert({
    user_id: uid,
    categoria_id: categoriaId,
    limite,
  }, { onConflict: 'user_id,categoria_id' })

  if (error) throw new Error(error.message)
}
