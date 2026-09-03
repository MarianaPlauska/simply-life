// Conselho AXEL - consumir agora vs esperar (heurística local, sem IA)

import type { MoodProfile } from './moodOrchestration'

export type SpendAdviceTone = 'ok' | 'caution' | 'wait'

export interface SpendAdvice
{
  tone: SpendAdviceTone
  headline: string
  detail: string
  diasSugeridos?: number
}

export interface SpendAdviceInput
{
  saldoCorrente: number
  saldoProjetado: number
  despesasPendentes: number
  despesasAgendadas: number
  compraProposta?: number
  diasAteFimMes: number
  limiteCartaoDisponivel?: number
  moodProfile?: MoodProfile
}

export function adviseSpend(input: SpendAdviceInput): SpendAdvice
{
  const {
    saldoCorrente,
    saldoProjetado,
    despesasPendentes,
    despesasAgendadas,
    compraProposta = 0,
    diasAteFimMes,
    limiteCartaoDisponivel,
  } = input

  const compromissos = despesasPendentes + despesasAgendadas
  const folga = saldoProjetado - compromissos
  const aposCompra = folga - compraProposta
  const finalize = (advice: SpendAdvice): SpendAdvice => applyMoodToSpendAdvice(advice, input.moodProfile)

  if (compraProposta > 0 && aposCompra < 0)
  {
    const dias = Math.min(14, Math.max(3, Math.ceil(diasAteFimMes * 0.25)))
    return finalize({
      tone: 'wait',
      headline: 'Melhor esperar',
      detail: `Esta compra deixa o saldo projetado negativo em ${Math.abs(aposCompra).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. Aguarde receita ou corte gastos.`,
      diasSugeridos: dias,
    })
  }

  if (saldoCorrente < 0 || folga < 0)
  {
    return finalize({
      tone: 'wait',
      headline: 'Modo contenção',
      detail: 'Compromissos pendentes superam o saldo. Priorize contas fixas e adie consumo discricionário.',
      diasSugeridos: Math.max(5, Math.min(diasAteFimMes, 10)),
    })
  }

  if (folga < saldoCorrente * 0.15 && diasAteFimMes > 7)
  {
    return finalize({
      tone: 'caution',
      headline: 'Consumo com cautela',
      detail: `Folga de apenas ${folga.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} até o fim do mês. Compras pequenas ok; evite parcelar.`,
    })
  }

  if (limiteCartaoDisponivel != null && limiteCartaoDisponivel < compraProposta)
  {
    return finalize({
      tone: 'wait',
      headline: 'Limite do cartão',
      detail: 'A compra excede o limite disponível no cartão selecionado.',
    })
  }

  return finalize({
    tone: 'ok',
    headline: 'Pode consumir',
    detail: `Folga projetada de ${folga.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. Mantenha lançamentos em dia para previsões precisas.`,
  })
}

/** Dia pesado → conselho mais conservador */
export function applyMoodToSpendAdvice(advice: SpendAdvice, profile?: MoodProfile): SpendAdvice
{
  if (!profile || profile === 'equilibrado' || profile === 'energizado' || profile === 'sem_registro')
  {
    return advice
  }

  const heavy = profile === 'recuperacao'
  const moodNote = heavy
    ? ' Seu humor hoje pede ritmo leve - priorize necessidades.'
    : ' Humor mais baixo: evite compras por impulso.'

  if (advice.tone === 'ok')
  {
    return {
      ...advice,
      tone: 'caution',
      headline: heavy ? 'Dia pesado - cautela' : 'Consumo com cautela',
      detail: `${advice.detail}${moodNote}`,
    }
  }

  if (advice.tone === 'caution')
  {
    return {
      ...advice,
      tone: 'wait',
      headline: 'Melhor esperar',
      detail: `${advice.detail}${moodNote}`,
      diasSugeridos: (advice.diasSugeridos ?? 3) + (heavy ? 4 : 2),
    }
  }

  return {
    ...advice,
    detail: `${advice.detail}${moodNote}`,
    diasSugeridos: (advice.diasSugeridos ?? 5) + (heavy ? 2 : 1),
  }
}

export function daysUntilMonthEnd(from = new Date()): number
{
  const end = new Date(from.getFullYear(), from.getMonth() + 1, 0)
  const diff = end.getTime() - from.getTime()
  return Math.max(1, Math.ceil(diff / 86_400_000))
}
