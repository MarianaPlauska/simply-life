/**
 * Prompt solto → rascunhos de tarefa estruturados.
 * Parser local (offline, convidado) + normalização do retorno da IA.
 * A IA só interpreta texto; quem decide dia/ordem é taskOrchestrator.ts.
 */
import type { FinanceCategory } from './finance'
import type { ContaFixa, FinanceCard } from './financeAccounts'
import type { MobileTask } from './tasks'
import { localTodayIso } from './dates'

export type TaskEnergy = 'baixa' | 'media' | 'alta'
export type TaskRecurrence = 'diaria' | 'semanal' | 'mensal'

export type TaskPromptFinance = {
  valor: number | null
  categoria: FinanceCategory
  tipo: 'despesa' | 'receita'
  fixaId: number | null
  cardId: string | null
}

export type TaskPromptDraft = {
  key: string
  titulo: string
  descricao: string
  dataVencimento: string | null
  prazoRigido: boolean
  horaMinutos: number | null
  estimativaMinutos: number
  prioridade: 1 | 2 | 3
  energia: TaskEnergy
  listId: string | null
  checklist: string[]
  financeiro: TaskPromptFinance | null
  recorrencia: TaskRecurrence | null
  duplicateOfId: string | null
  /** 0-1: quanto o parser confia na leitura */
  confianca: number
  /** Trecho original do prompt que gerou este rascunho */
  trecho: string
}

export type TaskPromptSource = 'local' | 'groq' | 'gemini'

export type TaskPromptParse = {
  drafts: TaskPromptDraft[]
  perguntas: string[]
  source: TaskPromptSource
}

export type TaskPromptContext = {
  ref?: Date
  lists?: { id: string; name: string }[]
  fixas?: ContaFixa[]
  cards?: FinanceCard[]
  openTasks?: MobileTask[]
}

/** Payload enviado ao servidor (IA) - só o necessário, sem dados sensíveis. */
export type TaskPromptAiRequest = {
  prompt: string
  today: string
  weekday: string
  lists: { id: string; name: string }[]
  categorias: string[]
  fixas: { id: number; nome: string; valor: number; diaVencimento: number; categoria: string }[]
  cards: { id: string; nome: string; diaVencimento: number }[]
}

export type TaskPromptAiTask = {
  titulo?: unknown
  descricao?: unknown
  prazo?: unknown
  prazo_rigido?: unknown
  hora?: unknown
  esforco_min?: unknown
  prioridade?: unknown
  energia?: unknown
  lista_id?: unknown
  subtarefas?: unknown
  financeiro?: unknown
  recorrencia?: unknown
  confianca?: unknown
  trecho?: unknown
}

export type TaskPromptAiResponse = {
  tasks: TaskPromptAiTask[]
  perguntas: string[]
  source: TaskPromptSource
  iaDisponivel: boolean
}

export const TASK_PROMPT_CATEGORIES: FinanceCategory[] = [
  'habitacao',
  'alimentacao',
  'transporte',
  'lazer',
  'saude',
  'educacao',
  'compras',
  'outros',
]

const WEEKDAYS_PT = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']

const MIN_EST = 2
const MAX_EST = 480

// ---------------------------------------------------------------------------
// Utilidades de texto e data
// ---------------------------------------------------------------------------

/** minúsculas sem acento - só para casar padrões */
export function foldText(text: string): string
{
  return (text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function isoFromDate(d: Date): string
{
  return localTodayIso(d)
}

function dateFromIso(iso: string): Date
{
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0)
}

export function addDaysIso(iso: string, days: number): string
{
  const d = dateFromIso(iso)
  d.setDate(d.getDate() + days)
  return isoFromDate(d)
}

export function diffDaysIso(from: string, to: string): number
{
  return Math.round((dateFromIso(to).getTime() - dateFromIso(from).getTime()) / 86400000)
}

export function weekdayOfIso(iso: string): number
{
  return dateFromIso(iso).getDay()
}

function nextWeekday(todayIso: string, weekday: number, strictlyAfter: boolean): string
{
  const cur = weekdayOfIso(todayIso)
  let delta = (weekday - cur + 7) % 7
  if (delta === 0 && strictlyAfter) delta = 7
  return addDaysIso(todayIso, delta)
}

/** Próxima data (>= hoje) com o dia do mês informado. */
export function nextMonthDayIso(todayIso: string, day: number): string
{
  const t = dateFromIso(todayIso)
  const clamp = (y: number, m: number) =>
  {
    const last = new Date(y, m + 1, 0).getDate()
    return new Date(y, m, Math.min(day, last), 12)
  }
  let d = clamp(t.getFullYear(), t.getMonth())
  if (isoFromDate(d) < todayIso) d = clamp(t.getFullYear(), t.getMonth() + 1)
  return isoFromDate(d)
}

function capitalize(text: string): string
{
  const t = text.trim()
  return t ? t[0].toUpperCase() + t.slice(1) : t
}

/** "1.800,50" → 1800.5 · "2 mil" → 2000 */
export function parseBrlNumber(raw: string, milSuffix = false): number | null
{
  let s = raw.trim()
  if (!s) return null
  if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.')
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '')
  else s = s.replace(',', '.')
  const n = Number(s)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round((milSuffix ? n * 1000 : n) * 100) / 100
}

function tokens(text: string): string[]
{
  return foldText(text)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
}

const STOPWORDS = new Set([
  'que', 'para', 'pra', 'pro', 'com', 'uma', 'uns', 'umas', 'dos', 'das', 'nos', 'nas',
  'por', 'mais', 'meu', 'minha', 'sua', 'seu', 'isso', 'esse', 'essa', 'ate', 'tem',
  'preciso', 'fazer', 'hoje', 'amanha',
])

/** Similaridade de Jaccard entre títulos (0-1). */
export function titleSimilarity(a: string, b: string): number
{
  const ta = new Set(tokens(a))
  const tb = new Set(tokens(b))
  if (ta.size === 0 || tb.size === 0) return 0
  let inter = 0
  for (const w of ta) if (tb.has(w)) inter += 1
  return inter / (ta.size + tb.size - inter)
}

// ---------------------------------------------------------------------------
// Dicionários
// ---------------------------------------------------------------------------

const FILLER_PREFIX =
  /^(?:(?:eu\s+)?(?:preciso|precisa|tenho que|tenho de|tenho|devo|quero|vou|lembrar de|me lembra de|nao esquecer de|nao posso esquecer de|lembrete:?|tarefa:?|tambem|e|depois)\s+)+/

const VERB = '[a-z]{2,}(?:ar|er|ir)(?:-(?:me|se|lhe|lo|la))?'

const CATEGORY_KEYWORDS: [FinanceCategory, RegExp][] = [
  ['transporte', /\b(carro|moto|uber|99|taxi|gasolina|combustivel|etanol|seguro do carro|seguro auto|ipva|licenciamento|oficina|mecanico|pneu|revisao do carro|onibus|metro|estacionamento|pedagio|multa)\b/],
  ['habitacao', /\b(aluguel|condominio|luz|energia|conta de agua|agua|gas|internet|iptu|reforma|pintor|encanador|eletricista|faxina|diarista|moveis?)\b/],
  ['alimentacao', /\b(mercado|supermercado|feira|restaurante|ifood|almoco|jantar|padaria|acougue|lanche|delivery)\b/],
  ['saude', /\b(dentista|medico|medica|consulta|exame|farmacia|remedio|terapia|psicolog[oa]|psiquiatra|plano de saude|fisioterapia|nutricionista|vacina)\b/],
  ['educacao', /\b(curso|faculdade|escola|livro|mensalidade|matricula|tcc|aula|prova|apostila|certificacao)\b/],
  ['lazer', /\b(cinema|viagem|passagem|hotel|show|ingresso|bar|passeio|netflix|spotify|streaming|jogo|festa)\b/],
  ['compras', /\b(comprar|presente|roupa|sapato|loja|amazon|shopee|mercado livre|celular|notebook)\b/],
]

const FINANCE_VERBS = /\b(pagar|comprar|renovar|assinar|contratar|transferir|depositar|boleto|fatura|quitar|parcela|orcamento|cotar|receber|cobrar|reembolso)\b/
const INCOME_VERBS = /\b(receber|cobrar|reembolso|me pagar|me devolver|vender)\b/

const ENERGY_HIGH = /\b(estudar|escrever|programar|codar|planejar|relatorio|projeto|prova|apresentacao|tcc|artigo|analisar|revisar contrato|mudanca|organizar|declaracao|imposto|treinar|academia|faxina)\b/
const ENERGY_LOW = /\b(ligar|mandar|enviar|pagar|responder|agendar|marcar|confirmar|avisar|lembrar|comprar online|renovar|imprimir|assinar|baixar|cancelar)\b/

/** Ordem importa: o mais específico primeiro ("reunião do TCC" é reunião, não o TCC inteiro). */
const EFFORT_BY_VERB: [RegExp, number][] = [
  [/\b(reuniao|consulta|encontro|call|entrevista)\b/, 60],
  [/\b(relatorio|projeto|tcc|apresentacao|artigo|mudanca|declaracao|imposto|faxina)\b/, 120],
  [/\b(ligar|mandar|enviar|pagar|responder|agendar|marcar|confirmar|avisar|renovar|cancelar|assinar|imprimir)\b/, 15],
  [/\b(estudar|escrever|preparar|organizar|limpar|arrumar|cozinhar|treinar|academia|revisar)\b/, 60],
  [/\b(comprar|buscar|levar|passar n[oa]|ir a[oa]?|ir n[oa])\b/, 40],
]

// ---------------------------------------------------------------------------
// Extratores (cada um devolve o valor e remove o trecho do texto de trabalho)
// ---------------------------------------------------------------------------

type Work = { raw: string; fold: string }

/** Remove um trecho casado em `fold` também de `raw` (mesmo comprimento: fold só troca acentos). */
function cut(w: Work, re: RegExp): RegExpExecArray | null
{
  const m = re.exec(w.fold)
  if (!m) return null
  const start = m.index
  const end = start + m[0].length
  w.raw = `${w.raw.slice(0, start)} ${w.raw.slice(end)}`
  w.fold = `${w.fold.slice(0, start)} ${w.fold.slice(end)}`
  return m
}

/** "até"/"antes de" só vira prazo firme quando vem seguido de data ("até sexta", não "até o mercado"). */
const UNTIL_RE = /\b(?:ate|antes d[eoa])\s+(?:o\s+|a\s+)?(?=(?:(?:hoje|amanha|depois de amanha|segunda|terca|quarta|quinta|sexta|sabado|domingo|fim|final|semana que vem|proxim[oa]|mes que vem|daqui)\b|dia\s+\d|\d{1,2}\/|em\s+\d))/

type DateHit = { iso: string | null; rigid: boolean; vague: boolean }

function extractDate(w: Work, today: string): DateHit
{
  let rigid = false
  let vague = false
  if (cut(w, /\b(sem falta|impreterivelmente|prazo final|no maximo)\b/)) rigid = true
  if (cut(w, UNTIL_RE)) rigid = true
  if (cut(w, /\b(quando der|quando puder|sem pressa|algum dia|um dia desses|qualquer hora|talvez)\b/)) vague = true

  let m: RegExpExecArray | null
  if (cut(w, /\bdepois de amanha\b/)) return { iso: addDaysIso(today, 2), rigid, vague }
  if (cut(w, /\bamanha\b/)) return { iso: addDaysIso(today, 1), rigid, vague }
  if (cut(w, /\b(hoje|agora)\b/)) return { iso: today, rigid, vague }

  if ((m = cut(w, /\b(?:em|daqui a)\s+(\d{1,2})\s+(dias?|semanas?)\b/)))
  {
    const n = Number(m[1]) * (m[2].startsWith('semana') ? 7 : 1)
    return { iso: addDaysIso(today, n), rigid, vague }
  }

  if ((m = cut(w, /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/)))
  {
    const t = dateFromIso(today)
    let y = m[3] ? Number(m[3].length === 2 ? `20${m[3]}` : m[3]) : t.getFullYear()
    const mo = Number(m[2]) - 1
    const d = Number(m[1])
    if (mo >= 0 && mo < 12 && d >= 1 && d <= 31)
    {
      let iso = isoFromDate(new Date(y, mo, d, 12))
      if (!m[3] && iso < today)
      {
        y += 1
        iso = isoFromDate(new Date(y, mo, d, 12))
      }
      return { iso, rigid, vague }
    }
  }

  if ((m = cut(w, /\bdia\s+(\d{1,2})\b/)))
  {
    const d = Number(m[1])
    if (d >= 1 && d <= 31) return { iso: nextMonthDayIso(today, d), rigid, vague }
  }

  if (cut(w, /\b(?:n[oa]\s+)?(?:fim|final) de semana\b/))
  {
    return { iso: nextWeekday(today, 6, false), rigid, vague }
  }
  if (cut(w, /\b(?:n[oa]\s+)?(?:fim|final) do mes\b/))
  {
    const t = dateFromIso(today)
    return { iso: isoFromDate(new Date(t.getFullYear(), t.getMonth() + 1, 0, 12)), rigid, vague }
  }
  if (cut(w, /\b(?:n[oa]\s+)?(?:semana que vem|proxima semana)\b/))
  {
    return { iso: nextWeekday(today, 1, true), rigid, vague }
  }
  if (cut(w, /\b(?:n[oa]\s+)?(?:mes que vem|proximo mes)\b/))
  {
    const t = dateFromIso(today)
    return { iso: isoFromDate(new Date(t.getFullYear(), t.getMonth() + 1, 1, 12)), rigid, vague }
  }

  const wd = cut(
    w,
    /\b(?:(?:n[oa]|nest[ea]|essa|esta|proxim[oa]|na proxima)\s+)?(domingo|segunda|terca|quarta|quinta|sexta|sabado)(?:-feira| feira)?(\s+que vem)?\b/,
  )
  if (wd)
  {
    const idx = WEEKDAYS_PT.indexOf(wd[1])
    const strictly = /proxim/.test(wd[0]) || Boolean(wd[2])
    return { iso: nextWeekday(today, idx, strictly), rigid, vague }
  }

  return { iso: null, rigid, vague }
}

function extractHour(w: Work): number | null
{
  let m: RegExpExecArray | null
  if ((m = cut(w, /\b(?:as|a partir das|la pelas|pelas)\s+(\d{1,2})(?:(?:h|:)(\d{2})?)?\s*(?:h(?:oras?)?)?\b/)))
  {
    const h = Number(m[1])
    const min = m[2] ? Number(m[2]) : 0
    if (h <= 23 && min <= 59) return h * 60 + min
  }
  if ((m = cut(w, /\b(\d{1,2})(?:h(\d{2})|:(\d{2}))\b/)))
  {
    const h = Number(m[1])
    const min = Number(m[2] || m[3] || 0)
    if (h <= 23 && min <= 59) return h * 60 + min
  }
  // "14h" solto (>= 7h) é horário; "2h" / "leva 3h" é esforço
  const bare = /\b(\d{1,2})h\b/.exec(w.fold)
  if (bare && Number(bare[1]) >= 7 && Number(bare[1]) <= 23)
  {
    const before = w.fold.slice(Math.max(0, bare.index - 12), bare.index)
    if (!/(leva|levar|demora|demorar|uns|umas|por|cerca de)\s*$/.test(before))
    {
      cut(w, /\b(\d{1,2})h\b/)
      return Number(bare[1]) * 60
    }
  }
  if (cut(w, /\b(?:de|pela|n[ao])\s+manha\b/)) return 9 * 60
  if (cut(w, /\b(?:a|de|pela|na)\s+tarde\b/)) return 14 * 60
  if (cut(w, /\b(?:a|de|pela|na)\s+noite\b/)) return 19 * 60
  if (cut(w, /\b(?:no\s+)?almoco\b(?=\s*$)/)) return 12 * 60
  return null
}

function extractEffort(w: Work): number | null
{
  let m: RegExpExecArray | null
  if ((m = cut(w, /\b(?:leva(?:r)?|demora(?:r)?|uns|umas|cerca de|por)?\s*(\d+(?:[.,]\d+)?)\s*(min(?:utos?)?|h(?:oras?)?)\b/)))
  {
    const n = Number(m[1].replace(',', '.'))
    if (Number.isFinite(n) && n > 0)
    {
      return Math.round(m[2].startsWith('h') ? n * 60 : n)
    }
  }
  if ((m = cut(w, /\b(meia hora|uma hora|duas horas|tres horas)\b/)))
  {
    return { 'meia hora': 30, 'uma hora': 60, 'duas horas': 120, 'tres horas': 180 }[m[1]] ?? null
  }
  if (cut(w, /\b(rapidinho|rapido|coisa rapida|dois minutos|2 minutinhos)\b/)) return 5
  return null
}

function extractMoney(w: Work): number | null
{
  let m: RegExpExecArray | null
  if ((m = cut(w, /(?:\b(?:custa|custo|custando|valor|preco|sai por|fica em)\s+)?(?:uns\s+|umas\s+|cerca de\s+|mais ou menos\s+)?r\$\s*(\d[\d.]*(?:,\d{1,2})?)(\s*mil)?/)))
  {
    return parseBrlNumber(m[1], Boolean(m[2]))
  }
  if ((m = cut(w, /\b(?:custa|custo|custando|valor|preco|sai por|fica em|de)?\s*(?:uns\s+|cerca de\s+)?(\d[\d.]*(?:,\d{1,2})?)(\s*mil)?\s*(?:reais|conto|contos|pila)\b/)))
  {
    return parseBrlNumber(m[1], Boolean(m[2]))
  }
  if ((m = cut(w, /\b(?:custa|custo|custando|valor|preco|sai por|fica em|gastar)\s+(?:uns\s+|umas\s+|cerca de\s+|mais ou menos\s+)?(\d[\d.]*(?:,\d{1,2})?)(\s*mil)?\b/)))
  {
    return parseBrlNumber(m[1], Boolean(m[2]))
  }
  // número no formato brasileiro de dinheiro: "1.500,00", "89,90"
  if ((m = cut(w, /(?:\b(?:de|por|em)\s+)?\b(\d{1,3}(?:\.\d{3})+(?:,\d{2})?|\d+,\d{2})\b/)))
  {
    return parseBrlNumber(m[1])
  }
  // número solto em frase financeira: "pagar aluguel 1500" (não "dia 30" / "às 14")
  if (FINANCE_VERBS.test(w.fold))
  {
    const re = /(?:^|\s)(\d{2,7})(\s*mil)?(?=\s|$)/g
    let hit: RegExpExecArray | null
    while ((hit = re.exec(w.fold)))
    {
      const before = w.fold.slice(Math.max(0, hit.index - 10), hit.index + (hit[0].length - hit[0].trimStart().length))
      if (/(dia|as|em|daqui a|ate|umas|uns)\s*$/.test(before)) continue
      const exact = new RegExp(`(?:^|\\s)${hit[1]}${hit[2] ? '\\s*mil' : ''}(?=\\s|$)`)
      cut(w, exact)
      return parseBrlNumber(hit[1], Boolean(hit[2]))
    }
  }
  return null
}

function extractPriority(w: Work): 1 | 3 | null
{
  if (cut(w, /\b(urgente|urgencia|prioridade|importante|critico|critica|asap|correndo)\b/)) return 1
  return null
}

function extractRecurrence(fold: string): TaskRecurrence | null
{
  if (/\b(todo dia|todos os dias|diariamente)\b/.test(fold)) return 'diaria'
  if (/\b(toda semana|semanalmente|tod[ao]s? [ao]s? (segundas?|tercas?|quartas?|quintas?|sextas?|sabados?|domingos?)|toda (segunda|terca|quarta|quinta|sexta)|todo (sabado|domingo))\b/.test(fold)) return 'semanal'
  if (/\b(todo mes|todos os meses|mensalmente|mensal)\b/.test(fold)) return 'mensal'
  return null
}

function detectCategory(fold: string): FinanceCategory | null
{
  for (const [cat, re] of CATEGORY_KEYWORDS)
  {
    if (re.test(fold)) return cat
  }
  return null
}

function findByName<T extends { id: string | number }>(
  fold: string,
  items: T[],
  nameOf: (item: T) => string,
): T | null
{
  let best: T | null = null
  let bestLen = 0
  for (const item of items)
  {
    const name = foldText(nameOf(item)).trim()
    if (name.length < 3) continue
    const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`)
    if (re.test(fold) && name.length > bestLen)
    {
      best = item
      bestLen = name.length
    }
  }
  return best
}

/** Apaga "preciso / tenho que / lembrar de..." do começo, mantendo o alinhamento raw/fold. */
function blankFiller(w: Work): void
{
  const lead = /^[\s,.;:–-]*/.exec(w.fold)?.[0].length ?? 0
  const m = FILLER_PREFIX.exec(w.fold.slice(lead))
  if (!m || !m[0].length) return
  const end = lead + m[0].length
  w.raw = ' '.repeat(end) + w.raw.slice(end)
  w.fold = ' '.repeat(end) + w.fold.slice(end)
}

const TRAILING_WORD = /\s+(?:e|de|do|da|o|a|no|na|pra|pro|para|que|uns|umas|com|ate)\s*$/i

function cleanupTitle(raw: string): string
{
  let t = raw
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/^[\s,.;:–-]+|[\s,.;:–-]+$/g, '')
  for (let i = 0; i < 3; i += 1)
  {
    const next = t.replace(TRAILING_WORD, '').replace(/[\s,.;:–-]+$/g, '')
    if (next === t) break
    t = next
  }
  return capitalize(t.trim())
}

// ---------------------------------------------------------------------------
// Divisão do prompt em itens
// ---------------------------------------------------------------------------

/** Quebra o prompt em itens: linhas, ";", bullets e " e <verbo>". */
export function splitTaskPrompt(prompt: string): string[]
{
  const lines = (prompt || '')
    .split(/\n+|;|•|(?:^|\s)-\s+(?=\S)/)
    .map((l) => l.trim())
    .filter(Boolean)

  const out: string[] = []
  for (const line of lines)
  {
    // subtarefas explícitas "mudança: embalar, frete" ficam juntas
    if (/^[^:]{3,60}:\s*\S/.test(line) && !/\b\d{1,2}:\d{2}\b/.test(line))
    {
      out.push(line)
      continue
    }
    const fold = foldText(line)
    const cuts: number[] = []
    const re = new RegExp(`(?:,\\s*(?:e\\s+)?|\\s+e\\s+(?:tambem\\s+)?|\\s+(?:depois|tambem)\\s+)(?=(?:preciso\\s+|tenho que\\s+)?${VERB}\\b)`, 'g')
    let m: RegExpExecArray | null
    while ((m = re.exec(fold)))
    {
      cuts.push(m.index, m.index + m[0].length)
    }
    if (cuts.length === 0)
    {
      out.push(line)
      continue
    }
    let start = 0
    for (let i = 0; i < cuts.length; i += 2)
    {
      out.push(line.slice(start, cuts[i]))
      start = cuts[i + 1]
    }
    out.push(line.slice(start))
  }
  return out.map((s) => s.trim()).filter((s) => s.length >= 2)
}

// ---------------------------------------------------------------------------
// Parser local
// ---------------------------------------------------------------------------

let keySeq = 0
function draftKey(): string
{
  keySeq += 1
  return `tp-${Date.now().toString(36)}-${keySeq}`
}

function defaultEffort(fold: string): number
{
  for (const [re, mins] of EFFORT_BY_VERB)
  {
    if (re.test(fold)) return mins
  }
  return 30
}

function detectEnergy(fold: string, est: number): TaskEnergy
{
  if (ENERGY_HIGH.test(fold) || est >= 90) return 'alta'
  if (ENERGY_LOW.test(fold) || est <= 15) return 'baixa'
  return 'media'
}

function parseOne(fragment: string, ctx: TaskPromptContext, today: string): TaskPromptDraft | null
{
  let body = fragment
  let checklist: string[] = []
  let tailDate: DateHit | null = null
  let tailMoney: number | null = null
  const colon = /^([^:]{3,60}):\s*(.+)$/.exec(fragment)
  if (colon && !/\b\d{1,2}:\d{2}\b/.test(fragment))
  {
    body = colon[1]
    // datas/valores escritos no meio das subtarefas valem para a tarefa-mãe
    checklist = colon[2]
      .split(/,|\s+e\s+/)
      .map((s) =>
      {
        const nfcItem = s.normalize('NFC')
        const iw: Work = { raw: nfcItem, fold: foldText(nfcItem) }
        const money = extractMoney(iw)
        if (money != null && tailMoney == null) tailMoney = money
        const d = extractDate(iw, today)
        if ((d.iso || d.rigid) && !tailDate) tailDate = d
        return cleanupTitle(iw.raw)
      })
      .filter((s) => s.length >= 2)
      .slice(0, 12)
  }

  const nfc = body.normalize('NFC')
  const w: Work = { raw: nfc, fold: foldText(nfc) }
  const fullFold = foldText(fragment)
  blankFiller(w)

  const recorrencia = extractRecurrence(fullFold)
  if (recorrencia)
  {
    cut(w, /\b(todo dia|todos os dias|diariamente|toda semana|semanalmente|todo mes|todos os meses|mensalmente)\b/)
  }
  const prioHit = extractPriority(w)
  const money = extractMoney(w) ?? tailMoney
  const hour = extractHour(w)
  const effort = extractEffort(w)
  const headDate = extractDate(w, today)
  const tail = tailDate as DateHit | null
  const date: DateHit = headDate.iso || !tail
    ? headDate
    : { iso: tail.iso, rigid: headDate.rigid || tail.rigid, vague: headDate.vague }

  blankFiller(w)
  let titulo = cleanupTitle(w.raw)
  if (titulo.length < 2) titulo = cleanupTitle(fragment)
  if (titulo.length < 2) return null
  titulo = titulo.slice(0, 200)

  // Vínculos financeiros: conta fixa / cartão pelo nome
  const fixa = findByName(fullFold, (ctx.fixas ?? []).filter((f) => f.ativa), (f) => f.nome)
  const faturaCard = /\bfatura\b/.test(fullFold)
    ? findByName(fullFold, ctx.cards ?? [], (c) => c.nome)
    : null
  const category = detectCategory(fullFold)
  const isFinance = money != null || fixa != null || faturaCard != null || FINANCE_VERBS.test(fullFold)

  let dataVencimento = date.iso
  let prazoRigido = date.rigid
  if (!dataVencimento && fixa)
  {
    dataVencimento = nextMonthDayIso(today, fixa.diaVencimento)
    prazoRigido = true
  }
  if (!dataVencimento && faturaCard)
  {
    dataVencimento = nextMonthDayIso(today, faturaCard.diaVencimento)
    prazoRigido = true
  }

  const baseEffort = effort ?? Math.max(defaultEffort(fullFold), checklist.length >= 2 ? checklist.length * 30 : 0)
  const est = Math.max(MIN_EST, Math.min(MAX_EST, baseEffort))

  let prioridade: 1 | 2 | 3 = prioHit ?? 2
  if (date.vague && !prioHit) prioridade = 3
  if (prazoRigido && dataVencimento && diffDaysIso(today, dataVencimento) <= 2) prioridade = 1

  const listHit = findByName(fullFold, ctx.lists ?? [], (l) => l.name)

  const financeiro: TaskPromptFinance | null = isFinance
    ? {
        valor: money ?? fixa?.valor ?? (faturaCard?.faturaAberta || null),
        categoria: (fixa?.categoria as FinanceCategory) || category || (faturaCard ? 'outros' : 'outros'),
        tipo: INCOME_VERBS.test(fullFold) ? 'receita' : 'despesa',
        fixaId: fixa?.id ?? null,
        cardId: faturaCard?.id ?? null,
      }
    : null

  let dup: MobileTask | null = null
  let dupScore = 0
  for (const t of ctx.openTasks ?? [])
  {
    if (t.status === 'done') continue
    const s = titleSimilarity(titulo, t.titulo)
    if (s > dupScore)
    {
      dupScore = s
      dup = t
    }
  }

  let confianca = 0.45
  if (date.iso || date.vague) confianca += 0.15
  if (effort != null) confianca += 0.1
  if (money != null || fixa) confianca += 0.1
  if (titulo.split(' ').length >= 2) confianca += 0.1

  return {
    key: draftKey(),
    titulo,
    descricao: '',
    dataVencimento,
    prazoRigido,
    horaMinutos: hour,
    estimativaMinutos: est,
    prioridade,
    energia: detectEnergy(fullFold, est),
    listId: listHit?.id ?? null,
    checklist,
    financeiro,
    recorrencia,
    duplicateOfId: dupScore >= 0.6 && dup ? dup.id : null,
    confianca: Math.min(0.85, confianca),
    trecho: fragment.trim(),
  }
}

function buildQuestions(drafts: TaskPromptDraft[]): string[]
{
  const qs: string[] = []
  for (const d of drafts)
  {
    if (d.financeiro && d.financeiro.valor == null && d.financeiro.tipo === 'despesa')
    {
      qs.push(`Quanto custa, mais ou menos, “${d.titulo}”?`)
    }
    if (!d.dataVencimento && d.prioridade !== 3)
    {
      qs.push(`“${d.titulo}” tem prazo? Sem prazo, ela vai para Intenções.`)
    }
  }
  return qs.slice(0, 3)
}

/** Interpretação 100% local - instantânea, usada offline e como base da IA. */
export function parseTaskPromptLocal(prompt: string, ctx: TaskPromptContext = {}): TaskPromptParse
{
  const today = localTodayIso(ctx.ref ?? new Date())
  const drafts = splitTaskPrompt(prompt)
    .map((frag) => parseOne(frag, ctx, today))
    .filter((d): d is TaskPromptDraft => d != null)
    .slice(0, 12)
  return { drafts, perguntas: buildQuestions(drafts), source: 'local' }
}

// ---------------------------------------------------------------------------
// IA: request e normalização da resposta
// ---------------------------------------------------------------------------

export function buildTaskPromptAiRequest(prompt: string, ctx: TaskPromptContext = {}): TaskPromptAiRequest
{
  const ref = ctx.ref ?? new Date()
  const today = localTodayIso(ref)
  return {
    prompt: prompt.slice(0, 2000),
    today,
    weekday: ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][weekdayOfIso(today)],
    lists: (ctx.lists ?? []).slice(0, 40).map((l) => ({ id: l.id, name: l.name })),
    categorias: [...TASK_PROMPT_CATEGORIES],
    fixas: (ctx.fixas ?? [])
      .filter((f) => f.ativa)
      .slice(0, 40)
      .map((f) => ({ id: f.id, nome: f.nome, valor: f.valor, diaVencimento: f.diaVencimento, categoria: f.categoria })),
    cards: (ctx.cards ?? []).slice(0, 10).map((c) => ({ id: c.id, nome: c.nome, diaVencimento: c.diaVencimento })),
  }
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/

function num(v: unknown): number | null
{
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : Number(v)
  return Number.isFinite(n) ? n : null
}

function str(v: unknown, max = 200): string
{
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

/** Converte uma tarefa vinda da IA em rascunho seguro (valida ids, datas e faixas). */
export function normalizeAiTask(
  raw: TaskPromptAiTask,
  ctx: TaskPromptContext,
  fallback: TaskPromptDraft | null,
): TaskPromptDraft | null
{
  const today = localTodayIso(ctx.ref ?? new Date())
  const titulo = cleanupTitle(str(raw.titulo)) || fallback?.titulo || ''
  if (titulo.length < 2) return null

  const prazo = str(raw.prazo, 10)
  const validPrazo = ISO_RE.test(prazo) && prazo >= addDaysIso(today, -1) && prazo <= addDaysIso(today, 730)
  const hora = str(raw.hora, 5)
  const horaM = /^(\d{1,2}):(\d{2})$/.exec(hora)
  const horaMinutos = horaM && Number(horaM[1]) <= 23 && Number(horaM[2]) <= 59
    ? Number(horaM[1]) * 60 + Number(horaM[2])
    : fallback?.horaMinutos ?? null

  const est = num(raw.esforco_min)
  const prio = num(raw.prioridade)
  const energia = ['baixa', 'media', 'alta'].includes(String(raw.energia)) ? (raw.energia as TaskEnergy) : fallback?.energia ?? 'media'
  const listId = (ctx.lists ?? []).some((l) => l.id === raw.lista_id) ? String(raw.lista_id) : fallback?.listId ?? null
  const recorrencia = ['diaria', 'semanal', 'mensal'].includes(String(raw.recorrencia))
    ? (raw.recorrencia as TaskRecurrence)
    : fallback?.recorrencia ?? null
  const checklist = Array.isArray(raw.subtarefas)
    ? raw.subtarefas.map((s) => cleanupTitle(str(s, 140))).filter((s) => s.length >= 2).slice(0, 12)
    : fallback?.checklist ?? []

  let financeiro: TaskPromptFinance | null = fallback?.financeiro ?? null
  if (raw.financeiro && typeof raw.financeiro === 'object')
  {
    const f = raw.financeiro as Record<string, unknown>
    const valor = num(f.valor)
    const cat = str(f.categoria, 40)
    const fixaId = num(f.fixa_id)
    const cardId = str(f.cartao_id, 64)
    const fixa = (ctx.fixas ?? []).find((x) => x.id === fixaId) ?? null
    const card = (ctx.cards ?? []).find((c) => c.id === cardId) ?? null
    financeiro = {
      valor: valor != null && valor > 0 && valor < 10_000_000 ? Math.round(valor * 100) / 100 : fixa?.valor ?? fallback?.financeiro?.valor ?? null,
      categoria: (TASK_PROMPT_CATEGORIES as string[]).includes(cat) ? cat : (fixa?.categoria || fallback?.financeiro?.categoria || 'outros'),
      tipo: f.tipo === 'receita' ? 'receita' : 'despesa',
      fixaId: fixa?.id ?? null,
      cardId: card?.id ?? null,
    }
  }
  else if (raw.financeiro === null && fallback?.financeiro?.valor == null)
  {
    financeiro = null
  }

  let dup: string | null = null
  for (const t of ctx.openTasks ?? [])
  {
    if (t.status !== 'done' && titleSimilarity(titulo, t.titulo) >= 0.6)
    {
      dup = t.id
      break
    }
  }

  const conf = num(raw.confianca)
  return {
    key: fallback?.key ?? draftKey(),
    titulo: titulo.slice(0, 200),
    descricao: str(raw.descricao, 1000) || fallback?.descricao || '',
    dataVencimento: validPrazo ? prazo : fallback?.dataVencimento ?? null,
    prazoRigido: typeof raw.prazo_rigido === 'boolean' ? raw.prazo_rigido : fallback?.prazoRigido ?? false,
    horaMinutos,
    estimativaMinutos: est != null ? Math.max(MIN_EST, Math.min(MAX_EST, Math.round(est))) : fallback?.estimativaMinutos ?? 30,
    prioridade: prio === 1 || prio === 2 || prio === 3 ? prio : fallback?.prioridade ?? 2,
    energia,
    listId,
    checklist,
    financeiro,
    recorrencia,
    duplicateOfId: dup,
    confianca: conf != null ? Math.max(0, Math.min(1, conf)) : 0.75,
    trecho: str(raw.trecho, 300) || fallback?.trecho || titulo,
  }
}

/**
 * Junta leitura local + IA. A IA manda na estrutura (quantas tarefas, títulos);
 * o local preenche lacunas quando o trecho bate.
 */
export function mergeTaskPromptParse(
  local: TaskPromptParse,
  ai: TaskPromptAiResponse | null,
  ctx: TaskPromptContext = {},
): TaskPromptParse
{
  if (!ai || !Array.isArray(ai.tasks) || ai.tasks.length === 0) return local

  const used = new Set<string>()
  const drafts: TaskPromptDraft[] = []
  for (const t of ai.tasks.slice(0, 12))
  {
    const titulo = str(t.titulo)
    let best: TaskPromptDraft | null = null
    let bestScore = 0
    for (const d of local.drafts)
    {
      if (used.has(d.key)) continue
      const s = Math.max(titleSimilarity(titulo, d.titulo), titleSimilarity(str(t.trecho, 300), d.trecho))
      if (s > bestScore)
      {
        best = d
        bestScore = s
      }
    }
    const fallback = bestScore >= 0.3 ? best : null
    if (fallback) used.add(fallback.key)
    const merged = normalizeAiTask(t, ctx, fallback)
    if (merged) drafts.push(merged)
  }

  if (drafts.length === 0) return local
  const perguntas = (ai.perguntas ?? []).map((q) => str(q, 200)).filter(Boolean).slice(0, 3)
  return {
    drafts,
    perguntas: perguntas.length ? perguntas : buildQuestions(drafts),
    source: ai.source,
  }
}

// ---------------------------------------------------------------------------
// Tags de metadados na anotação (sem migração de banco)
// ---------------------------------------------------------------------------

const COST_TAG_RE = /#custo:(\d+(?:\.\d{1,2})?):([^\s:]+)(?::(fx\d+|cd[^\s]+))?/i
const ENERGY_TAG_RE = /#energia:(baixa|media|alta)/i
const RIGID_TAG_RE = /#prazo:firme/i
export const TASK_SIDECAR_TAGS_RE = /#(?:custo:\S+|energia:(?:baixa|media|alta)|prazo:firme)/gi

export type TaskCostMeta = {
  valor: number
  categoria: string
  fixaId: number | null
  cardId: string | null
}

export function stripTaskSidecarTags(notas: string): string
{
  return (notas || '').replace(TASK_SIDECAR_TAGS_RE, '').replace(/\n{2,}/g, '\n').trim()
}

/** Tags que precisam sobreviver às edições (copiadas da anotação original). */
export function extractTaskSidecarTags(notas: string): string[]
{
  return (notas || '').match(TASK_SIDECAR_TAGS_RE) ?? []
}

export function parseTaskCost(notas: string): TaskCostMeta | null
{
  const m = COST_TAG_RE.exec(notas || '')
  if (!m) return null
  const ref = m[3] || ''
  return {
    valor: Number(m[1]),
    categoria: decodeURIComponent(m[2]),
    fixaId: ref.startsWith('fx') ? Number(ref.slice(2)) : null,
    cardId: ref.startsWith('cd') ? decodeURIComponent(ref.slice(2)) : null,
  }
}

export function parseTaskEnergy(notas: string): TaskEnergy | null
{
  const m = ENERGY_TAG_RE.exec(notas || '')
  return m ? (m[1] as TaskEnergy) : null
}

export function isTaskDeadlineRigid(notas: string): boolean
{
  return RIGID_TAG_RE.test(notas || '')
}

/** Carimba custo/energia/prazo firme como tags ocultas na anotação. */
export function stampTaskSidecar(
  notas: string,
  meta: { financeiro?: TaskPromptFinance | null; energia?: TaskEnergy | null; prazoRigido?: boolean },
): string
{
  const lines = [stripTaskSidecarTags(notas)]
  const f = meta.financeiro
  if (f && f.valor != null && f.valor > 0)
  {
    const ref = f.fixaId != null ? `:fx${f.fixaId}` : f.cardId ? `:cd${encodeURIComponent(f.cardId)}` : ''
    lines.push(`#custo:${f.valor.toFixed(2)}:${encodeURIComponent(String(f.categoria || 'outros'))}${ref}`)
  }
  if (meta.energia && meta.energia !== 'media') lines.push(`#energia:${meta.energia}`)
  if (meta.prazoRigido) lines.push('#prazo:firme')
  return lines.filter(Boolean).join('\n')
}
