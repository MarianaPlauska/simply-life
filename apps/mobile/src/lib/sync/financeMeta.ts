/**
 * Sincronização do que antes ficava só no aparelho (Etapa 2):
 *  - "pago" de fatura/conta fixa no mês → finance_bill_settlements (bill_id = chave do app)
 *  - nome/ícone/cor/oculta das categorias → fin_categorias (por slug)
 *  - ícone/cor/urgência das contas fixas → fin_contas_fixas
 * O aparelho continua com o cache local; o banco vence quando existir.
 * Tudo falha em silêncio se a migração 061 ainda não rodou (o local segue valendo).
 */
import { supabase, supabaseConfigured } from '../supabase'
import { useAuthStore } from '../../store/authStore'
import { resolveCategoriaId } from './finance'
import type { CategoryMeta, CategoryMetaMap } from '../categoryMeta'
import type { FixaMeta, FixaMetaMap } from '../fixaMeta'

export function financeRemoteEnabled(): boolean
{
  return supabaseConfigured && !useAuthStore.getState().isGuest
}

async function uid(): Promise<string | null>
{
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

// --- pago -------------------------------------------------------------------

export async function fetchPaidKeysRemote(): Promise<Record<string, true>>
{
  if (!financeRemoteEnabled()) return {}
  try
  {
    const since = new Date(Date.now() - 400 * 86400000).toISOString()
    const { data, error } = await supabase
      .from('finance_bill_settlements')
      .select('bill_id')
      .not('bill_id', 'is', null)
      .gte('pago_em', since)
    if (error || !data) return {}
    const out: Record<string, true> = {}
    for (const r of data) if (r.bill_id) out[String(r.bill_id)] = true
    return out
  }
  catch
  {
    return {}
  }
}

export async function setPaidRemote(key: string, paid: boolean, meta?: { titulo?: string; valor?: number }): Promise<void>
{
  if (!financeRemoteEnabled()) return
  try
  {
    const user = await uid()
    if (!user) return
    if (paid)
    {
      const { error } = await supabase.from('finance_bill_settlements').insert({
        user_id: user,
        bill_id: key,
        titulo: (meta?.titulo || key).slice(0, 200),
        valor: meta?.valor ?? 0,
        origem: 'app',
      })
      // 23505 = já estava pago (índice único da 061): tudo certo
      if (error && (error as { code?: string }).code !== '23505') throw error
      return
    }
    await supabase.from('finance_bill_settlements').delete().eq('bill_id', key)
  }
  catch
  {
    /* fica no aparelho; na próxima vez tenta de novo */
  }
}

// --- categorias ---------------------------------------------------------------

/** Só o que a pessoa personalizou (ou escondeu); as categorias criadas automaticamente não sobrescrevem o visual padrão. */
export async function fetchCategoryMetaRemote(): Promise<CategoryMetaMap>
{
  if (!financeRemoteEnabled()) return {}
  try
  {
    const { data, error } = await supabase
      .from('fin_categorias')
      .select('slug, nome, cor, icone, personalizada, oculta')
      .not('slug', 'is', null)
    if (error || !data) return {}
    const out: CategoryMetaMap = {}
    for (const r of data)
    {
      if (!r.personalizada && !r.oculta) continue
      const slug = String(r.slug)
      out[slug] = {
        label: String(r.nome || slug),
        icon: String(r.icone || 'circle'),
        color: String(r.cor || '#E8734A'),
        custom: slug.startsWith('c-'),
        hidden: Boolean(r.oculta),
      }
    }
    return out
  }
  catch
  {
    return {}
  }
}

export async function upsertCategoryMetaRemote(slug: string, meta: CategoryMeta): Promise<void>
{
  if (!financeRemoteEnabled()) return
  try
  {
    const id = await resolveCategoriaId(slug, 'despesa', meta.label)
    if (!id) return
    await supabase
      .from('fin_categorias')
      .update({
        nome: meta.label.slice(0, 50),
        cor: meta.color.slice(0, 7),
        icone: String(meta.icon).slice(0, 50),
        oculta: Boolean(meta.hidden),
        personalizada: true,
      })
      .eq('id', id)
  }
  catch
  {
    /* fica no aparelho */
  }
}

// --- contas fixas ---------------------------------------------------------------

export async function fetchFixaMetaRemote(): Promise<FixaMetaMap>
{
  if (!financeRemoteEnabled()) return {}
  try
  {
    const { data, error } = await supabase.from('fin_contas_fixas').select('id, icone, cor, urgencia')
    if (error || !data) return {}
    const out: FixaMetaMap = {}
    for (const r of data)
    {
      const meta: Partial<FixaMeta> = {}
      if (r.icone) meta.icon = String(r.icone)
      if (r.cor) meta.color = String(r.cor)
      if (r.urgencia) meta.urgencia = Number(r.urgencia) as FixaMeta['urgencia']
      if (Object.keys(meta).length) out[String(r.id)] = meta
    }
    return out
  }
  catch
  {
    return {}
  }
}

export async function upsertFixaMetaRemote(id: string | number, meta: Partial<FixaMeta>): Promise<void>
{
  if (!financeRemoteEnabled() || !/^\d+$/.test(String(id))) return
  try
  {
    const payload: Record<string, unknown> = {}
    if (meta.icon) payload.icone = meta.icon
    if (meta.color) payload.cor = meta.color
    if (meta.urgencia) payload.urgencia = meta.urgencia
    if (!Object.keys(payload).length) return
    await supabase.from('fin_contas_fixas').update(payload).eq('id', Number(id))
  }
  catch
  {
    /* fica no aparelho */
  }
}
