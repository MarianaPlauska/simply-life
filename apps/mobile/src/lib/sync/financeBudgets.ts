import { FINANCE_CATEGORY_LABELS, type FinanceCategory } from '@simply-life/shared'
import { supabase } from '../supabase'
import { resolveCategoriaId } from './finance'

export type MobileBudgetCategory = {
  id: number
  /** categoria do app ('alimentacao', 'c-pet'), quando ligada por slug */
  slug: string | null
  nome: string
  cor: string
  icone: string
  limite: number
  gasto: number
}

const BUILTIN = Object.keys(FINANCE_CATEGORY_LABELS) as FinanceCategory[]

/**
 * Orçamento por categoria no mês.
 * Correção da Etapa 1: o app gravava só o texto da categoria ('alimentacao') e o
 * orçamento somava por categoria_id → gastos novos não contavam. Agora:
 *  - gastos novos já saem com categoria_id (addDespesa → resolveCategoriaId)
 *  - gastos antigos sem categoria_id contam pelo texto, via slug da fin_categorias
 *  - as categorias do app existem no banco, então dá para pôr limite no celular
 */
export async function fetchBudgetPlanning(monthOffset = 0): Promise<MobileBudgetCategory[]>
{
  const now = new Date()
  const view = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const y = view.getFullYear()
  const m = view.getMonth()
  const prefix = `${y}-${String(m + 1).padStart(2, '0')}`

  // garante as categorias padrão do app (cria na primeira vez; depois vem do cache)
  await Promise.all(BUILTIN.map((slug) => resolveCategoriaId(slug, 'despesa').catch(() => null)))

  const [{ data: cats, error: catErr }, { data: budgets }, { data: txs }] = await Promise.all([
    supabase.from('fin_categorias').select('*').eq('tipo', 'despesa'),
    supabase.from('fin_orcamentos').select('categoria_id, limite'),
    supabase
      .from('despesas')
      .select('categoria_id, categoria, valor, tipo, data_gasto, status_pagamento')
      .like('data_gasto', `${prefix}%`),
  ])
  if (catErr) throw new Error(catErr.message)

  const limitByCat = new Map<number, number>()
  for (const b of budgets ?? [])
  {
    if (b.categoria_id != null) limitByCat.set(Number(b.categoria_id), Number(b.limite) || 0)
  }
  const idBySlug = new Map<string, number>()
  for (const c of cats ?? [])
  {
    const slug = (c as { slug?: string | null }).slug
    if (slug) idBySlug.set(slug, Number(c.id))
  }

  const spendByCat = new Map<number, number>()
  for (const t of txs ?? [])
  {
    if (String(t.tipo || 'despesa') !== 'despesa') continue
    if (t.status_pagamento && t.status_pagamento !== 'pago') continue
    const id = Number(t.categoria_id) || idBySlug.get(String(t.categoria || '')) || 0
    if (!id) continue
    spendByCat.set(id, (spendByCat.get(id) || 0) + (Number(t.valor) || 0))
  }

  return (cats ?? [])
    .map((c) =>
    {
      const id = Number(c.id)
      const slug = (c as { slug?: string | null }).slug ?? null
      return {
        id,
        slug,
        nome: String(c.nome || 'Categoria'),
        cor: String(c.cor || '#E8734A'),
        icone: String(c.icone || 'Tag'),
        limite: limitByCat.get(id) || 0,
        gasto: spendByCat.get(id) || 0,
      }
    })
    // categorias antigas (sem slug) só aparecem se tiverem limite ou gasto
    .filter((c) => c.slug != null || c.limite > 0 || c.gasto > 0)
    .sort((a, b) => b.gasto - a.gasto || b.limite - a.limite || a.nome.localeCompare(b.nome))
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
