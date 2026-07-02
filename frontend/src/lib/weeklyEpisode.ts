import type { TarefaUnificada } from '../types'
import type { UserQuest } from '../store/slices/gamificacaoSlice'
import type { ContaFixa, FinanceBillSettlement, Transaction } from '../store/storeTypes'

// Episódio semanal — narrativa editável (Finch / Waterllama share)

export type EpisodeMomentType = 'conquista' | 'susto' | 'cuidado'

export interface EpisodeMoment
{
  tipo: EpisodeMomentType
  titulo: string
  texto: string
}

export interface WeeklyEpisode
{
  periodo: string
  ofensivasSalvas: number
  tarefasConcluidas: number
  focoMinutos: number
  humorMedio: number
  questsConcluidas: number
  xpTotal: number
  nivel: number
  headline: string
  resumo: string
  capituloTitulo: string
  momentos: EpisodeMoment[]
  cliffhanger: string
  shareText: string
}

function isoDaysAgo(n: number): string
{
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function weekPeriodLabel(): string
{
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 6)
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  return `${fmt(start)} – ${fmt(end)}`
}

function media(nums: number[]): number
{
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function nextBillLabel(
  contasFixas: ContaFixa[],
  ref: Date,
): string | null
{
  const upcoming: { nome: string; when: Date }[] = []

  for (const conta of contasFixas)
  {
    if (!conta.ativa) continue
    const due = new Date(ref.getFullYear(), ref.getMonth(), conta.dia_vencimento)
    if (due < ref) due.setMonth(due.getMonth() + 1)
    if (due.getTime() - ref.getTime() <= 7 * 86400000)
    {
      upcoming.push({ nome: conta.nome, when: due })
    }
  }

  upcoming.sort((a, b) => a.when.getTime() - b.when.getTime())
  const first = upcoming[0]
  if (!first) return null

  const weekday = first.when.toLocaleDateString('pt-BR', { weekday: 'long' })
  return `boleto ${first.nome} vence ${weekday}`
}

function buildCapituloTitulo(
  ofensivas: number,
  tarefas: number,
  humor: number,
): string
{
  if (ofensivas >= 6 && tarefas >= 5) return 'Capítulo: Semana de fogo controlado'
  if (ofensivas >= 4) return 'Capítulo: A ofensiva resistiu'
  if (humor > 0 && humor < 2.8) return 'Capítulo: Sobrevivendo à tempestade'
  if (tarefas >= 8) return 'Capítulo: Máquina de entregar'
  if (humor >= 4) return 'Capítulo: Dias mais leves'
  return 'Capítulo: Entre planos e vida real'
}

function buildMomentos(input: {
  ofensivasSalvas: number
  tarefasConcluidas: number
  focoMinutos: number
  humorMedio: number
  questsConcluidas: number
}): EpisodeMoment[]
{
  const momentos: EpisodeMoment[] = []

  if (input.tarefasConcluidas > 0 || input.questsConcluidas > 0)
  {
    momentos.push({
      tipo: 'conquista',
      titulo: 'Conquista',
      texto: input.tarefasConcluidas > 0
        ? `${input.tarefasConcluidas} tarefa${input.tarefasConcluidas !== 1 ? 's' : ''} riscada${input.tarefasConcluidas !== 1 ? 's' : ''}${input.focoMinutos > 0 ? ` e ${input.focoMinutos} min de foco` : ''}.`
        : `${input.questsConcluidas} missão${input.questsConcluidas !== 1 ? 'ões' : ''} fechada${input.questsConcluidas !== 1 ? 's' : ''}.`,
    })
  }

  if (input.humorMedio > 0 && input.humorMedio < 3)
  {
    momentos.push({
      tipo: 'susto',
      titulo: 'Susto',
      texto: `Humor médio ${input.humorMedio.toFixed(1)}/5 — semana pesada por dentro.`,
    })
  }
  else if (input.ofensivasSalvas <= 2 && input.tarefasConcluidas >= 3)
  {
    momentos.push({
      tipo: 'susto',
      titulo: 'Susto',
      texto: 'Muita execução, pouca ofensiva — o fio da consistência ficou fino.',
    })
  }

  if (input.humorMedio >= 3.5 || input.ofensivasSalvas >= 4)
  {
    momentos.push({
      tipo: 'cuidado',
      titulo: 'Cuidado',
      texto: input.ofensivasSalvas >= 4
        ? `${input.ofensivasSalvas} dias de ofensiva — você se priorizou de verdade.`
        : `Humor ${input.humorMedio.toFixed(1)}/5 — corpo e mente alinhados na média.`,
    })
  }
  else if (input.focoMinutos >= 60)
  {
    momentos.push({
      tipo: 'cuidado',
      titulo: 'Cuidado',
      texto: `${input.focoMinutos} minutos de foco profundo — investimento em você.`,
    })
  }

  while (momentos.length < 3)
  {
    const filler: EpisodeMoment[] = [
      { tipo: 'cuidado', titulo: 'Cuidado', texto: 'Um registro de humor já abre o próximo capítulo.' },
      { tipo: 'conquista', titulo: 'Conquista', texto: 'Você voltou — isso já conta na série.' },
      { tipo: 'susto', titulo: 'Susto', texto: 'Semana quietinha — às vezes silêncio também é plot.' },
    ]
    momentos.push(filler[momentos.length % filler.length])
  }

  return momentos.slice(0, 3)
}

function buildCliffhanger(
  streakCount: number,
  isStreakSafeToday: boolean,
  billHint: string | null,
): string
{
  const parts: string[] = []

  if (streakCount > 0 && !isStreakSafeToday)
  {
    parts.push(`falta 1 dia para manter ofensiva de ${streakCount}`)
  }
  else if (streakCount > 0)
  {
    parts.push(`ofensiva em ${streakCount} dias — não quebre o capítulo`)
  }

  if (billHint)
  {
    parts.push(billHint)
  }

  if (parts.length === 0)
  {
    return 'Próximo capítulo: uma tarefa ou um check-in de humor já ligam a trama.'
  }

  return parts.join(' · ')
}

export function buildWeeklyEpisode(input: {
  streakSavedDays: Record<string, boolean>
  focusMinutesByDate: Record<string, number>
  tarefas: TarefaUnificada[]
  humorSemana: { humor: number }[]
  userQuests: UserQuest[]
  xpTotal: number
  nivel: number
  streakCount?: number
  isStreakSafeToday?: boolean
  contasFixas?: ContaFixa[]
  transactions?: Transaction[]
  billSettlements?: FinanceBillSettlement[]
}): WeeklyEpisode
{
  const desde = isoDaysAgo(6)
  const dias = Array.from({ length: 7 }, (_, i) => isoDaysAgo(6 - i))

  const ofensivasSalvas = dias.filter((d) => input.streakSavedDays[d]).length
  const focoMinutos = dias.reduce((s, d) => s + (input.focusMinutesByDate[d] ?? 0), 0)

  const tarefasConcluidas = input.tarefas.filter((t) =>
  {
    if (t.status !== 'concluida') return false
    const ref = (t.created_at || t.data_vencimento || '').slice(0, 10)
    return ref >= desde
  }).length

  const humorMedio = media(input.humorSemana.map((h) => h.humor))
  const questsConcluidas = input.userQuests.filter((q) => q.concluida).length

  const capituloTitulo = buildCapituloTitulo(ofensivasSalvas, tarefasConcluidas, humorMedio)
  const momentos = buildMomentos({
    ofensivasSalvas,
    tarefasConcluidas,
    focoMinutos,
    humorMedio,
    questsConcluidas,
  })

  const billHint = nextBillLabel(
    input.contasFixas ?? [],
    new Date(),
  )

  const cliffhanger = buildCliffhanger(
    input.streakCount ?? 0,
    input.isStreakSafeToday ?? false,
    billHint,
  )

  let headline = capituloTitulo.replace('Capítulo: ', '')
  if (ofensivasSalvas >= 5)
  {
    headline = 'Semana impecável na ofensiva'
  }
  else if (tarefasConcluidas >= 5)
  {
    headline = 'Muita execução — parabéns'
  }

  const partes: string[] = []
  if (ofensivasSalvas > 0)
  {
    partes.push(
      `Você salvou ${ofensivasSalvas} ofensiva${ofensivasSalvas !== 1 ? 's' : ''}`,
    )
  }
  if (tarefasConcluidas > 0)
  {
    partes.push(`concluiu ${tarefasConcluidas} tarefa${tarefasConcluidas !== 1 ? 's' : ''}`)
  }
  if (focoMinutos > 0)
  {
    partes.push(`${focoMinutos} min de foco profundo`)
  }

  const resumo = partes.length > 0
    ? `${partes.join(', ')}. Nível ${input.nivel} · ${input.xpTotal} XP acumulados.`
    : `Semana tranquila. Um registro de humor ou uma tarefa já abre o próximo episódio.`

  const shareText = [
    `📺 Meu episódio AXEL — ${weekPeriodLabel()}`,
    capituloTitulo,
    '',
    ...momentos.map((m) => `${m.tipo === 'conquista' ? '✨' : m.tipo === 'susto' ? '⚡' : '💛'} ${m.titulo}: ${m.texto}`),
    '',
    `Cliffhanger: ${cliffhanger}`,
    '',
    `#SimplyLife #AXEL`,
  ].join('\n')

  return {
    periodo: weekPeriodLabel(),
    ofensivasSalvas,
    tarefasConcluidas,
    focoMinutos,
    humorMedio,
    questsConcluidas,
    xpTotal: input.xpTotal,
    nivel: input.nivel,
    headline,
    resumo,
    capituloTitulo,
    momentos,
    cliffhanger,
    shareText,
  }
}
