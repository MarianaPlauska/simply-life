/**
 * Leitor de agenda .ics (iCalendar). Serve para o "endereço secreto no formato iCal"
 * do Google Calendar (e Outlook/Apple): grátis, sem OAuth, só leitura.
 * Suporta: VEVENT, DTSTART/DTEND (UTC, TZID, dia inteiro), DURATION,
 * RRULE (DAILY/WEEKLY/MONTHLY com INTERVAL, BYDAY, COUNT, UNTIL), EXDATE,
 * STATUS:CANCELLED e TRANSP:TRANSPARENT (evento "livre" não ocupa tempo).
 * Horários são convertidos para o fuso do aparelho.
 */
import { localTodayIso } from './dates'
import { addDaysIso } from './taskPrompt'

export type CalendarEvent = {
  id: string
  titulo: string
  /** dia local YYYY-MM-DD */
  date: string
  /** minutos desde 0h (local); null = dia inteiro */
  inicio: number | null
  fim: number | null
  allDay: boolean
  /** TRANSP:TRANSPARENT = aparece mas não ocupa tempo */
  busy: boolean
  local: string | null
  /** de qual agenda veio (ex.: "Gmail", "Teams"), quando há mais de uma */
  origem?: string
}

type RawEvent = {
  uid: string
  summary: string
  location: string | null
  start: Date
  end: Date
  allDay: boolean
  rrule: Record<string, string> | null
  exdates: Set<string>
  cancelled: boolean
  transparent: boolean
  recurrenceId: string | null
}

/** Desdobra linhas continuadas (RFC 5545: linha que começa com espaço continua a anterior). */
function unfold(text: string): string[]
{
  return text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '').split('\n').filter(Boolean)
}

function unescapeText(v: string): string
{
  return v.replace(/\\n/gi, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\').trim()
}

/** Diferença (min) entre o horário "de parede" num fuso e UTC, via Intl. */
function tzOffsetMinutes(date: Date, timeZone: string): number
{
  try
  {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(date)
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
    const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
    return Math.round((asUtc - date.getTime()) / 60000)
  }
  catch
  {
    return -date.getTimezoneOffset()
  }
}

/** "20260925T140000Z" | "20260925T140000" (+TZID) | "20260925" (dia inteiro) */
export function parseIcsDate(value: string, params: Record<string, string>): { date: Date; allDay: boolean } | null
{
  const v = value.trim()
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(v)
  if (!m) return null
  const [, y, mo, d, h, mi, s, z] = m
  if (params.VALUE === 'DATE' || h === undefined)
  {
    return { date: new Date(Number(y), Number(mo) - 1, Number(d), 0, 0, 0), allDay: true }
  }
  const utcGuess = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s || 0))
  if (z) return { date: new Date(utcGuess), allDay: false }
  if (params.TZID)
  {
    // horário de parede no fuso TZID → instante real
    const off = tzOffsetMinutes(new Date(utcGuess), params.TZID)
    return { date: new Date(utcGuess - off * 60000), allDay: false }
  }
  // "flutuante": horário local do aparelho
  return { date: new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s || 0)), allDay: false }
}

function parseDuration(v: string): number
{
  const m = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(v.trim())
  if (!m) return 0
  const [, sign, w, d, h, mi, s] = m
  const ms = ((Number(w || 0) * 7 + Number(d || 0)) * 86400 + Number(h || 0) * 3600 + Number(mi || 0) * 60 + Number(s || 0)) * 1000
  return sign === '-' ? -ms : ms
}

function parseLine(line: string): { name: string; params: Record<string, string>; value: string }
{
  const idx = line.indexOf(':')
  const head = idx >= 0 ? line.slice(0, idx) : line
  const value = idx >= 0 ? line.slice(idx + 1) : ''
  const [name, ...rawParams] = head.split(';')
  const params: Record<string, string> = {}
  for (const p of rawParams)
  {
    const [k, v] = p.split('=')
    if (k && v) params[k.toUpperCase()] = v.replace(/^"|"$/g, '')
  }
  return { name: name.toUpperCase(), params, value }
}

function dateKey(d: Date): string
{
  return d.toISOString().slice(0, 16)
}

export function parseIcs(text: string): RawEvent[]
{
  const out: RawEvent[] = []
  let cur: Partial<RawEvent> & { durationMs?: number } | null = null
  for (const line of unfold(text))
  {
    if (line === 'BEGIN:VEVENT')
    {
      cur = { exdates: new Set(), rrule: null, location: null, cancelled: false, transparent: false, recurrenceId: null }
      continue
    }
    if (line === 'END:VEVENT')
    {
      if (cur?.start && cur.uid)
      {
        const end = cur.end
          ?? new Date(cur.start.getTime() + (cur.durationMs ?? (cur.allDay ? 86400000 : 3600000)))
        out.push({
          uid: cur.uid,
          summary: cur.summary || '(sem título)',
          location: cur.location ?? null,
          start: cur.start,
          end,
          allDay: Boolean(cur.allDay),
          rrule: cur.rrule ?? null,
          exdates: cur.exdates ?? new Set(),
          cancelled: Boolean(cur.cancelled),
          transparent: Boolean(cur.transparent),
          recurrenceId: cur.recurrenceId ?? null,
        })
      }
      cur = null
      continue
    }
    if (!cur) continue
    const { name, params, value } = parseLine(line)
    switch (name)
    {
      case 'UID':
        cur.uid = value.trim()
        break
      case 'SUMMARY':
        cur.summary = unescapeText(value).slice(0, 200)
        break
      case 'LOCATION':
        cur.location = unescapeText(value).slice(0, 200) || null
        break
      case 'DTSTART': {
        const p = parseIcsDate(value, params)
        if (p)
        {
          cur.start = p.date
          cur.allDay = p.allDay
        }
        break
      }
      case 'DTEND': {
        const p = parseIcsDate(value, params)
        if (p) cur.end = p.date
        break
      }
      case 'DURATION':
        cur.durationMs = parseDuration(value)
        break
      case 'RRULE':
        cur.rrule = Object.fromEntries(value.split(';').map((kv) => kv.split('=')).filter((kv) => kv.length === 2)
          .map(([k, v]) => [k.toUpperCase(), v]))
        break
      case 'EXDATE':
        for (const v of value.split(','))
        {
          const p = parseIcsDate(v, params)
          if (p) cur.exdates!.add(dateKey(p.date))
        }
        break
      case 'STATUS':
        cur.cancelled = value.trim().toUpperCase() === 'CANCELLED'
        break
      case 'TRANSP':
        cur.transparent = value.trim().toUpperCase() === 'TRANSPARENT'
        break
      case 'RECURRENCE-ID': {
        const p = parseIcsDate(value, params)
        if (p) cur.recurrenceId = dateKey(p.date)
        break
      }
      default:
        break
    }
  }
  return out
}

const BYDAY: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }

/** Datas de início das ocorrências dentro da janela [from, to). */
function occurrences(ev: RawEvent, from: Date, to: Date): Date[]
{
  if (!ev.rrule) return ev.start < to && ev.end > from ? [ev.start] : []
  const r = ev.rrule
  const freq = r.FREQ
  const interval = Math.max(1, Number(r.INTERVAL) || 1)
  const count = r.COUNT ? Number(r.COUNT) : Infinity
  const until = r.UNTIL ? parseIcsDate(r.UNTIL, {})?.date ?? null : null
  const byDay = r.BYDAY ? r.BYDAY.split(',').map((d) => BYDAY[d.slice(-2)]).filter((n) => n != null) : null
  const out: Date[] = []
  let n = 0
  const dur = ev.end.getTime() - ev.start.getTime()
  const cursor = new Date(ev.start)
  const hardStop = new Date(to.getTime())
  for (let guard = 0; guard < 3000 && n < count; guard += 1)
  {
    if (until && cursor > until) break
    if (cursor >= hardStop) break
    const candidates: Date[] = []
    if (freq === 'WEEKLY' && byDay?.length)
    {
      // semana do cursor: cada dia listado
      const weekStart = new Date(cursor)
      weekStart.setDate(cursor.getDate() - cursor.getDay())
      for (const wd of byDay.sort())
      {
        const c = new Date(weekStart)
        c.setDate(weekStart.getDate() + wd)
        c.setHours(ev.start.getHours(), ev.start.getMinutes(), ev.start.getSeconds(), 0)
        if (c >= ev.start) candidates.push(c)
      }
    }
    else
    {
      candidates.push(new Date(cursor))
    }
    for (const c of candidates)
    {
      if (n >= count) break
      if (until && c > until) break
      n += 1
      if (ev.exdates.has(dateKey(c))) continue
      if (c.getTime() + dur > from.getTime() && c < to) out.push(c)
    }
    if (freq === 'DAILY') cursor.setDate(cursor.getDate() + interval)
    else if (freq === 'WEEKLY') cursor.setDate(cursor.getDate() + 7 * interval)
    else if (freq === 'MONTHLY') cursor.setMonth(cursor.getMonth() + interval)
    else if (freq === 'YEARLY') cursor.setFullYear(cursor.getFullYear() + interval)
    else break
  }
  return out
}

/** Eventos da agenda entre hoje e +days, já no fuso do aparelho e quebrados por dia. */
export function expandCalendar(text: string, opts: { ref?: Date; days?: number } = {}): CalendarEvent[]
{
  const ref = opts.ref ?? new Date()
  const days = opts.days ?? 14
  const fromIso = localTodayIso(ref)
  const [y, m, d] = fromIso.split('-').map(Number)
  const from = new Date(y, m - 1, d, 0, 0, 0)
  const to = new Date(y, m - 1, d + days, 0, 0, 0)
  const raw = parseIcs(text)

  // ocorrências editadas (RECURRENCE-ID) substituem a original daquele horário
  const overrides = new Map<string, RawEvent>()
  for (const ev of raw) if (ev.recurrenceId) overrides.set(`${ev.uid}|${ev.recurrenceId}`, ev)

  const out: CalendarEvent[] = []
  const push = (ev: RawEvent, start: Date) =>
  {
    const end = new Date(start.getTime() + (ev.end.getTime() - ev.start.getTime()))
    // quebra em dias locais (evento que atravessa a meia-noite aparece nos dois)
    for (let day = new Date(start.getFullYear(), start.getMonth(), start.getDate()); day < end; day.setDate(day.getDate() + 1))
    {
      const iso = localTodayIso(day)
      if (iso < fromIso || iso >= addDaysIso(fromIso, days)) continue
      const dayStart = day.getTime()
      const s = Math.max(start.getTime(), dayStart)
      const e = Math.min(end.getTime(), dayStart + 86400000)
      out.push({
        id: `${ev.uid}|${dateKey(start)}|${iso}`,
        titulo: ev.summary,
        date: iso,
        inicio: ev.allDay ? null : Math.round((s - dayStart) / 60000),
        fim: ev.allDay ? null : Math.round((e - dayStart) / 60000),
        allDay: ev.allDay,
        busy: !ev.transparent && !ev.allDay,
        local: ev.location,
      })
      if (ev.allDay && end.getTime() - start.getTime() <= 86400000) break
    }
  }

  for (const ev of raw)
  {
    if (ev.recurrenceId)
    {
      if (!ev.cancelled && ev.start < to && ev.end > from) push(ev, ev.start)
      continue
    }
    if (ev.cancelled) continue
    for (const start of occurrences(ev, from, to))
    {
      if (overrides.has(`${ev.uid}|${dateKey(start)}`)) continue
      push(ev, start)
    }
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.inicio ?? -1) - (b.inicio ?? -1)))
}

/** Minutos ocupados por dia (só eventos "ocupado", sobreposições contadas uma vez). */
export function busyMinutesByDay(events: CalendarEvent[]): Record<string, number>
{
  const byDay = new Map<string, [number, number][]>()
  for (const e of events)
  {
    if (!e.busy || e.inicio == null || e.fim == null) continue
    const list = byDay.get(e.date) ?? []
    list.push([e.inicio, e.fim])
    byDay.set(e.date, list)
  }
  const out: Record<string, number> = {}
  for (const [day, ranges] of byDay)
  {
    ranges.sort((a, b) => a[0] - b[0])
    let total = 0
    let [cs, ce] = ranges[0]
    for (const [s, e] of ranges.slice(1))
    {
      if (s <= ce) ce = Math.max(ce, e)
      else
      {
        total += ce - cs
        cs = s
        ce = e
      }
    }
    total += ce - cs
    out[day] = total
  }
  return out
}

export type FreeSlot = { inicio: number; fim: number }

/** Janelas livres de um dia dentro do horário ativo (padrão 8h–21h), com margem entre compromissos. */
export function freeSlots(
  events: CalendarEvent[],
  date: string,
  opts: { dayStart?: number; dayEnd?: number; buffer?: number; from?: number } = {},
): FreeSlot[]
{
  const dayStart = Math.max(opts.dayStart ?? 8 * 60, opts.from ?? 0)
  const dayEnd = opts.dayEnd ?? 21 * 60
  const buffer = opts.buffer ?? 10
  const busy = events
    .filter((e) => e.date === date && e.busy && e.inicio != null && e.fim != null)
    .map((e) => [Math.max(0, e.inicio! - buffer), Math.min(24 * 60, e.fim! + buffer)] as [number, number])
    .sort((a, b) => a[0] - b[0])
  const out: FreeSlot[] = []
  let cursor = dayStart
  for (const [s, e] of busy)
  {
    if (s > cursor) out.push({ inicio: cursor, fim: Math.min(s, dayEnd) })
    cursor = Math.max(cursor, e)
    if (cursor >= dayEnd) break
  }
  if (cursor < dayEnd) out.push({ inicio: cursor, fim: dayEnd })
  return out.filter((sl) => sl.fim - sl.inicio >= 15)
}

export type GoogleApiEvent = {
  id: string
  summary: string
  location: string | null
  start: { dateTime?: string; date?: string } | null
  end: { dateTime?: string; date?: string } | null
  transparency?: string
}

/** Eventos da API Google Calendar (já expandidos) → mesmo formato do .ics, no fuso do aparelho. */
export function googleItemsToEvents(items: GoogleApiEvent[], opts: { ref?: Date; days?: number } = {}): CalendarEvent[]
{
  const ref = opts.ref ?? new Date()
  const days = opts.days ?? 14
  const fromIso = localTodayIso(ref)
  const toIso = addDaysIso(fromIso, days)
  const out: CalendarEvent[] = []
  for (const it of items)
  {
    if (!it.start) continue
    if (it.start.date)
    {
      // dia inteiro: date é local "YYYY-MM-DD", end.date é exclusivo
      let d = it.start.date
      const end = it.end?.date ?? addDaysIso(d, 1)
      while (d < end)
      {
        if (d >= fromIso && d < toIso)
        {
          out.push({ id: `${it.id}|${d}`, titulo: it.summary, date: d, inicio: null, fim: null, allDay: true, busy: false, local: it.location })
        }
        d = addDaysIso(d, 1)
      }
      continue
    }
    if (!it.start.dateTime || !it.end?.dateTime) continue
    const start = new Date(it.start.dateTime)
    const endAt = new Date(it.end.dateTime)
    for (let day = new Date(start.getFullYear(), start.getMonth(), start.getDate()); day < endAt; day.setDate(day.getDate() + 1))
    {
      const iso = localTodayIso(day)
      if (iso < fromIso || iso >= toIso) continue
      const dayStart = day.getTime()
      const s = Math.max(start.getTime(), dayStart)
      const e = Math.min(endAt.getTime(), dayStart + 86400000)
      out.push({
        id: `${it.id}|${iso}`,
        titulo: it.summary,
        date: iso,
        inicio: Math.round((s - dayStart) / 60000),
        fim: Math.round((e - dayStart) / 60000),
        allDay: false,
        busy: it.transparency !== 'transparent',
        local: it.location,
      })
    }
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.inicio ?? -1) - (b.inicio ?? -1)))
}
