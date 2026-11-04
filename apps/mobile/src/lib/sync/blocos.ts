import type { Bloco, BlocoMarca } from '@simply-life/shared'
import { supabase } from '../supabase'

async function uid(): Promise<string>
{
  const { data } = await supabase.auth.getUser()
  const id = data.user?.id
  if (!id) throw new Error('Não autenticado')
  return id
}

function mapBloco(r: Record<string, unknown>): Bloco
{
  return {
    id: String(r.id),
    titulo: String(r.titulo || 'Sem título'),
    tipo: r.tipo === 'flexivel' ? 'flexivel' : 'fixo',
    dataInicio: String(r.data_inicio).slice(0, 10),
    horaMinutos: r.hora_minutos == null ? null : Number(r.hora_minutos),
    duracaoMinutos: Number(r.duracao_minutos) || 30,
    repete: r.repete === 'diario' || r.repete === 'semanal' ? r.repete : 'nao',
    diasSemana: Array.isArray(r.dias_semana) ? (r.dias_semana as number[]).map(Number) : [],
    intervaloSemanas: Number(r.intervalo_semanas) || 1,
    repeteAte: r.repete_ate ? String(r.repete_ate).slice(0, 10) : null,
    avisoMinutos: r.aviso_minutos == null ? null : Number(r.aviso_minutos),
    avisoFim: Boolean(r.aviso_fim),
    cor: r.cor ? String(r.cor) : null,
    categoria: r.categoria ? String(r.categoria) : null,
  }
}

function toRow(b: Bloco, userId: string): Record<string, unknown>
{
  return {
    id: b.id,
    user_id: userId,
    titulo: b.titulo,
    tipo: b.tipo,
    data_inicio: b.dataInicio,
    hora_minutos: b.horaMinutos,
    duracao_minutos: b.duracaoMinutos,
    repete: b.repete,
    dias_semana: b.diasSemana,
    intervalo_semanas: b.intervaloSemanas,
    repete_ate: b.repeteAte,
    aviso_minutos: b.avisoMinutos,
    aviso_fim: b.avisoFim,
    cor: b.cor,
    categoria: b.categoria,
    updated_at: new Date().toISOString(),
  }
}

export async function fetchBlocos(): Promise<{ blocos: Bloco[]; marcas: BlocoMarca[] }>
{
  const userId = await uid()
  const [b, m] = await Promise.all([
    supabase.from('blocos').select('*').eq('user_id', userId).is('deletado_em', null),
    supabase.from('bloco_marcas').select('*').eq('user_id', userId),
  ])
  if (b.error) throw new Error(b.error.message)
  if (m.error) throw new Error(m.error.message)
  return {
    blocos: (b.data || []).map((r) => mapBloco(r as Record<string, unknown>)),
    marcas: (m.data || []).map((r) => ({
      blocoId: String(r.bloco_id),
      dia: String(r.dia).slice(0, 10),
      status: r.status === 'feito' || r.status === 'pulado' ? r.status : null,
      horaMinutos: r.hora_minutos == null ? null : Number(r.hora_minutos),
    })),
  }
}

export async function upsertBloco(b: Bloco): Promise<void>
{
  const { error } = await supabase.from('blocos').upsert(toRow(b, await uid()))
  if (error) throw new Error(error.message)
}

export async function archiveBloco(id: string): Promise<void>
{
  const { error } = await supabase.from('blocos').update({ deletado_em: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function upsertMarca(m: BlocoMarca): Promise<void>
{
  const { error } = await supabase.from('bloco_marcas').upsert({
    bloco_id: m.blocoId,
    dia: m.dia,
    user_id: await uid(),
    status: m.status,
    hora_minutos: m.horaMinutos,
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
}
