import type { NotifyCadence } from './axelVoice'
import type { MobileTask } from './tasks'
import { addDaysToIso, mondayOfIso, type BlocoOcorrencia } from './meuMundo'

/**
 * Avisos do ritmo escolhido, com o que a pessoa tem de verdade.
 * Hoje e amanhã levam conteúdo; os dias seguintes, frase genérica (o app pode ficar dias sem abrir).
 */

export type CadenceNotice = { key: string; at: Date; title: string; body: string; url: string }

export type CadenceInput = {
  tarefas: MobileTask[]
  /** ocorrências do Meu Mundo já expandidas, pelo menos de hoje até daqui a 8 dias */
  ocorrencias: BlocoOcorrencia[]
  /** livre de cada dia (ex.: resumoDia), opcional */
  livre?: Record<string, { inicio: number; fim: number } | null>
  /** padrão real que o AXEL achou (carta); sem isso, não há aviso de carta */
  descoberta?: string | null
}

type Item = { titulo: string; inicio: number | null }

const GENERIC: Record<number, string> = {
  9: 'Quando quiser, o dia cabe em um toque.',
  15: 'Se couber, um olhar no que ficou para hoje.',
  21: 'O essencial está organizado. Amanhã continua de onde parou.',
}
const GENERIC_WEEK = 'Sua semana está organizada no SunFy. Abra quando fizer sentido.'
const BATCH_DAYS = 5
const TITLE = 'SunFy'

function isoLocal(d: Date): string
{
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function at(dia: string, hour: number): Date
{
  const [y, m, d] = dia.split('-').map(Number)
  return new Date(y, m - 1, d, hour, 0, 0)
}

function hora(min: number): string
{
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

function coisas(n: number): string
{
  return `${n} ${n === 1 ? 'coisa' : 'coisas'}`
}

function itensDoDia(dia: string, input: CadenceInput): Item[]
{
  const out: Item[] = [
    ...input.tarefas
      .filter((t) => t.status !== 'done' && (t.dataVencimento ?? '').slice(0, 10) === dia)
      .map((t) => ({ titulo: t.titulo, inicio: t.horaMinutos })),
    ...input.ocorrencias
      .filter((o) => o.dia === dia && o.status == null)
      .map((o) => ({ titulo: o.bloco.titulo, inicio: o.inicio })),
  ]
  return out.sort((a, b) => (a.inicio ?? 24 * 60) - (b.inicio ?? 24 * 60))
}

/** 9h: "Hoje: 4 coisas. Começa com Academia às 7h." */
export function avisoManha(dia: string, input: CadenceInput): string | null
{
  const itens = itensDoDia(dia, input)
  if (!itens.length) return null
  const first = itens[0]
  return `Hoje: ${coisas(itens.length)}. ${first.inicio != null ? `Começa com ${first.titulo} às ${hora(first.inicio)}.` : `A primeira é ${first.titulo}.`}`
}

/** 15h: o que ainda está pela frente; sem nada, a descoberta da carta (se houver). */
export function avisoTarde(dia: string, input: CadenceInput): string | null
{
  const resto = itensDoDia(dia, input).filter((i) => i.inicio == null || i.inicio >= 15 * 60)
  if (resto.length)
  {
    const nomes = resto.slice(0, 2).map((i) => (i.inicio != null ? `${i.titulo} às ${hora(i.inicio)}` : i.titulo))
    const mais = resto.length > 2 ? ` e mais ${resto.length - 2}` : ''
    return `Ficaram ${resto.length} para hoje: ${nomes.join(' e ')}${mais}. Se não couber, tudo bem.`
  }
  return input.descoberta?.trim() ? `O AXEL notou uma coisa: ${input.descoberta.trim()}` : null
}

/** 21h: "Amanhã: 3 coisas, livre das 15h às 17h." */
export function avisoNoite(amanha: string, input: CadenceInput): string | null
{
  const n = itensDoDia(amanha, input).length
  if (!n) return null
  const livre = input.livre?.[amanha]
  return `Amanhã: ${coisas(n)}${livre ? `, livre das ${hora(livre.inicio)} às ${hora(livre.fim)}` : ''}. Quer dar uma olhada?`
}

/** Segunda 11h: como foi a semana anterior e o que vem nesta. */
export function avisoSemana(segunda: string, input: CadenceInput): string | null
{
  const de = addDaysToIso(segunda, -7)
  const feitas = input.tarefas.filter((t) =>
  {
    if (t.status !== 'done' || !t.concluidoEm) return false
    const d = isoLocal(new Date(t.concluidoEm))
    return d >= de && d < segunda
  }).length
  let plano = 0
  let primeiro: { dia: string; item: Item } | null = null
  for (let i = 0; i < 7; i++)
  {
    const dia = addDaysToIso(segunda, i)
    const itens = itensDoDia(dia, input)
    plano += itens.length
    const timed = itens.find((x) => x.inicio != null)
    if (!primeiro && timed) primeiro = { dia, item: timed }
  }
  const partes: string[] = []
  if (feitas) partes.push(`Semana passada: ${feitas} ${feitas === 1 ? 'tarefa concluída' : 'tarefas concluídas'}.`)
  if (plano)
  {
    const dias = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
    const dow = at(primeiro?.dia ?? segunda, 12).getDay()
    partes.push(`Esta semana: ${coisas(plano)} no plano${primeiro ? `, a primeira é ${primeiro.item.titulo} ${dow === 0 || dow === 6 ? 'no' : 'na'} ${dias[dow]} às ${hora(primeiro.item.inicio!)}` : ''}.`)
  }
  if (input.descoberta?.trim()) partes.push(`O AXEL notou: ${input.descoberta.trim()}`)
  return partes.length ? partes.join(' ') : null
}

/** Lista completa de avisos locais para o ritmo escolhido. */
export function cadencePlan(cadence: NotifyCadence, now: Date, input: CadenceInput): CadenceNotice[]
{
  const hoje = isoLocal(now)
  const soon = now.getTime() + 30000
  const out: CadenceNotice[] = []
  if (cadence === 'batch3')
  {
    for (let d = 0; d < BATCH_DAYS; d++)
    {
      const dia = addDaysToIso(hoje, d)
      const real = d <= 1
      const slots: { h: number; body: string | null; url: string }[] = [
        { h: 9, body: real ? avisoManha(dia, input) : null, url: '/' },
        { h: 15, body: real ? avisoTarde(dia, input) : null, url: '/' },
        { h: 21, body: real ? avisoNoite(addDaysToIso(dia, 1), input) : null, url: '/planejar-amanha' },
      ]
      for (const s of slots)
      {
        const when = at(dia, s.h)
        if (when.getTime() <= soon) continue
        out.push({ key: `${dia}-${s.h}`, at: when, title: TITLE, body: s.body ?? GENERIC[s.h], url: s.body ? s.url : '/' })
      }
    }
  }
  if (cadence === 'once')
  {
    let segunda = mondayOfIso(hoje)
    if (at(segunda, 11).getTime() <= soon) segunda = addDaysToIso(segunda, 7)
    for (let w = 0; w < 2; w++)
    {
      const dia = addDaysToIso(segunda, w * 7)
      const body = w === 0 ? avisoSemana(dia, input) : null
      out.push({ key: `${dia}-11`, at: at(dia, 11), title: 'Sua semana', body: body ?? GENERIC_WEEK, url: '/' })
    }
  }
  return out
}
