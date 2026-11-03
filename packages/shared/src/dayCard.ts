/**
 * Carta do dia: um texto estável para a data, só com número que a pessoa já tem.
 * O mesmo dia e os mesmos fatos devolvem a mesma carta.
 */

export type DayCardKind = 'pattern' | 'record' | 'delivery' | 'memory' | 'welcome'

export type DayCard = {
  id: string
  kind: DayCardKind
  text: string
}

export type DayCardFacts = {
  today: string
  patternText?: string | null
  eloRecord?: number | null
  bestTasksDay?: number | null
  bestWaterWeek?: number | null
  daysWithoutDelivery?: number | null
  deliverySaved?: number | null
  yearAgoNote?: string | null
}

function hash(text: string): number
{
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 33 + text.charCodeAt(i)) >>> 0
  return h
}

function reais(valor: number): string
{
  return Math.round(valor).toLocaleString('pt-BR')
}

/** Escolhe uma carta do dia. Sem fato real, a frase é honesta e curta. */
export function buildDayCard(facts: DayCardFacts): DayCard
{
  const pool: DayCard[] = []
  const day = facts.today

  if (facts.patternText?.trim())
  {
    pool.push({ id: `${day}:pattern`, kind: 'pattern', text: facts.patternText.trim() })
  }
  if ((facts.eloRecord ?? 0) > 1)
  {
    pool.push({
      id: `${day}:elo`,
      kind: 'record',
      text: `Seu Elo já chegou a ${facts.eloRecord} dias. Esse número continua com você, mesmo nos dias quietos.`,
    })
  }
  if ((facts.bestTasksDay ?? 0) > 1)
  {
    pool.push({
      id: `${day}:tasks`,
      kind: 'record',
      text: `Teve um dia com ${facts.bestTasksDay} tarefas. Isso fica guardado, sem precisar repetir hoje.`,
    })
  }
  if ((facts.bestWaterWeek ?? 0) > 0)
  {
    pool.push({
      id: `${day}:water`,
      kind: 'record',
      text: `Uma semana sua chegou a ${facts.bestWaterWeek} copos de água. É só um fato, não uma meta.`,
    })
  }
  if ((facts.daysWithoutDelivery ?? 0) >= 2)
  {
    const saved = (facts.deliverySaved ?? 0) > 0
      ? ` Nesse tempo, a conta ficou uns R$ ${reais(facts.deliverySaved ?? 0)} menor.`
      : ''
    pool.push({
      id: `${day}:delivery`,
      kind: 'delivery',
      text: `Faz ${facts.daysWithoutDelivery} dias desde o último delivery.${saved}`,
    })
  }
  if (facts.yearAgoNote?.trim())
  {
    pool.push({
      id: `${day}:memory`,
      kind: 'memory',
      text: `Se quiser reler, há 1 ano você escreveu: ${facts.yearAgoNote.trim()}`,
    })
  }

  if (!pool.length)
  {
    return {
      id: `${day}:welcome`,
      kind: 'welcome',
      text: 'Ainda estou te conhecendo. Sem pressa. Se couber um registro, a carta de amanhã fica mais sua.',
    }
  }
  return pool[hash(day) % pool.length]
}

const DELIVERY = /ifood|i food|delivery|rappi|uber eats|ubereats/i

export type DeliveryTx = { date: string; title: string; amount: number }

/** Dias desde o último delivery e, se houver pedidos anteriores, uma estimativa do que deixou de sair. */
export function deliveryPause(txs: DeliveryTx[], today: string): { days: number; saved: number | null }
{
  const hits = txs
    .filter((t) => DELIVERY.test(t.title) && t.amount > 0 && t.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date))
  if (!hits.length) return { days: 0, saved: null }
  const last = hits[hits.length - 1]
  const days = Math.max(0, Math.round((Date.parse(`${today}T12:00:00`) - Date.parse(`${last.date}T12:00:00`)) / 86400000))
  if (hits.length < 2 || days < 2) return { days, saved: null }
  const avg = hits.reduce((s, t) => s + t.amount, 0) / hits.length
  const skipped = Math.max(1, Math.round(days / 7))
  return { days, saved: Math.round(avg * skipped) }
}
