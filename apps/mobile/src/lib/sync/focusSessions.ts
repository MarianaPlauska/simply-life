import { supabase, supabaseConfigured } from '../supabase'

export type SilentSession = {
  id: string
  anfitriao: string
  convidado: string
  inicio: string
  fim: string
  estado: 'convite' | 'ativa' | 'encerrada' | 'recusada'
}

function newId(): string
{
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
  if (c?.randomUUID) return c.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) =>
  {
    const n = Math.floor(Math.random() * 16)
    return (ch === 'x' ? n : (n & 0x3) | 0x8).toString(16)
  })
}

async function uid(): Promise<string | null>
{
  if (!supabaseConfigured) return null
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

export async function listSilentSessions(): Promise<{ rows: SilentSession[]; error: string | null }>
{
  const me = await uid()
  if (!me) return { rows: [], error: null }
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('foco_sessoes')
    .select('id, anfitriao, convidado, inicio, fim, estado')
    .or(`anfitriao.eq.${me},convidado.eq.${me}`)
    .in('estado', ['convite', 'ativa'])
    .gt('fim', now)
  if (error) return { rows: [], error: 'A sessão em silêncio ainda não está disponível nesta conta.' }
  return { rows: (data ?? []) as SilentSession[], error: null }
}

export async function createSilentSession(convidado: string, minutes = 25): Promise<{ ok: boolean; error?: string }>
{
  const me = await uid()
  if (!me) return { ok: false, error: 'Entre com a conta para chamar alguém.' }
  const inicio = new Date()
  const fim = new Date(inicio.getTime() + minutes * 60 * 1000)
  const { error } = await supabase.from('foco_sessoes').insert({
    id: newId(),
    anfitriao: me,
    convidado,
    inicio: inicio.toISOString(),
    fim: fim.toISOString(),
    estado: 'convite',
  })
  if (error) return { ok: false, error: 'Não foi possível enviar o convite.' }
  return { ok: true }
}

export async function setSilentState(id: string, estado: SilentSession['estado']): Promise<void>
{
  await supabase.from('foco_sessoes').update({ estado }).eq('id', id)
}
