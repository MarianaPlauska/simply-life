import type { ContaFixa } from '../store/storeTypes'

/** Conta fixa ainda dentro do prazo (ou sem prazo definido) */
export function contaFixaDentroDoPrazo(conta: ContaFixa, ref = new Date()): boolean
{
  if (!conta.duracao_meses || conta.duracao_meses <= 0) return true
  if (!conta.data_inicio) return true

  const start = new Date(`${conta.data_inicio}T12:00:00`)
  const end = new Date(start)
  end.setMonth(end.getMonth() + conta.duracao_meses)

  return ref.getTime() <= end.getTime()
}

export function contaFixaEfetivamenteAtiva(conta: ContaFixa, ref = new Date()): boolean
{
  return conta.ativa && contaFixaDentroDoPrazo(conta, ref)
}

export function contaFixaPrazoLabel(conta: ContaFixa): string | null
{
  if (!conta.duracao_meses || conta.duracao_meses <= 0) return null

  const meses = conta.duracao_meses
  if (!conta.data_inicio)
  {
    return `${meses} ${meses === 1 ? 'mês' : 'meses'}`
  }

  const end = new Date(`${conta.data_inicio}T12:00:00`)
  end.setMonth(end.getMonth() + meses)
  const ate = end.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })

  return `${meses} ${meses === 1 ? 'mês' : 'meses'} · até ${ate}`
}
