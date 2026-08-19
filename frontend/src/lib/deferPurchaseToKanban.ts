import type { PurchaseVerdict } from './financePurchaseCheck'
import { useTaskStore } from '../store/useTaskStore'

export interface PurchaseDeferInput
{
  descricao: string
  valor: number
  verdict: Pick<PurchaseVerdict, 'headline' | 'detail' | 'diasSugeridos' | 'tone'>
}

export function purchaseDeferDueIso(dias: number, from = new Date()): string
{
  const d = new Date(from.getTime())
  d.setDate(d.getDate() + Math.max(1, Math.round(dias)))
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatPurchaseBrl(valor: number): string
{
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Copia da tarefa que o AXEL cria quando a regra é esperar / cautela */
export function buildPurchaseDeferTask(input: PurchaseDeferInput)
{
  const dias = input.verdict.diasSugeridos ?? 3
  const valor = formatPurchaseBrl(input.valor)
  const tituloBase = input.descricao.trim() || 'compra'

  return {
    titulo: `Esperar: ${tituloBase} (${valor})`,
    notas: [
      `AXEL (${input.verdict.tone}): ${input.verdict.headline}`,
      input.verdict.detail,
      `Valor: ${valor}`,
      `Revisar em ~${dias} dia${dias !== 1 ? 's' : ''}.`,
    ].join('\n'),
    data_vencimento: purchaseDeferDueIso(dias),
    dias,
  }
}

export async function deferPurchaseToKanban(
  input: PurchaseDeferInput,
): Promise<number | undefined>
{
  const copy = buildPurchaseDeferTask(input)
  return useTaskStore.getState().createTarefa(copy.titulo, copy.notas, {
    data_vencimento: copy.data_vencimento,
    origem: 'axel',
  })
}
