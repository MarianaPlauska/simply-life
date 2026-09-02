import {
  looksLikeFinanceCapture,
  parseFinanceQuickCapture,
  type ParsedFinanceCapture,
} from './financeQuickCapture'
import { extractDatesFromText } from './noteDateExtraction'
import { localDateTimeIso } from './taskDueTime'

export type DumpKind = 'compromisso' | 'tarefa' | 'intencao' | 'gasto'

export interface DumpCard
{
  id: string
  kind: DumpKind
  titulo: string
  dateIso: string | null
  hora: string | null
  dataVencimento: string | null
  gasto: ParsedFinanceCapture | null
  kept: boolean
  medo: 0 | 1 | 2
  conflict: boolean
}

const WEEKDAY: Record<string, number> = {
  domingo: 0,
  dom: 0,
  segunda: 1,
  seg: 1,
  terca: 2,
  ter: 2,
  quarta: 3,
  qua: 3,
  quinta: 4,
  qui: 4,
  sexta: 5,
  sex: 5,
  sabado: 6,
  sab: 6,
}

const INTENTION_RE =
  /\b(um dia desses|quando der|quando puder|alguma hora|sem pressa|eventualmente|um dia)\b/i

function pad2(n: number): string
{
  return String(n).padStart(2, '0')
}

function toDateIso(d: Date): string
{
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function stripAccents(s: string): string
{
  return s.normalize('NFD').replace(/\p{M}/gu, '')
}

function nextWeekday(target: number, ref: Date): Date
{
  const out = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate())
  const diff = (target - out.getDay() + 7) % 7
  out.setDate(out.getDate() + (diff === 0 ? 7 : diff))
  return out
}

function extractHora(text: string): string | null
{
  const m = text.match(
    /(?:às|as)\s*(\d{1,2})(?:[:h](\d{2}))?h?|\b(\d{1,2})h(\d{2})?\b|\b(\d{1,2}):(\d{2})\b/i,
  )
  if (!m) return null
  const h = parseInt(m[1] || m[3] || m[5], 10)
  const min = parseInt(m[2] || m[4] || m[6] || '0', 10)
  if (h > 23 || min > 59) return null
  return `${pad2(h)}:${pad2(min)}`
}

function extractRelativeDate(text: string, ref: Date): string | null
{
  const n = stripAccents(text.toLowerCase())
  if (/\bhoje\b/.test(n)) return toDateIso(ref)
  if (/\bdepois de amanha\b/.test(n))
  {
    const d = new Date(ref)
    d.setDate(d.getDate() + 2)
    return toDateIso(d)
  }
  if (/\bamanha\b/.test(n))
  {
    const d = new Date(ref)
    d.setDate(d.getDate() + 1)
    return toDateIso(d)
  }
  for (const [nome, dow] of Object.entries(WEEKDAY))
  {
    if (n.includes(nome))
    {
      return toDateIso(nextWeekday(dow, ref))
    }
  }
  return null
}

function cleanTitulo(chunk: string): string
{
  return chunk.replace(/\s+/g, ' ').trim().slice(0, 140)
}

export function splitDumpChunks(raw: string): string[]
{
  return raw
    .split(/[\n;]+/)
    .flatMap((line) =>
    {
      const parts = line.split(/\s*,\s*/)
      return parts.length > 1 ? parts : [line]
    })
    .map((c) => c.trim())
    .filter((c) => c.length > 1)
}

export function parseDumpChunk(chunk: string, ref = new Date(), index = 0): DumpCard
{
  const id = `dump-${index}-${chunk.slice(0, 12)}`
  const finance = looksLikeFinanceCapture(chunk) ? parseFinanceQuickCapture(chunk) : null
  if (finance)
  {
    return {
      id,
      kind: 'gasto',
      titulo: finance.descricao || chunk,
      dateIso: null,
      hora: null,
      dataVencimento: null,
      gasto: finance,
      kept: true,
      medo: 0,
      conflict: false,
    }
  }

  const hora = extractHora(chunk)
  const dateIso =
    extractRelativeDate(chunk, ref)
    || extractDatesFromText(chunk, ref)[0]
    || null
  const intention = INTENTION_RE.test(chunk)
  const titulo = cleanTitulo(chunk)

  if (hora || (dateIso && !intention))
  {
    const day = dateIso || toDateIso(ref)
    return {
      id,
      kind: hora ? 'compromisso' : 'tarefa',
      titulo,
      dateIso: day,
      hora,
      dataVencimento: localDateTimeIso(day, hora),
      gasto: null,
      kept: true,
      medo: 0,
      conflict: false,
    }
  }

  return {
    id,
    kind: 'intencao',
    titulo,
    dateIso: null,
    hora: null,
    dataVencimento: null,
    gasto: null,
    kept: true,
    medo: 0,
    conflict: false,
  }
}

export function parseLifeDump(raw: string, ref = new Date()): DumpCard[]
{
  return splitDumpChunks(raw).map((chunk, i) => parseDumpChunk(chunk, ref, i))
}
