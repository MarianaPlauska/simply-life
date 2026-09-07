import { supabase } from '../supabase'
import type { MobileTask, TaskStatus } from '@simply-life/shared'
import { parseEvoPct, todayIso } from '@simply-life/shared'

function mapStatus(raw: string | null | undefined): TaskStatus
{
  const s = (raw || '').toLowerCase()
  if (s === 'done' || s === 'concluido' || s === 'concluída' || s === 'concluida') return 'done'
  if (s === 'doing' || s === 'em_andamento' || s === 'em_progresso' || s === 'progresso') return 'doing'
  return 'todo'
}

function parseHoraMinutos(dataVencimento: string | null): number | null
{
  if (!dataVencimento || dataVencimento.length < 16) return null
  const d = new Date(dataVencimento)
  if (Number.isNaN(d.getTime())) return null
  // só usa hora se não for meia-noite “fake”
  const mins = d.getHours() * 60 + d.getMinutes()
  return mins === 0 ? null : mins
}

function mapTask(row: Record<string, unknown>): MobileTask
{
  const due = row.data_vencimento ? String(row.data_vencimento) : null
  const status = mapStatus(row.status as string)
  const subtarefas = (row.subtarefas as { id: number; texto?: string; titulo?: string; concluida?: boolean; feito?: boolean }[]) || []
  const checks = subtarefas.map((s) => ({
    id: String(s.id),
    texto: s.texto || s.titulo || 'Item',
    feito: Boolean(s.concluida ?? s.feito),
  }))
  const doneCount = checks.filter((c) => c.feito).length
  const anotacao = String(row.notas_locais || row.descricao || '')
  const evo = parseEvoPct(anotacao)
  const progresso = status === 'done'
    ? 1
    : evo != null
      ? evo / 100
      : checks.length > 0
        ? doneCount / checks.length
        : status === 'doing'
          ? 0.4
          : 0

  return {
    id: String(row.id),
    titulo: String(row.titulo || 'Sem título'),
    status,
    dataVencimento: due ? due.slice(0, 10) : null,
    horaMinutos: parseHoraMinutos(due),
    estimativaMinutos: Number(row.estimativa_minutos) || 30,
    progresso,
    checklist: checks,
    anotacao,
    prioridade: (Number(row.prioridade) || 2) as 1 | 2 | 3,
  }
}

export async function fetchTarefas(): Promise<MobileTask[]>
{
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) throw new Error('Não autenticado')

  const { data, error } = await supabase
    .from('tarefas_unificadas')
    .select('*, subtarefas(*)')
    .eq('user_id', uid)
    .is('deletado_em', null)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) throw new Error(error.message)
  return (data || []).map((r) => mapTask(r as Record<string, unknown>))
}

export async function createTarefa(
  titulo: string,
  notas?: string,
  extra?: {
    dataVencimento?: string | null
    horaMinutos?: number | null
    estimativaMinutos?: number
    prioridade?: 1 | 2 | 3
    status?: TaskStatus
  },
): Promise<MobileTask>
{
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) throw new Error('Não autenticado')

  const dueDate = extra && Object.prototype.hasOwnProperty.call(extra, 'dataVencimento')
    ? extra.dataVencimento ?? null
    : todayIso()
  let due = dueDate
  if (due && extra?.horaMinutos != null)
  {
    const h = Math.floor(extra.horaMinutos / 60)
    const m = extra.horaMinutos % 60
    due = `${due}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
  }
  const status = extra?.status ?? 'todo'
  const dbStatus =
    status === 'done' ? 'concluido' : status === 'doing' ? 'em_andamento' : 'pendente'

  const { data, error } = await supabase
    .from('tarefas_unificadas')
    .insert({
      user_id: uid,
      titulo: titulo.trim(),
      notas_locais: notas?.trim() || null,
      status: dbStatus,
      origem: 'mobile',
      score_urgencia: extra?.prioridade === 1 ? 80 : extra?.prioridade === 3 ? 30 : 50,
      data_vencimento: due,
      prioridade: extra?.prioridade ?? 2,
      estimativa_minutos: extra?.estimativaMinutos ?? 30,
    })
    .select('*, subtarefas(*)')
    .single()

  if (error) throw new Error(error.message)
  return mapTask(data as Record<string, unknown>)
}

export async function updateTarefaStatus(taskId: string, done: boolean): Promise<void>
{
  await persistTaskStatus(taskId, done ? 'done' : 'todo')
}

export async function persistTaskStatus(taskId: string, status: TaskStatus): Promise<void>
{
  const db =
    status === 'done' ? 'concluido' : status === 'doing' ? 'em_andamento' : 'pendente'
  const { error } = await supabase
    .from('tarefas_unificadas')
    .update({ status: db })
    .eq('id', Number(taskId))

  if (error) throw new Error(error.message)
}

export async function updateTarefaDue(taskId: string, due: string | null): Promise<void>
{
  const { error } = await supabase
    .from('tarefas_unificadas')
    .update({ data_vencimento: due })
    .eq('id', Number(taskId))

  if (error) throw new Error(error.message)
}

export async function archiveTarefa(taskId: string): Promise<void>
{
  const { error } = await supabase
    .from('tarefas_unificadas')
    .update({ deletado_em: new Date().toISOString() })
    .eq('id', Number(taskId))

  if (error) throw new Error(error.message)
}

export async function patchTarefa(
  taskId: string,
  fields: {
    titulo?: string
    notas_locais?: string | null
    prioridade?: number
    estimativa_minutos?: number
    data_vencimento?: string | null
  },
): Promise<void>
{
  const { error } = await supabase
    .from('tarefas_unificadas')
    .update(fields)
    .eq('id', Number(taskId))

  if (error) throw new Error(error.message)
}

export async function insertSubtarefa(taskId: string, titulo: string): Promise<{ id: string; texto: string; feito: boolean }>
{
  const { data, error } = await supabase
    .from('subtarefas')
    .insert({ tarefa_id: Number(taskId), titulo: titulo.trim(), ordem: 99 })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return {
    id: String((data as { id: number }).id),
    texto: titulo.trim(),
    feito: false,
  }
}

export async function toggleSubtarefa(taskId: string, subId: string, feito: boolean): Promise<void>
{
  const { error } = await supabase
    .from('subtarefas')
    .update({ concluida: feito ? 1 : 0 })
    .eq('id', Number(subId))
    .eq('tarefa_id', Number(taskId))

  if (error)
  {
    // schema legado pode usar "feito"
    const alt = await supabase
      .from('subtarefas')
      .update({ feito })
      .eq('id', Number(subId))
    if (alt.error) throw new Error(alt.error.message)
  }
}
