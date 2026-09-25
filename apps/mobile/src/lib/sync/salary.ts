import type { OvertimeEntry, SalaryConfig, WorkSchedule } from '@simply-life/shared'
import { supabase } from '../supabase'

/** Salário salvo: config de cálculo + horário (o divisor sai do horário). */
export type StoredSalary = SalaryConfig & WorkSchedule & { id: number | null }

export type SalaryConfirmation = {
  competencia: string
  valorPrevisto: number
  brutoPrevisto: number | null
  valorReal: number | null
  despesaId: string | null
  confirmadoEm: string | null
}

async function uid(): Promise<string | null>
{
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

function rowToSalary(r: Record<string, unknown>): StoredSalary
{
  return {
    id: Number(r.id),
    titulo: String(r.titulo || 'Salário'),
    base: Number(r.valor) || 0,
    horasSemanais: Number(r.horas_semanais) || 40,
    entrada: String(r.entrada || '08:00'),
    saida: String(r.saida || '17:00'),
    intervaloMin: Number(r.intervalo_min ?? 60),
    diasSemana: Number(r.dias_semana) || 5,
    heUtilPct: Number(r.he_util_pct ?? 50),
    heFolgaPct: Number(r.he_folga_pct ?? 100),
    noturnoPct: r.noturno_pct == null ? null : Number(r.noturno_pct),
    dsrSobreHe: r.dsr_sobre_he !== false,
    diaFechamento: r.dia_fechamento == null ? null : Number(r.dia_fechamento),
    quintoDiaUtil: r.quinto_dia_util !== false,
    diaRecebimento: Number(r.dia_recebimento) || 5,
    taxaDesconto: r.taxa_desconto == null ? null : Number(r.taxa_desconto),
    feriadosLocais: (r.feriados_locais as string[]) ?? [],
  }
}

function salaryToRow(s: StoredSalary): Record<string, unknown>
{
  return {
    titulo: s.titulo,
    valor: s.base,
    variavel: true,
    horas_semanais: s.horasSemanais,
    entrada: s.entrada,
    saida: s.saida,
    intervalo_min: s.intervaloMin,
    dias_semana: s.diasSemana,
    he_util_pct: s.heUtilPct,
    he_folga_pct: s.heFolgaPct,
    noturno_pct: s.noturnoPct,
    dsr_sobre_he: s.dsrSobreHe,
    dia_fechamento: s.diaFechamento,
    quinto_dia_util: s.quintoDiaUtil,
    dia_recebimento: Math.min(31, Math.max(1, s.diaRecebimento)),
    taxa_desconto: s.taxaDesconto,
    feriados_locais: s.feriadosLocais ?? [],
    ativa: true,
  }
}

export async function fetchSalary(): Promise<StoredSalary | null>
{
  const { data, error } = await supabase
    .from('fin_receitas_recorrentes')
    .select('*')
    .eq('variavel', true)
    .eq('ativa', true)
    .order('created_at', { ascending: true })
    .limit(1)
  if (error) throw new Error(error.message)
  return data?.[0] ? rowToSalary(data[0] as Record<string, unknown>) : null
}

export async function saveSalary(s: StoredSalary): Promise<StoredSalary>
{
  const user = await uid()
  if (!user) throw new Error('Não autenticado')
  if (s.id)
  {
    const { error } = await supabase.from('fin_receitas_recorrentes').update(salaryToRow(s)).eq('id', s.id)
    if (error) throw new Error(error.message)
    return s
  }
  const { data, error } = await supabase
    .from('fin_receitas_recorrentes')
    .insert({ user_id: user, ...salaryToRow(s) })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return rowToSalary(data as Record<string, unknown>)
}

export async function fetchOvertime(receitaId: number, sinceIso: string): Promise<OvertimeEntry[]>
{
  const { data, error } = await supabase
    .from('fin_horas_extras')
    .select('id, data, minutos, tipo, nota')
    .eq('receita_id', receitaId)
    .gte('data', sinceIso)
    .order('data', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map((r) => ({
    id: String(r.id),
    data: String(r.data),
    minutos: Number(r.minutos),
    tipo: r.tipo as OvertimeEntry['tipo'],
    nota: r.nota ? String(r.nota) : null,
  }))
}

export async function insertOvertime(receitaId: number, e: OvertimeEntry): Promise<OvertimeEntry>
{
  const user = await uid()
  if (!user) throw new Error('Não autenticado')
  const { data, error } = await supabase
    .from('fin_horas_extras')
    .insert({ user_id: user, receita_id: receitaId, data: e.data, minutos: e.minutos, tipo: e.tipo, nota: e.nota ?? null })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return { ...e, id: String(data.id) }
}

export async function deleteOvertime(id: string): Promise<void>
{
  const { error } = await supabase.from('fin_horas_extras').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function fetchConfirmations(receitaId: number): Promise<SalaryConfirmation[]>
{
  const { data, error } = await supabase
    .from('fin_receitas_confirmacoes')
    .select('*')
    .eq('receita_id', receitaId)
    .order('competencia', { ascending: false })
    .limit(24)
  if (error) throw new Error(error.message)
  return (data || []).map((r) => ({
    competencia: String(r.competencia),
    valorPrevisto: Number(r.valor_previsto) || 0,
    brutoPrevisto: r.bruto_previsto == null ? null : Number(r.bruto_previsto),
    valorReal: r.valor_real == null ? null : Number(r.valor_real),
    despesaId: r.despesa_id == null ? null : String(r.despesa_id),
    confirmadoEm: r.confirmado_em ? String(r.confirmado_em) : null,
  }))
}

export async function upsertConfirmation(receitaId: number, c: SalaryConfirmation): Promise<void>
{
  const user = await uid()
  if (!user) throw new Error('Não autenticado')
  const { error } = await supabase.from('fin_receitas_confirmacoes').upsert({
    user_id: user,
    receita_id: receitaId,
    competencia: c.competencia,
    valor_previsto: c.valorPrevisto,
    bruto_previsto: c.brutoPrevisto,
    valor_real: c.valorReal,
    despesa_id: c.despesaId && /^\d+$/.test(c.despesaId) ? Number(c.despesaId) : null,
    confirmado_em: c.confirmadoEm,
  }, { onConflict: 'user_id,receita_id,competencia' })
  if (error) throw new Error(error.message)
}
