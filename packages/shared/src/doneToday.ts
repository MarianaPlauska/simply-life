/**
 * Lista do que já aconteceu hoje. Espelho do dia, sem comemoração.
 */

export type DoneTodayInput = {
  today: string
  tasks: { id: string; titulo: string; status: string; concluidoEm?: string | null; dataVencimento?: string | null }[]
  txs: { id: string; titulo: string; valor: number; tipo: string; data: string }[]
  humorCount: number
  aguaCopos: number
  bodyChecked: boolean
}

export type DoneLine = { id: string; text: string }

function money(valor: number): string
{
  const abs = Math.abs(valor).toFixed(2).replace('.', ',')
  return `R$ ${abs}`
}

function sameDay(iso: string | null | undefined, today: string): boolean
{
  return (iso ?? '').slice(0, 10) === today
}

export function doneTodayLines(input: DoneTodayInput): DoneLine[]
{
  const lines: DoneLine[] = []
  for (const task of input.tasks)
  {
    if (task.status !== 'done') continue
    const when = task.concluidoEm ?? task.dataVencimento
    if (!sameDay(when, input.today)) continue
    lines.push({ id: `task:${task.id}`, text: task.titulo })
  }
  for (const tx of input.txs)
  {
    if (!sameDay(tx.data, input.today)) continue
    if (tx.tipo !== 'despesa' && tx.tipo !== 'receita') continue
    const verb = tx.tipo === 'receita' ? 'Entrou' : 'Saiu'
    lines.push({ id: `tx:${tx.id}`, text: `${verb} ${money(tx.valor)} · ${tx.titulo}` })
  }
  if (input.humorCount > 0) lines.push({ id: 'humor', text: 'Humor registrado' })
  if (input.aguaCopos > 0) lines.push({ id: 'agua', text: `Água: ${input.aguaCopos} copo${input.aguaCopos === 1 ? '' : 's'}` })
  if (input.bodyChecked) lines.push({ id: 'corpo', text: 'Checagem do corpo' })
  return lines
}
