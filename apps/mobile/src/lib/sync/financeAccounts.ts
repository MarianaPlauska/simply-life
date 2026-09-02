import { supabase } from '../supabase'
import type { CashAccount, ContaAPagar, ContaFixa, FinanceCard, FinanceCardGradient } from '@simply-life/shared'

export async function fetchCashAccount(): Promise<CashAccount>
{
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) return { saldoInicial: 0 }

  const { data, error } = await supabase
    .from('fin_conta_corrente')
    .select('saldo_inicial')
    .eq('user_id', uid)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return { saldoInicial: Number(data?.saldo_inicial) || 0 }
}

export async function fetchFinanceCards(): Promise<FinanceCard[]>
{
  const { data, error } = await supabase
    .from('fin_cartoes')
    .select('id, nome, limite, dia_vencimento, status, bandeira, tipo_gradiente, numero, titular')
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []).map((row) =>
  {
    const r = row as Record<string, unknown>
    const gradRaw = String(r.tipo_gradiente || 'copper')
    const gradients = new Set(['purple', 'obsidian', 'sunset', 'ocean', 'mint', 'copper'])
    const tipoGradiente: FinanceCardGradient = gradients.has(gradRaw)
      ? (gradRaw as FinanceCardGradient)
      : 'copper'
    const numero = String(r.numero || '')
    return {
      id: String(r.id),
      nome: String(r.nome || 'Cartão'),
      limite: Number(r.limite) || 0,
      diaVencimento: Number(r.dia_vencimento) || 1,
      status: r.status === 'bloqueado' ? 'bloqueado' : 'ativo',
      bandeira: r.bandeira === 'visa' ? 'visa' : 'mastercard',
      tipoGradiente,
      numeroMascarado: numero ? `•••• ${numero.slice(-4)}` : undefined,
      titular: r.titular ? String(r.titular) : undefined,
    }
  })
}

export async function fetchContasFixas(): Promise<ContaFixa[]>
{
  const { data, error } = await supabase
    .from('fin_contas_fixas')
    .select('*')
    .order('dia_vencimento', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []).map((row) =>
  {
    const r = row as Record<string, unknown>
    return {
      id: Number(r.id),
      nome: String(r.nome || 'Conta'),
      valor: Number(r.valor) || 0,
      diaVencimento: Number(r.dia_vencimento) || 1,
      categoria: String(r.categoria || 'outros'),
      ativa: r.ativa !== false,
    }
  })
}

export async function fetchContasAPagar(): Promise<ContaAPagar[]>
{
  const { data, error } = await supabase
    .from('fin_faturas_reservas')
    .select('id, titulo, valor_alocado, data_vencimento, status')
    .order('data_vencimento', { ascending: true })
    .limit(40)

  if (error)
  {
    // Tabela pode não existir em ambientes antigos
    return []
  }

  return (data || []).map((row) =>
  {
    const r = row as Record<string, unknown>
    const statusRaw = String(r.status || 'aberta')
    return {
      id: Number(r.id),
      titulo: String(r.titulo || 'Conta'),
      valor: Number(r.valor_alocado) || 0,
      vencimento: String(r.data_vencimento || '').slice(0, 10),
      status: statusRaw === 'quitada' ? 'paga' : 'aberta',
    }
  })
}
