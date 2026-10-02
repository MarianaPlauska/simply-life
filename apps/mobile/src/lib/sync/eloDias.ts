import { isEloAcao } from '@simply-life/shared'
import { supabase, supabaseConfigured } from '../supabase'

/**
 * Dias cumpridos do elo no servidor (tabela elo_dias, migração 076).
 * Offline first: o aparelho grava na hora; aqui só sobe e desce em lote.
 * O envio usa a função elo_registrar_dias, que faz a UNIÃO das ações do dia
 * no banco: dois aparelhos nunca apagam o registro um do outro.
 * Sem a migração aplicada, avisa uma vez no console e segue só local.
 */

export type EloDiaRemoto = { dia: string; acoes: string[] }

/** O servidor recusa dias com mais de 400 dias (gatilho da 076). */
export const ELO_SERVIDOR_JANELA_DIAS = 400

let ausente = false
let avisado = false

function tabelaAusente(message: string, code?: string): boolean
{
  return code === '42P01'
    || code === '42883'
    || code === 'PGRST202'
    || code === 'PGRST205'
    || /does not exist|não existe|Could not find|schema cache/i.test(message)
}

function marcarAusente(): void
{
  ausente = true
  if (avisado) return
  avisado = true
  console.warn('[elo_dias] servidor sem a tabela do elo (migração 076); o elo segue só neste aparelho')
}

export function eloServidorAusente(): boolean
{
  return ausente
}

async function meuId(): Promise<string | null>
{
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

/** Todos os dias do elo desta conta. null = não deu (offline, sem 076). */
export async function fetchEloDias(): Promise<EloDiaRemoto[] | null>
{
  if (!supabaseConfigured || ausente) return null
  try
  {
    const uid = await meuId()
    if (!uid) return null
    const { data, error } = await supabase
      .from('elo_dias')
      .select('dia, acoes')
      .eq('user_id', uid)
      .order('dia', { ascending: true })
    if (error)
    {
      if (tabelaAusente(error.message, error.code)) marcarAusente()
      return null
    }
    return (data ?? []).map((r) => ({
      dia: String(r.dia).slice(0, 10),
      acoes: Array.isArray(r.acoes) ? (r.acoes as unknown[]).filter(isEloAcao) : [],
    }))
  }
  catch
  {
    return null
  }
}

/** Sobe dias (união no banco). true = gravou. */
export async function pushEloDias(rows: EloDiaRemoto[]): Promise<boolean>
{
  if (!supabaseConfigured || ausente) return false
  const limpos = rows
    .map((r) => ({ dia: r.dia.slice(0, 10), acoes: [...new Set(r.acoes.filter(isEloAcao))] }))
    .filter((r) => r.acoes.length > 0)
  if (!limpos.length) return true
  try
  {
    // lotes pequenos: a primeira subida pode ter um ano de dias
    for (let i = 0; i < limpos.length; i += 120)
    {
      const { error } = await supabase.rpc('elo_registrar_dias', { p_dias: limpos.slice(i, i + 120) })
      if (error)
      {
        if (tabelaAusente(error.message, error.code)) marcarAusente()
        return false
      }
    }
    return true
  }
  catch
  {
    return false
  }
}

/**
 * Cartão público (migração 027): o elo e o nível que os amigos e o admin
 * veem. A policy user_public_cards_own já deixa o dono atualizar a linha.
 */
export async function writePublicElo(streak: number, level: number): Promise<boolean>
{
  if (!supabaseConfigured) return false
  try
  {
    const uid = await meuId()
    if (!uid) return false
    const { error } = await supabase
      .from('user_public_cards')
      .update({
        streak_count: Math.max(0, Math.floor(streak)),
        level: Math.max(1, Math.floor(level)),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', uid)
    return !error
  }
  catch
  {
    return false
  }
}
