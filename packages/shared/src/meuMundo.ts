import { freeSlots, type CalendarEvent } from './icsCalendar'

export type BlocoTipo = 'fixo' | 'flexivel'
export type BlocoRepete = 'nao' | 'diario' | 'semanal'
export type BlocoStatus = 'feito' | 'pulado'

/** Um item do Meu Mundo: compromisso, rotina ou tempo reservado. */
export type Bloco = {
  id: string
  titulo: string
  tipo: BlocoTipo
  /** YYYY-MM-DD do primeiro dia */
  dataInicio: string
  /** minutos desde 0h; null = sem hora */
  horaMinutos: number | null
  duracaoMinutos: number
  repete: BlocoRepete
  /** 0 = domingo ... 6 = sábado */
  diasSemana: number[]
  intervaloSemanas: number
  repeteAte: string | null
  /** minutos antes para avisar; null = sem aviso */
  avisoMinutos: number | null
  /** perguntar "e aí, fez?" no fim */
  avisoFim: boolean
  cor: string | null
  categoria: string | null
}

/** O que aconteceu num dia específico de um bloco (feito, pulado, mudou de hora). */
export type BlocoMarca = {
  blocoId: string
  dia: string
  status: BlocoStatus | null
  horaMinutos: number | null
}

export type BlocoOcorrencia = {
  bloco: Bloco
  dia: string
  inicio: number | null
  fim: number | null
  status: BlocoStatus | null
}

export type BlocoConflito = {
  dia: string
  titulo: string
  inicio: number
}

const DAY_MS = 86400000

function isoToUtc(iso: string): number
{
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

function utcToIso(ms: number): string
{
  return new Date(ms).toISOString().slice(0, 10)
}

export function addDaysToIso(iso: string, days: number): string
{
  return utcToIso(isoToUtc(iso) + days * DAY_MS)
}

function dowOfIso(iso: string): number
{
  return new Date(isoToUtc(iso)).getUTCDay()
}

/** Segunda-feira da semana do dia (YYYY-MM-DD). */
export function mondayOfIso(iso: string): string
{
  const dow = dowOfIso(iso)
  return addDaysToIso(iso, dow === 0 ? -6 : 1 - dow)
}

export function blocoOccursOn(b: Bloco, dia: string): boolean
{
  if (dia < b.dataInicio) return false
  if (b.repeteAte && dia > b.repeteAte) return false
  if (b.repete === 'nao') return dia === b.dataInicio
  if (b.repete === 'diario') return true
  const dias = b.diasSemana.length ? b.diasSemana : [dowOfIso(b.dataInicio)]
  if (!dias.includes(dowOfIso(dia))) return false
  const weeks = Math.round((isoToUtc(mondayOfIso(dia)) - isoToUtc(mondayOfIso(b.dataInicio))) / (7 * DAY_MS))
  return weeks % Math.max(1, b.intervaloSemanas) === 0
}

/** Ocorrências concretas entre `from` e `to` (inclusive), em ordem de dia e hora. */
export function expandBlocos(blocos: Bloco[], marcas: BlocoMarca[], from: string, to: string): BlocoOcorrencia[]
{
  const byKey = new Map(marcas.map((m) => [`${m.blocoId}|${m.dia}`, m]))
  const out: BlocoOcorrencia[] = []
  for (let dia = from; dia <= to; dia = addDaysToIso(dia, 1))
  {
    for (const bloco of blocos)
    {
      if (!blocoOccursOn(bloco, dia)) continue
      const marca = byKey.get(`${bloco.id}|${dia}`)
      const inicio = marca?.horaMinutos ?? bloco.horaMinutos
      out.push({
        bloco,
        dia,
        inicio,
        fim: inicio == null ? null : Math.min(24 * 60, inicio + bloco.duracaoMinutos),
        status: marca?.status ?? null,
      })
    }
  }
  return out.sort((a, b) => (a.dia === b.dia ? (a.inicio ?? -1) - (b.inicio ?? -1) : a.dia < b.dia ? -1 : 1))
}

function busyOthers(ocorrencias: BlocoOcorrencia[], dia: string, skipId?: string): { titulo: string; inicio: number; fim: number }[]
{
  return ocorrencias
    .filter((o) => o.dia === dia && o.bloco.id !== skipId && o.status !== 'pulado' && o.inicio != null && o.fim != null)
    .map((o) => ({ titulo: o.bloco.titulo, inicio: o.inicio!, fim: o.fim! }))
}

function busyEvents(events: CalendarEvent[], dia: string): { titulo: string; inicio: number; fim: number }[]
{
  return events
    .filter((e) => e.date === dia && e.busy && !e.allDay && e.inicio != null && e.fim != null)
    .map((e) => ({ titulo: e.titulo, inicio: e.inicio!, fim: e.fim! }))
}

/**
 * Conflitos de um bloco (novo ou editado) nos próximos `days` dias.
 * Encostar (um termina às 8h, outro começa às 8h) não conta.
 */
export function blocoConflicts(
  draft: Bloco,
  others: BlocoOcorrencia[],
  events: CalendarEvent[],
  from: string,
  days = 14,
): BlocoConflito[]
{
  if (draft.horaMinutos == null) return []
  const out: BlocoConflito[] = []
  const to = addDaysToIso(from, days - 1)
  for (const own of expandBlocos([draft], [], from, to))
  {
    const s = own.inicio!
    const e = own.fim!
    for (const o of [...busyOthers(others, own.dia, draft.id), ...busyEvents(events, own.dia)])
    {
      if (s < o.fim && o.inicio < e) out.push({ dia: own.dia, titulo: o.titulo, inicio: o.inicio })
    }
  }
  return out
}

/** Primeiro horário livre do dia, a partir de `from`, onde cabem `duracao` minutos. */
export function nextFreeSlot(
  dia: string,
  duracao: number,
  others: BlocoOcorrencia[],
  events: CalendarEvent[],
  opts: { from?: number; skipId?: string; dayStart?: number; dayEnd?: number } = {},
): number | null
{
  const busy: CalendarEvent[] = [...busyOthers(others, dia, opts.skipId), ...busyEvents(events, dia)].map((b, i) => ({
    id: `busy-${i}`,
    titulo: b.titulo,
    date: dia,
    inicio: b.inicio,
    fim: b.fim,
    allDay: false,
    busy: true,
    local: null,
  }) as CalendarEvent)
  const slot = freeSlots(busy, dia, {
    dayStart: opts.dayStart ?? 6 * 60,
    dayEnd: opts.dayEnd ?? 23 * 60,
    buffer: 0,
    from: opts.from,
  }).find((s) => s.fim - s.inicio >= duracao)
  return slot ? slot.inicio : null
}

const DIA_WORDS: [RegExp, number][] = [
  [/^(seg|segunda)(-feira)?s?$/, 1],
  [/^(ter|terca|terça)(-feira)?s?$/, 2],
  [/^(qua|quarta)(-feira)?s?$/, 3],
  [/^(qui|quinta)(-feira)?s?$/, 4],
  [/^(sex|sexta)(-feira)?s?$/, 5],
  [/^(sab|sáb|sabado|sábado)s?$/, 6],
  [/^(dom|domingo)s?$/, 0],
]

function dayWord(w: string): number | null
{
  for (const [re, d] of DIA_WORDS) if (re.test(w)) return d
  return null
}

export type BlocoFala = Pick<Bloco, 'titulo' | 'horaMinutos' | 'duracaoMinutos' | 'repete' | 'diasSemana' | 'intervaloSemanas'>

/**
 * "academia seg qua sex 7h", "inglês toda terça às 19h30 por 1h", "remédio todo dia 8h".
 * Só devolve algo quando há repetição dita; o resto continua sendo tarefa normal.
 */
export function parseBlocoFala(text: string): BlocoFala | null
{
  let s = ` ${text.toLowerCase().replace(/[,.;]/g, ' ').replace(/\s+/g, ' ')} `
  let repete: BlocoRepete | null = null
  let dias: number[] = []
  let intervalo = 1
  let hora: number | null = null
  let duracao = 60

  const take = (re: RegExp, fn: (m: RegExpMatchArray) => void) =>
  {
    const m = s.match(re)
    if (!m) return
    fn(m)
    s = s.replace(re, ' ')
  }

  take(/ (todo dia|todos os dias|diariamente|toda manhã|toda noite) /, () => { repete = 'diario' })
  take(/ (em )?dias úteis | (de )?(seg|segunda)(-feira)? a (sex|sexta)(-feira)? /, () =>
  {
    repete = 'semanal'
    dias = [1, 2, 3, 4, 5]
  })
  take(/ (no |nos |todo |todos os )?(fim|fins) de semana /, () =>
  {
    repete = 'semanal'
    dias = [6, 0]
  })
  take(/ (a cada (\d) semanas|quinzenal(mente)?) /, (m) => { intervalo = m[2] ? Number(m[2]) : 2 })
  take(/ (por|durante) (\d{1,2})h(\d{2})? /, (m) => { duracao = Number(m[2]) * 60 + Number(m[3] || 0) })
  take(/ (por |durante )?(\d{1,3}) ?min(utos)? /, (m) => { duracao = Number(m[2]) })
  take(/ (às |as |a partir das )?(\d{1,2})(?:h|:)(\d{2})? /, (m) => { hora = Number(m[2]) * 60 + Number(m[3] || 0) })

  const rest: string[] = []
  let toda = false
  let prev = ''
  for (const w of s.trim().split(' ').filter(Boolean))
  {
    const d = dayWord(w)
    if (d != null)
    {
      if (!dias.includes(d)) dias.push(d)
      // "toda terça" ou "às terças" repete; "terça" sozinha é só aquele dia
      if (/^(toda|todas|todo|todos)$/.test(prev) || /s$/.test(w)) toda = true
      prev = w
      continue
    }
    prev = w
    if (/^(toda|todas|todo|todos|e|às|as|na|nas|no|nos|de|a)$/.test(w)) continue
    rest.push(w)
  }
  if (!repete && (dias.length >= 2 || (dias.length === 1 && (toda || intervalo > 1)))) repete = 'semanal'
  if (!repete || !rest.length) return null
  const titulo = rest.join(' ')
  const h = hora as number | null
  return {
    titulo: titulo.charAt(0).toUpperCase() + titulo.slice(1),
    horaMinutos: h != null && h < 24 * 60 ? h : null,
    duracaoMinutos: Math.max(5, Math.min(600, duracao)),
    repete,
    diasSemana: repete === 'semanal' ? dias : [],
    intervaloSemanas: intervalo,
  }
}

/**
 * Encaixa os blocos flexíveis do dia nos espaços livres entre os fixos.
 * Devolve a hora nova de cada um que mudou (sem hora, batendo com outro ou já no passado).
 */
export function fitFlexiveis(
  dia: string,
  ocorrencias: BlocoOcorrencia[],
  events: CalendarEvent[],
  opts: { from?: number } = {},
): { blocoId: string; horaMinutos: number }[]
{
  const doDia = ocorrencias.filter((o) => o.dia === dia && o.status == null)
  const placed = doDia.filter((o) => o.inicio != null)
  const out: { blocoId: string; horaMinutos: number }[] = []
  for (const o of doDia.filter((x) => x.bloco.tipo === 'flexivel'))
  {
    const others = placed.filter((p) => p.bloco.id !== o.bloco.id)
    const clash = o.inicio != null && others.some((p) => o.inicio! < p.fim! && p.inicio! < o.fim!)
    const tooEarly = o.inicio != null && opts.from != null && o.inicio < opts.from
    if (o.inicio != null && !clash && !tooEarly) continue
    const at = nextFreeSlot(dia, o.bloco.duracaoMinutos, others, events, {
      from: Math.max(8 * 60, opts.from ?? 0),
      dayStart: 8 * 60,
      dayEnd: 22 * 60,
    })
    if (at == null) continue
    out.push({ blocoId: o.bloco.id, horaMinutos: at })
    const moved = { ...o, inicio: at, fim: at + o.bloco.duracaoMinutos }
    const i = placed.indexOf(o)
    if (i >= 0) placed[i] = moved
    else placed.push(moved)
  }
  return out
}

export type ResumoDia = {
  total: number
  conflitos: number
  livre: { inicio: number; fim: number } | null
}

/** Base de "Amanhã: 6 blocos, 2 conflitos, livre das 15h às 17h". */
export function resumoDia(dia: string, ocorrencias: BlocoOcorrencia[], events: CalendarEvent[]): ResumoDia
{
  const doDia = ocorrencias.filter((o) => o.dia === dia && o.status !== 'pulado')
  const busy = [...busyOthers(doDia, dia), ...busyEvents(events, dia)].sort((a, b) => a.inicio - b.inicio)
  let conflitos = 0
  for (let i = 0; i < busy.length; i++)
  {
    for (let j = i + 1; j < busy.length && busy[j].inicio < busy[i].fim; j++) conflitos++
  }
  const asEvents: CalendarEvent[] = busy.map((b, i) => ({
    id: `r-${i}`,
    titulo: b.titulo,
    date: dia,
    inicio: b.inicio,
    fim: b.fim,
    allDay: false,
    busy: true,
    local: null,
  }))
  const livre = freeSlots(asEvents, dia, { dayStart: 8 * 60, dayEnd: 21 * 60, buffer: 0 })
    .sort((a, b) => (b.fim - b.inicio) - (a.fim - a.inicio))[0] ?? null
  return { total: doDia.length + busyEvents(events, dia).length, conflitos, livre }
}
