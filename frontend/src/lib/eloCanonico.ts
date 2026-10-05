// Elo (a "ofensiva") igual ao do app: o site não importa @simply-life/shared,
// então a regra fica copiada de packages/shared/src/elo.ts. Mudou lá, muda aqui.
//
// - Dia cumprido: uma ação de verdade no dia (tarefa, humor, água, refeição...).
//   Só abrir o app não cumpre o dia.
// - Descanso: o primeiro dia sem registro de cada semana (segunda a domingo) não quebra;
//   o segundo quebra. Hoje, ainda aberto, nunca quebra.
// - Nada de pausa, escudo ou fim de semana congelado: sem dias de verdade, o elo é 0.
import { supabase } from './supabase'

export type EloAcao = 'task' | 'note' | 'mood' | 'finance' | 'water' | 'focus' | 'meal'

function localIso(d: Date): string
{
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function eloHoje(ref = new Date()): string
{
  return localIso(ref)
}

function somarDias(iso: string, dias: number): string
{
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d, 12)
  dt.setDate(dt.getDate() + dias)
  return localIso(dt)
}

function segundaDe(iso: string): string
{
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d, 12)
  const dow = dt.getDay()
  dt.setDate(dt.getDate() + (dow === 0 ? -6 : 1 - dow))
  return localIso(dt)
}

/** Elo atual e recorde a partir dos dias cumpridos (AAAA-MM-DD). */
export function calcularEloSite(dias: Iterable<string>, ref = new Date()): { atual: number; recorde: number; ultimoDia: string | null }
{
  const hoje = eloHoje(ref)
  const set = new Set<string>()
  for (const raw of dias)
  {
    const iso = String(raw ?? '').slice(0, 10)
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso) && iso <= hoje) set.add(iso)
  }
  if (!set.size) return { atual: 0, recorde: 0, ultimoDia: null }
  const ordenados = [...set].sort()
  let run = 0
  let recorde = 0
  let semana = ''
  let descanso = false
  for (let iso = ordenados[0]; iso <= hoje; iso = somarDias(iso, 1))
  {
    const seg = segundaDe(iso)
    if (seg !== semana)
    {
      semana = seg
      descanso = false
    }
    if (set.has(iso)) run += 1
    else if (iso === hoje) { /* hoje aberto: não quebra */ }
    else if (!descanso) descanso = true
    else run = 0
    if (run > recorde) recorde = run
  }
  return { atual: run, recorde, ultimoDia: ordenados[ordenados.length - 1] }
}

/** Dias cumpridos desta conta no servidor (tabela elo_dias, migração 076). null = não deu. */
export async function fetchEloDiasSite(): Promise<string[] | null>
{
  try
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return null
    const { data, error } = await supabase
      .from('elo_dias')
      .select('dia, acoes')
      .eq('user_id', uid)
    if (error) return null
    return (data ?? [])
      .filter((r) => Array.isArray(r.acoes) && r.acoes.length > 0)
      .map((r) => String(r.dia).slice(0, 10))
  }
  catch
  {
    return null
  }
}

/** Marca o dia no servidor (união com o que o app já gravou). */
export async function registrarEloDiaSite(dia: string, acao: EloAcao): Promise<void>
{
  try
  {
    await supabase.rpc('elo_registrar_dias', { p_dias: [{ dia, acoes: [acao] }] })
  }
  catch
  {
    /* offline: o dia fica no aparelho e sobe na próxima ação */
  }
}
