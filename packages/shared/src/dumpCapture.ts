/**
 * Captura rápida em modo Dump: cada linha livre vira um item classificado
 * (tarefa, lembrete, gasto, receita ou conta a pagar).
 * Parser local primeiro (offline, convidado); a IA só entra nas linhas de baixa confiança.
 * A tela mostra a leitura antes de salvar e deixa trocar o tipo de cada linha.
 *
 * Ordem da leitura local (cada etapa remove o trecho que reconheceu):
 * horário → data → dinheiro (números de quantidade, sala, linha etc. ficam de fora) → tipo → título.
 */
import type { FinanceCategory } from './finance'
import { localTodayIso } from './dates'
import {
  addDaysIso,
  blankPromptFiller,
  cleanupPromptTitle,
  cutPromptText as cut,
  detectPromptCategory,
  extractPromptDate,
  extractPromptHour,
  foldText,
  parseBrlNumber,
  weekdayOfIso,
  type PromptTextWork as Work,
} from './taskPrompt'

export type DumpKind =
  /** algo para fazer: "comprar arroz", "almoço com a Marianna quarta" */
  | 'tarefa'
  /** algo para não esquecer, com aviso: "lembrar mãe de pagar conta", "me lembra às 22h do remédio" */
  | 'lembrete'
  /** dinheiro que já saiu: "café 12,50", "comprei um colar de 44,50" (sem vencimento futuro) */
  | 'gasto'
  /** dinheiro que entrou: "recebi 500 do freela" */
  | 'receita'
  /** dinheiro que ainda vai sair, com ou sem data: "pagar a Vitória 8,11", "colar 44,50 vence dia 11" */
  | 'conta'

export type DumpItem = {
  /** estável dentro de uma leitura, para a tela editar */
  key: string
  /** a linha como a pessoa escreveu */
  linha: string
  kind: DumpKind
  /** título limpo, sem valor, data ou hora ("Comprar arroz, feijão e batata") */
  titulo: string
  /** valor em reais, só para gasto, receita e conta */
  valor: number | null
  categoria: FinanceCategory | null
  /**
   * ISO YYYY-MM-DD.
   * tarefa/lembrete: dia de fazer. gasto/receita: dia do lançamento (hoje se não disse).
   * conta: vencimento (hoje se não disse).
   */
  data: string | null
  /** minutos desde 00:00, só se a pessoa disse ou o contexto implica ("almoço" sugere 12:00) */
  horaMinutos: number | null
  /** true quando a hora foi deduzida ("almoço", "à tarde") e não dita; a tela pode pedir confirmação */
  horaSugerida?: boolean
  /** itens de uma lista na mesma linha ("arroz, feijão e batata") */
  checklist: string[]
  /** 0 a 1: quanto o parser confia na leitura do tipo */
  confianca: number
  /** frase curta em português para a tela ("tem valor e 'comprei'") */
  motivo: string
  source: 'local' | 'ia'
}

export type DumpContext = {
  /** "agora" da leitura; testes passam uma data fixa */
  ref?: Date
}

/** Abaixo disso a linha é enviada para a IA (se houver internet) e a tela destaca a dúvida. */
export const DUMP_LOW_CONFIDENCE = 0.6

export const DUMP_KIND_LABELS: Record<DumpKind, string> = {
  tarefa: 'Tarefa',
  lembrete: 'Lembrete',
  gasto: 'Gasto',
  receita: 'Receita',
  conta: 'Conta a pagar',
}

export const DUMP_KINDS: DumpKind[] = ['tarefa', 'lembrete', 'gasto', 'receita', 'conta']

const MONEY_KINDS: DumpKind[] = ['gasto', 'receita', 'conta']

/** Divide o texto do Dump em linhas não vazias. */
export function splitDumpLines(text: string): string[]
{
  return (text || '')
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
}

// ---------------------------------------------------------------------------
// Preparação do texto
// ---------------------------------------------------------------------------

const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}]/gu

function prepLine(linha: string): string
{
  let s = (linha || '').normalize('NFC').replace(EMOJI_RE, ' ')
  s = s.replace(/^\s*(?:[-*•·>]+|\d{1,2}[.)])\s+/, '')
  s = s.replace(/\s+/g, ' ').trim()
  // TUDO EM MAIÚSCULAS vira minúsculas (o título ganha só a primeira maiúscula)
  if (/[A-ZÀ-Ý]{2}/.test(s) && !/[a-zß-ÿ]/.test(s)) s = s.toLowerCase()
  return s
}

/**
 * Troca trechos casados em `fold` nos dois lados (raw e fold) pelo mesmo texto ASCII.
 * O alinhamento raw/fold continua valendo porque a troca é idêntica nos dois.
 */
function replaceBoth(w: Work, re: RegExp, fn: (m: RegExpExecArray) => string | null): void
{
  const hits: { start: number; end: number; text: string }[] = []
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`)
  let m: RegExpExecArray | null
  while ((m = g.exec(w.fold)))
  {
    const text = fn(m)
    if (text != null) hits.push({ start: m.index, end: m.index + m[0].length, text })
    if (m[0].length === 0) g.lastIndex += 1
  }
  for (let i = hits.length - 1; i >= 0; i -= 1)
  {
    const h = hits[i]
    w.raw = w.raw.slice(0, h.start) + h.text + w.raw.slice(h.end)
    w.fold = w.fold.slice(0, h.start) + h.text + w.fold.slice(h.end)
  }
}

/** Troca um trecho por espaços do mesmo tamanho (sem mexer no alinhamento). */
function blankSpan(w: Work, start: number, end: number): void
{
  const pad = ' '.repeat(Math.max(0, end - start))
  w.raw = w.raw.slice(0, start) + pad + w.raw.slice(end)
  w.fold = w.fold.slice(0, start) + pad + w.fold.slice(end)
}

const WEEKDAY_ABBR: Record<string, string> = {
  seg: 'segunda',
  ter: 'terca',
  qua: 'quarta',
  qui: 'quinta',
  sex: 'sexta',
  sab: 'sabado',
  dom: 'domingo',
}

/** Abreviações e grafias soltas que o leitor de datas não conhece. */
function normalizeShortcuts(w: Work): void
{
  replaceBoth(w, /\bhj\b/, () => 'hoje')
  replaceBoth(w, /\b(?:amnh|amanh|amanah)\b/, () => 'amanha')
  replaceBoth(w, /\b(?:dps|dpois)\b/, () => 'depois')
  replaceBoth(w, /\bq\s+vem\b/, () => 'que vem')
  replaceBoth(w, /\bprox\.?\s+(?=(?:seg|ter|qua|qui|sex|sab|dom|semana|mes)\w*\b)/, () => 'proxima ')
  // "quarta/feira", "quarta-feira", "quarta feira", "quartafeira"
  replaceBoth(w, /\b(segunda|terca|quarta|quinta|sexta)\s*[/-]?\s*feira\b/, (m) => m[1])
  replaceBoth(w, /\bsab\s*[/-]?\s*ado\b/, () => 'sabado')
  // abreviações de dia: só com contexto de data, para não pegar "ter que", "dom" etc.
  replaceBoth(
    w,
    /(\b(?:n[ao]|nest[ae]|essa|esta|proxim[ao])\s+)?\b(seg|ter|qua|qui|sex|sab|dom)\b\.?/,
    (m) =>
    {
      const hasPrefix = Boolean(m[1])
      const rest = m.input.slice(m.index + m[0].length)
      const hasTail = /^(?:\s+(?:as\s|a\s|de\s|da\s|pela\s|que vem|\d)|\s*[,.;!?]*\s*$)/.test(rest)
      if (!hasPrefix && !hasTail) return null
      return `${m[1] ?? ''}${WEEKDAY_ABBR[m[2]]}`
    },
  )
}

// ---------------------------------------------------------------------------
// Números por extenso
// ---------------------------------------------------------------------------

const NUM_WORDS: Record<string, number> = {
  um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9,
  dez: 10, onze: 11, doze: 12, treze: 13, quatorze: 14, catorze: 14, quinze: 15, dezesseis: 16,
  dezasseis: 16, dezessete: 17, dezoito: 18, dezenove: 19,
  vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, cincoenta: 50, sessenta: 60, setenta: 70,
  oitenta: 80, noventa: 90,
  cem: 100, cento: 100, duzentos: 200, duzentas: 200, trezentos: 300, trezentas: 300,
  quatrocentos: 400, quinhentos: 500, seiscentos: 600, setecentos: 700, oitocentos: 800,
  novecentos: 900, mil: 1000,
}
const NUM_WORD_ALT = Object.keys(NUM_WORDS).sort((a, b) => b.length - a.length).join('|')
const WRITTEN_SRC = `\\b(?:${NUM_WORD_ALT})(?:\\s+(?:e\\s+)?(?:${NUM_WORD_ALT}))*\\b`

/** "vinte e cinco" → 25 · "doze e cinquenta" → 12.5 (o "e cinquenta" depois vira centavos) */
export function parseWrittenNumberPt(text: string): number | null
{
  const words = foldText(text).split(/\s+/).filter((p) => p && p !== 'e')
  if (words.length === 0) return null
  let total = 0
  let group = 0
  let last = 9
  let cents: number | null = null
  let centLast = 9
  const clsOf = (p: number) => (p >= 100 ? 3 : p >= 10 ? 2 : 1)
  for (const word of words)
  {
    const p = NUM_WORDS[word]
    if (p == null) return null
    if (p === 1000)
    {
      if (cents != null) return null
      total += (group || 1) * 1000
      group = 0
      last = 9
      continue
    }
    const cls = clsOf(p)
    const teen = p >= 10 && p < 20
    if (cents == null)
    {
      if (cls < last)
      {
        group += p
        last = teen ? 1 : cls
      }
      else if (p >= 10 && p < 100 && total + group > 0)
      {
        cents = p
        centLast = teen ? 1 : cls
      }
      else return null
    }
    else if (cls < centLast)
    {
      cents += p
      centLast = teen ? 1 : cls
    }
    else return null
  }
  const v = total + group + (cents != null ? cents / 100 : 0)
  return v > 0 ? Math.round(v * 100) / 100 : null
}

// ---------------------------------------------------------------------------
// Horário
// ---------------------------------------------------------------------------

type HourHit = { min: number; sugerida: boolean; comNumero: boolean }

const HOUR_WORD_RE = new RegExp(`\\b(?:as|pelas)\\s+(${NUM_WORD_ALT})(\\s+e\\s+meia)?(?:\\s+horas?)?(?:\\s+da\\s+(manha|tarde|noite))?\\b`)

function extractDumpHour(w: Work): HourHit | null
{
  let m: RegExpExecArray | null
  // "7 da noite", "às 3 da tarde"
  if ((m = cut(w, /\b(?:as\s+|pelas\s+)?(\d{1,2})(?:(?:h|:)(\d{2}))?\s*(?:h(?:oras?)?)?\s+da\s+(manha|tarde|noite|madrugada)\b/)))
  {
    let h = Number(m[1])
    const min = m[2] ? Number(m[2]) : 0
    if ((m[3] === 'tarde' || m[3] === 'noite') && h < 12) h += 12
    if (h <= 23 && min <= 59) return { min: h * 60 + min, sugerida: false, comNumero: true }
  }
  // "às nove", "às duas da tarde"
  if ((m = HOUR_WORD_RE.exec(w.fold)))
  {
    let h = NUM_WORDS[m[1]] ?? 99
    if (h <= 12)
    {
      cut(w, HOUR_WORD_RE)
      if ((m[3] === 'tarde' || m[3] === 'noite') && h < 12) h += 12
      return { min: h * 60 + (m[2] ? 30 : 0), sugerida: false, comNumero: true }
    }
  }
  if ((m = cut(w, /\b(?:ao\s+|as\s+|a\s+)?meio[\s-]?dia(\s+e\s+meia)?\b/)))
  {
    return { min: 12 * 60 + (m[1] ? 30 : 0), sugerida: false, comNumero: false }
  }
  if (cut(w, /\b(?:a\s+)?meia[\s-]?noite\b/)) return { min: 0, sugerida: false, comNumero: false }

  // períodos do dia: guardados; um horário explícito na mesma linha vence
  let period: number | null = null
  if (cut(w, /\b(?:de|pela|n[ao]|nest[ae]|essa|esta|cedo de)\s+manha(?:zinha)?\b/)) period = 9 * 60
  else if (cut(w, /\b(?:a|de|pela|na|nest[ae]|essa|esta)\s+tarde(?:zinha)?\b/)) period = 15 * 60
  else if (cut(w, /\b(?:a|de|pela|na|nest[ae]|essa|esta)\s+noite(?:zinha)?\b/)) period = 20 * 60

  // o leitor de tarefas trata "almoço" no fim da frase como horário e apaga a palavra;
  // aqui "almoço" é assunto, então uma sentinela no fim desliga essa regra.
  w.raw += ' §'
  w.fold += ' §'
  const explicit = extractPromptHour(w)
  if (w.fold.endsWith(' §'))
  {
    w.raw = w.raw.slice(0, -2)
    w.fold = w.fold.slice(0, -2)
  }
  if (explicit != null) return { min: explicit, sugerida: false, comNumero: true }
  if (period != null) return { min: period, sugerida: true, comNumero: false }
  return null
}

function impliedHour(fold: string): number | null
{
  if (/\bcafe da manha\b/.test(fold)) return 8 * 60
  if (/\balmoc(?:o|ar)\b/.test(fold)) return 12 * 60
  if (/\b(?:jantar|janta)\b/.test(fold)) return 20 * 60
  return null
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const MONTHS_PT = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

type DateRead = { iso: string | null; rigid: boolean; comNumero: boolean }

function extractDumpDate(w: Work, today: string): DateRead
{
  if (cut(w, /\banteontem\b/)) return { iso: addDaysIso(today, -2), rigid: false, comNumero: false }
  if (cut(w, /\bontem\b/)) return { iso: addDaysIso(today, -1), rigid: false, comNumero: false }

  const monthRe = new RegExp(`\\b(?:(?:n[oa]|em|para|pra|pro)\\s+)?(?:dia\\s+)?(\\d{1,2})\\s+de\\s+(${MONTHS_PT.join('|')})(?:\\s+de\\s+(\\d{4}))?\\b`)
  let m: RegExpExecArray | null
  if ((m = cut(w, monthRe)))
  {
    const d = Number(m[1])
    const mo = MONTHS_PT.indexOf(m[2])
    const [ty] = today.split('-').map(Number)
    let y = m[3] ? Number(m[3]) : ty
    const iso = (yy: number) => localTodayIso(new Date(yy, mo, Math.min(d, new Date(yy, mo + 1, 0).getDate()), 12))
    let out = iso(y)
    if (!m[3] && out < today)
    {
      y += 1
      out = iso(y)
    }
    if (d >= 1 && d <= 31) return { iso: out, rigid: false, comNumero: true }
  }

  // "no dia 10", "pra amanhã", "pra sexta": a preposição sai junto com a data
  replaceBoth(
    w,
    /\b(?:n[oa]|para|pra|pro|em)\s+(?=dia\s+\d|\d{1,2}\/\d|hoje\b|amanha\b|depois de amanha\b|semana que vem\b|proxima semana\b|(?:proxim[oa]\s+)?(?:segunda|terca|quarta|quinta|sexta|sabado|domingo)\b)/,
    (x) => ' '.repeat(x[0].length),
  )
  const numeric = /\bdia\s+\d|\b\d{1,2}\/\d{1,2}\b|\bem\s+\d|\bdaqui a\s+\d/.test(w.fold)
  const hit = extractPromptDate(w, today)
  return { iso: hit.iso, rigid: hit.rigid, comNumero: numeric && hit.iso != null }
}

// ---------------------------------------------------------------------------
// Dinheiro
// ---------------------------------------------------------------------------

type MoneyHit = {
  valor: number
  start: number
  end: number
  /** explícito: R$, reais, 12,50, 1.200, 2k. solto: "uber 23" */
  forte: boolean
}

/** Números que não são dinheiro: unidades de medida, duração, vezes. */
const UNIT_RE = /\b\d+(?:[.,]\d+)?\s*(?:min|mins|minutos?|hs?|horas?|km|kms|quilometros?|metros?|m|kg|kgs|quilos?|kilos?|g|gr|gramas?|l|lts?|litros?|ml|cm|x|vezes|%|por cento|andar(?:es)?|anos?|meses|dias|semanas?)\b/g

/** Palavra antes do número que indica código, não valor ("sala 204", "ônibus 175"). */
const NON_MONEY_PREV_RE = /\b(sala|salas|linha|onibus|busao|apto?|apartamento|bloco|bl|quarto|pagina|pag|paginas|capitulo|cap|numero|num|n|nº|casa|lote|rua|av|avenida|voo|portao|andar|mesa|senha|codigo|versao|turma|ramal|cep|km|br|rodovia|nota|tamanho|tam|cadeira|poltrona|box|vaga|unidade|lugar|posicao|fase|nivel|temporada|episodio|ep|serie|ano|turno|grupo|top|questao|exercicio|aula|modulo|licao|semana|parte|volume|vol|canal|porta|plataforma|guiche|leito|sessao)\s+(\d+)\b(?![.,]\d)/g

/** Palavras que podem vir logo depois de um valor ("paguei 50 no mercado"). */
const MONEY_FOLLOW = new Set([
  'no', 'na', 'nos', 'nas', 'em', 'com', 'pro', 'pra', 'pras', 'pros', 'para', 'de', 'do', 'da', 'dos', 'das',
  'e', 'ou', 'reais', 'real', 'conto', 'contos', 'pila', 'pilas', 'mil', 'k', 'o', 'a', 'os', 'as', 'ao',
  'pelo', 'pela', 'por', 'ja', 'so', 'que', 'ai', 'la', 'cada', 'total', 'mes', 'mensal', 'fixo', 'cartao',
  'credito', 'debito', 'dinheiro', 'pix', 'vence', 'venceu', 'vencimento', 'ate', 'dia', 'hoje', 'ontem',
  'amanha', 'semana', 'parcelado', 'c', 'avista', 'vista', 'tudo', 'mais', 'menos', 'certinho', 'ne', 'num', 'numa',
])

const MONEY_PREFIX = '(?:\\b(?:de|por|uns|umas|cerca de|mais ou menos|tipo)\\s+)?'
const MONEY_SUFFIX = '(?:reais|real|conto|contos|pila|pilas|mangos?)'

/** Nomes de gasto do dia a dia: com número solto, é quase certo que já saiu. */
const GASTO_NOUNS = /\b(uber|taxi|cafe|cafezinho|lanche|almoco|janta|jantar|pizza|hamburguer|burger|acai|sorvete|padaria|pao|mercado|supermercado|feira|restaurante|ifood|delivery|gasolina|combustivel|etanol|posto|estacionamento|pedagio|farmacia|cinema|cerveja|chopp|bar|marmita|sushi|salgado|coxinha|refri|sacolao|hortifruti|acougue|lanchonete|onibus|metro|passagem|subway|mcdonalds|starbucks|outback|assai|atacadao|carrefour|shopee|amazon|shein)\b/

/** Contas da casa: com data, é conta a pagar. */
const BILL_NOUNS = /\b(aluguel|condominio|luz|energia|agua|gas|internet|iptu|ipva|net|celular|telefone|cartao|escola|faculdade|academia|seguro|plano de saude|plano|diarista|mensalidade|financiamento|consorcio|netflix|spotify)\b/

function buildMoneyMask(fold: string, expensive: boolean): { mask: string; contou: boolean }
{
  let mask = fold
  let contou = false
  const blank = (s: number, e: number) =>
  {
    mask = mask.slice(0, s) + ' '.repeat(e - s) + mask.slice(e)
  }
  for (const m of [...fold.matchAll(UNIT_RE)])
  {
    const idx = m.index ?? 0
    if (idx > 0 && /[\d.,]/.test(fold[idx - 1])) continue
    blank(idx, idx + m[0].length)
    contou = true
  }
  for (const m of [...mask.matchAll(NON_MONEY_PREV_RE)])
  {
    const idx = (m.index ?? 0) + m[0].length - m[2].length
    blank(idx, idx + m[2].length)
    contou = true
  }
  // "2 pães", "3 capítulos": número seguido de substantivo é quantidade
  for (const m of [...mask.matchAll(/\b(\d+)\s+([a-z]+)/g)])
  {
    const idx = m.index ?? 0
    if (idx > 0 && /[\d.,/:]/.test(mask[idx - 1])) continue
    const next = m[2]
    if (MONEY_FOLLOW.has(next)) continue
    if (expensive && GASTO_NOUNS.test(next)) continue
    if (/^(?:k|mil)$/.test(next)) continue
    blank(idx, idx + m[1].length)
    contou = true
  }
  // "dois pães", "três capítulos"
  for (const m of [...mask.matchAll(new RegExp(`${WRITTEN_SRC}\\s+([a-z]+)`, 'g'))])
  {
    const next = m[1]
    if (MONEY_FOLLOW.has(next) || new RegExp(`^${MONEY_SUFFIX}$`).test(next)) continue
    const idx = m.index ?? 0
    blank(idx, idx + m[0].length - next.length)
  }
  return { mask, contou }
}

function extractDumpMoney(w: Work, expensive: boolean): { hit: MoneyHit | null; contou: boolean }
{
  const { mask, contou } = buildMoneyMask(w.fold, expensive)
  const at = (m: RegExpExecArray, valor: number | null, forte: boolean): MoneyHit | null =>
    valor != null && valor > 0 && valor < 10_000_000
      ? { valor, start: m.index, end: m.index + m[0].length, forte }
      : null

  let m: RegExpExecArray | null
  let hit: MoneyHit | null = null
  // R$ 12,50 · R$1.200 · R$ 2 mil
  if ((m = new RegExp(`${MONEY_PREFIX}r\\$\\s*(\\d+(?:[.,]\\d+)*)(\\s*(?:mil\\b|k\\b))?`).exec(mask)))
  {
    hit = at(m, parseBrlNumber(m[1], Boolean(m[2])), true)
  }
  // 1,2 mil · 2k · 3 mil reais
  if (!hit && (m = new RegExp(`${MONEY_PREFIX}\\b(\\d+(?:[.,]\\d+)?)\\s*(?:mil|k)\\b(?:\\s*${MONEY_SUFFIX}\\b)?`).exec(mask)))
  {
    hit = at(m, parseBrlNumber(m[1], true), true)
  }
  // 12 reais · 30 conto
  if (!hit && (m = new RegExp(`${MONEY_PREFIX}\\b(\\d+(?:[.,]\\d+)*)\\s*${MONEY_SUFFIX}\\b`).exec(mask)))
  {
    hit = at(m, parseBrlNumber(m[1]), true)
  }
  // vinte e cinco reais
  if (!hit && (m = new RegExp(`${MONEY_PREFIX}(${WRITTEN_SRC})\\s*${MONEY_SUFFIX}\\b`).exec(mask)))
  {
    hit = at(m, parseWrittenNumberPt(m[1]), true)
  }
  // 44,50 · 1.200 · 1.200,50 · 12.50
  if (!hit && (m = new RegExp(`${MONEY_PREFIX}\\b(\\d{1,3}(?:\\.\\d{3})+(?:,\\d{1,2})?|\\d+,\\d{1,2}|\\d+\\.\\d{2})\\b(?![.,]?\\d)`).exec(mask)))
  {
    hit = at(m, parseBrlNumber(m[1]), true)
  }
  // número solto: "uber 23", "mercado 230"
  if (!hit && (m = new RegExp(`(?:^|\\s)${MONEY_PREFIX}(\\d{1,7})(?=$|\\s|[.!?;,]+(?:\\s|$))`).exec(mask)))
  {
    const lead = m[0].length - m[0].trimStart().length
    const valor = Number(m[1])
    if (valor > 0) hit = { valor, start: m.index + lead, end: m.index + m[0].length, forte: false }
  }
  // por extenso sem "reais": "doze e cinquenta", "cinquenta"
  if (!hit)
  {
    const re = new RegExp(`${MONEY_PREFIX}(${WRITTEN_SRC})`, 'g')
    while ((m = re.exec(mask)))
    {
      const words = m[1].split(/\s+/).filter((x) => x !== 'e')
      const valor = parseWrittenNumberPt(m[1])
      if (valor == null) continue
      if (words.length === 1 && valor < 10) continue
      hit = at(m, valor, false)
      if (hit) break
    }
  }
  return { hit, contou }
}

// ---------------------------------------------------------------------------
// Sinais de tipo
// ---------------------------------------------------------------------------

const LEMBRETE_LEAD_RE = /^(?:(?:eu|preciso|tenho que|ei|oi|axel)[\s,]+)?(me\s+lembr[ae](?:r)?|lembrar|lembra|lembre|lembrete|nao\s+(?:esquecer|esquece|esqueca|esquecam|pode esquecer|posso esquecer|deixar de)|me\s+avis[ae](?:r)?|avisar|avisa)\b/
const MEDS_RE = /\b(remedio|remedios|comprimidos?|capsulas?|vitaminas?|insulina|antibiotico|dipirona|medicacao|medicamentos?|pilula|anticoncepcional|dose|gotas)\b/
const EXPENSE_PIX_RE = /\b(?:(?:fiz|mandei|enviei|fiz um|mandei um|enviei um)\s+(?:um\s+)?pix|pix\s+(?:pr[oa]|para|pr[oa]s)\b)/
const INCOME_RE = /\b(recebi|recebemos|receber|recebido|recebimento|caiu|cairam|ganhei|ganhamos|salario|reembolso|reembolsaram|reembolsou|vendi|vendemos|me pagou|me pagaram|me devolveu|me devolveram|me deu|me deram|entrou|entraram|freela|rendimento|rendeu|cashback|me transferiu|decimo terceiro|13o|cobrar|pix\s+d[aoe]\s+(?!\d|r\$))/
const VENCE_RE = /\b(vence|vencem|vencendo|vencimento|venc|a pagar|ate dia|devo|devendo|em aberto|pendente)\b/
const EXPENSE_PAST_RE = /\b(gastei|gastamos|gasto|paguei|pagamos|comprei|compramos|custou|custaram|saiu|sairam|deu|torrei|transferi|abasteci|almocei|jantei|lanchei|comi|tomei)\b/
const CONTA_RE = /\b(pagar|pague|quitar|boleto|boletos|fatura|parcela|prestacao|mensalidade|conta d[aeo]|carne|financiamento)\b/
const APPOINTMENT_RE = /\b(reuniao|consulta|dentista|medico|medica|almoco|jantar|janta|cafe com|aula|prova|entrevista|aniversario|festa|academia|exame|call|encontro|terapia|psicolog[oa]|cabeleireiro|manicure|voo|viagem|evento|show|missa|culto|treino)\b/

const NOT_VERBS = new Set([
  'celular', 'lugar', 'bar', 'mar', 'par', 'colar', 'acucar', 'mulher', 'colher', 'lazer', 'qualquer',
  'dolar', 'familiar', 'militar', 'lar', 'ar', 'jantar', 'almocar', 'luar', 'prazer', 'talher', 'polar',
  'escolar', 'particular', 'titular', 'popular', 'regular', 'solar', 'hangar', 'altar',
])

/** Verbos que, com valor, sugerem compra planejada (não gasto certo). */
const PLAN_VERBS = new Set(['comprar', 'levar', 'trazer', 'pegar', 'buscar', 'ir', 'fazer', 'mandar', 'enviar', 'reservar', 'encomendar', 'pedir', 'separar', 'juntar', 'guardar', 'economizar', 'ligar', 'marcar', 'agendar', 'ver', 'olhar', 'pesquisar', 'orcar', 'cotar'])

const LEAD_FILLER_RE = /^(?:(?:eu|preciso|precisa|tenho que|tenho de|quero|vou|hoje|amanha|tambem|depois|e|ai|ah|entao|dai|devo(?=\s+[a-z]+(?:ar|er|ir)\b))\s+)+/

function leadVerbOf(fold: string): string | null
{
  const s = fold.trim().replace(LEAD_FILLER_RE, '')
  const m = /^([a-z]*(?:ar|er|ir|or))(?:-(?:me|se|lhe|lo|la))?\b/.exec(s)
  if (!m || NOT_VERBS.has(m[1])) return null
  return m[1]
}

type Signals = {
  lembrete: string | null
  meds: boolean
  expensePix: string | null
  income: string | null
  vence: string | null
  expensePast: string | null
  conta: string | null
  appointment: string | null
  gastoNoun: string | null
  billNoun: string | null
  leadVerb: string | null
}

function readSignals(fold: string, raw: string): Signals
{
  const said = (re: RegExp): string | null =>
  {
    const m = re.exec(fold)
    if (!m) return null
    const g = m[1] ?? m[0]
    const idx = m.index + m[0].indexOf(g)
    return raw.slice(idx, idx + g.length).toLowerCase().trim()
  }
  const trimmed = fold.trimStart()
  const lead = LEMBRETE_LEAD_RE.exec(trimmed)
  const offset = fold.length - trimmed.length
  return {
    lembrete: lead ? raw.slice(offset + lead.index + lead[0].indexOf(lead[1]), offset + lead.index + lead[0].length).toLowerCase() : null,
    meds: MEDS_RE.test(fold),
    expensePix: said(EXPENSE_PIX_RE),
    income: said(INCOME_RE),
    vence: said(VENCE_RE),
    expensePast: said(EXPENSE_PAST_RE),
    conta: said(CONTA_RE),
    appointment: said(APPOINTMENT_RE),
    gastoNoun: said(GASTO_NOUNS),
    billNoun: said(BILL_NOUNS),
    leadVerb: leadVerbOf(fold),
  }
}

// ---------------------------------------------------------------------------
// Categoria
// ---------------------------------------------------------------------------

const DUMP_CATEGORY_KEYWORDS: [FinanceCategory, RegExp][] = [
  ['compras', /\b(mercado livre|shopee|amazon|shein|magalu|americanas|aliexpress)\b/],
  ['alimentacao', /\b(cafe|cafezinho|lanche|lanchei|almoco|almocei|jantar|janta|jantei|pizza|hamburguer|burger|acai|sorvete|padaria|pao|paes|mercado|supermercado|feira|restaurante|ifood|delivery|subway|mcdonalds|outback|starbucks|cerveja|chopp|marmita|sushi|salgado|coxinha|refri|comida|sacolao|hortifruti|acougue|lanchonete|assai|atacadao|carrefour|comi)\b/],
  ['transporte', /(?:^|\s)99(?=\s|$)/],
  ['transporte', /\b(uber|taxi|gasolina|combustivel|etanol|abasteci|posto|estacionamento|pedagio|onibus|metro|passagem de onibus|bilhete unico|oficina|mecanico|pneu|ipva|multa)\b/],
  ['saude', /\b(farmacia|remedio|remedios|dentista|medico|medica|consulta|exame|terapia|psicolog[oa]|academia|plano de saude|vacina|fisioterapia)\b/],
  ['habitacao', /\b(aluguel|condominio|luz|energia|agua|gas|internet|iptu|diarista|faxina|reforma)\b/],
  ['educacao', /\b(curso|faculdade|escola|livro|livros|apostila|material escolar|matricula)\b/],
  ['lazer', /\b(cinema|show|ingresso|bar|netflix|spotify|viagem|hotel|festa|jogo|balada|streaming|passeio)\b/],
  ['compras', /\b(colar|brinco|anel|pulseira|roupa|roupas|camisa|camiseta|calca|blusa|vestido|tenis|sapato|bolsa|presente|loja|shopping|perfume|maquiagem|celular|fone|relogio|comprei|compramos|comprar)\b/],
]

function dumpCategory(fold: string): FinanceCategory
{
  for (const [cat, re] of DUMP_CATEGORY_KEYWORDS)
  {
    if (re.test(fold)) return cat
  }
  return detectPromptCategory(fold) ?? 'outros'
}

// ---------------------------------------------------------------------------
// Título
// ---------------------------------------------------------------------------

const BRANDS: Record<string, string> = {
  subway: 'Subway', mcdonalds: 'McDonald\'s', ifood: 'iFood', uber: 'Uber', netflix: 'Netflix',
  spotify: 'Spotify', amazon: 'Amazon', shopee: 'Shopee', shein: 'Shein', starbucks: 'Starbucks',
  outback: 'Outback', carrefour: 'Carrefour', assai: 'Assaí', atacadao: 'Atacadão', renner: 'Renner',
  riachuelo: 'Riachuelo', zara: 'Zara', magalu: 'Magalu', americanas: 'Americanas', madero: 'Madero',
  spoleto: 'Spoleto', habibs: 'Habib\'s', ipva: 'IPVA', iptu: 'IPTU', tcc: 'TCC', rh: 'RH', cpf: 'CPF', cnh: 'CNH', rg: 'RG', pix: 'Pix', nubank: 'Nubank', whatsapp: 'WhatsApp',
  zap: 'Zap', google: 'Google', instagram: 'Instagram', aliexpress: 'AliExpress',
}

/** Palavras que aparecem depois de "com a", "pro", "pagar o" e não são nomes. */
const COMMON_AFTER = new Set([
  'mae', 'pai', 'vo', 'avo', 'vovo', 'tia', 'tio', 'irma', 'irmao', 'irmaos', 'filho', 'filha', 'filhos', 'esposa',
  'marido', 'namorado', 'namorada', 'noiva', 'noivo', 'sogra', 'sogro', 'cunhado', 'cunhada', 'prima', 'primo',
  'amigo', 'amiga', 'amigos', 'amigas', 'chefe', 'equipe', 'time', 'galera', 'pessoal', 'turma', 'cliente',
  'clientes', 'professor', 'professora', 'medico', 'medica', 'dentista', 'banco', 'mercado', 'farmacia',
  'padaria', 'escola', 'faculdade', 'academia', 'luz', 'agua', 'conta', 'contas', 'fatura', 'boleto', 'internet',
  'aluguel', 'condominio', 'cartao', 'gas', 'iptu', 'ipva', 'parcela', 'mensalidade', 'diarista', 'pedreiro',
  'encanador', 'eletricista', 'vizinho', 'vizinha', 'trabalho', 'casa', 'escritorio', 'reuniao', 'consulta',
  'cachorro', 'cachorra', 'gato', 'gata', 'pet', 'veterinario', 'cabeleireiro', 'manicure', 'oficina', 'mecanico',
  'loja', 'shopping', 'centro', 'parque', 'praia', 'igreja', 'hospital', 'clinica', 'laboratorio', 'correio',
  'correios', 'cartorio', 'prefeitura', 'suporte', 'operadora', 'seguradora', 'contador', 'contadora', 'advogado',
  'advogada', 'sindico', 'portaria', 'porteiro', 'zelador', 'entregador', 'motorista', 'minha', 'meu', 'sua', 'seu',
  'ele', 'ela', 'eles', 'elas', 'voce', 'vcs', 'gente', 'todos', 'todo', 'toda', 'familia', 'criancas', 'crianca',
  'bebe', 'mim', 'leite', 'calma', 'pressa', 'cuidado', 'lanche', 'rh', 'pessoa', 'moca', 'moco', 'senhor',
  'senhora', 'dona', 'seguro', 'plano', 'curso', 'uber', 'taxi', 'aeroporto', 'rodoviaria', 'feira', 'sacolao',
  'geral', 'grupo', 'colega', 'colegas', 'psicologa', 'psicologo', 'terapeuta', 'nutricionista', 'personal',
  'babá', 'baba', 'sala', 'aula', 'prova', 'cafe', 'almoco', 'jantar', 'noite', 'tarde', 'manha', 'semana',
  'empresa', 'firma', 'aniversario', 'presente', 'deposito', 'casamento', 'festa', 'evento', 'pra', 'pro', 'para',
  'com', 'que', 'sobre', 'mensagem', 'email', 'zap', 'whats', 'filme', 'bolo', 'conserto', 'loja', 'pix', 'bike', 'carro', 'moto', 'um', 'uma', 'uns', 'umas', 'essa', 'esse', 'isso',
])

function capitalizeNames(title: string): string
{
  let t = title
  const f = foldText(t)
  const up = (idx: number) =>
  {
    t = t.slice(0, idx) + t[idx].toUpperCase() + t.slice(idx + 1)
  }
  // nome de pessoa: depois de "com a", "ligar pro", "pagar a", "pix da", "aniversário do"...
  const re = /\b(?:com|pagar|ligar|falar|devo|dar|emprestar|pedir|perguntar|lembrar|responder|visitar|receber|recebi|ganhei|mensagem|email|zap|whats|pix|presente|aniversario)\s+(?:(?:a|o|ao|pr[oa]|para|d[aoe]|com)\s+){0,2}([a-z]{3,})\b/g
  let m: RegExpExecArray | null
  while ((m = re.exec(f)))
  {
    const word = m[1]
    const at = m.index + m[0].length - word.length
    re.lastIndex = at
    if (COMMON_AFTER.has(word) || /(?:ar|er|ir)$/.test(word) || BRANDS[word]) continue
    up(at)
  }
  // marcas e lugares conhecidos
  const bre = /\b([a-z0-9']{2,})\b/g
  const f2 = foldText(t)
  const hits: { idx: number; len: number; text: string }[] = []
  while ((m = bre.exec(f2)))
  {
    const key = m[1].replace(/'/g, '')
    if (BRANDS[key] && m[1].length === t.slice(m.index, m.index + m[1].length).length)
    {
      hits.push({ idx: m.index, len: m[1].length, text: BRANDS[key] })
    }
  }
  for (let i = hits.length - 1; i >= 0; i -= 1)
  {
    const h = hits[i]
    // mantém a posição inicial: se a palavra abre o título, a maiúscula continua certa
    t = t.slice(0, h.idx) + h.text + t.slice(h.idx + h.len)
  }
  return t
}

function stripLead(raw: string, re: RegExp): string
{
  const s = raw.replace(/^\s+/, '')
  const m = re.exec(foldText(s))
  return m && m.index === 0 ? s.slice(m[0].length) : s
}

function stripTail(raw: string, re: RegExp): string
{
  const s = raw.replace(/\s+$/, '')
  const m = re.exec(foldText(s))
  return m ? s.slice(0, m.index) : s
}

const CONNECTORS_RE = /^(?:(?:com|c\/|no|na|nos|nas|em|de|do|da|dos|das|um|uma|uns|umas|o|a|os|as|pro|pra|para|pelo|pela|mais|ja|hoje|so)\s+)+/
const EXPENSE_LEAD_RE = /^(?:(?:eu|hoje|ontem|ja)\s+)*(?:gastei|gastamos|gasto(?:\s+com)?|paguei|pagamos|comprei|compramos|custou|saiu|deu|torrei|transferi|abasteci|almocei|jantei|lanchei|comi|tomei|(?:fiz|mandei|enviei)\s+(?:um\s+)?pix)\b\s*/
const EXPENSE_TAIL_RE = /\s+(?:saiu|custou|deu|foi|custaram|sairam)(?:\s+(?:tudo|so))?\s*$/
const INCOME_LEAD_RE = /^(?:(?:eu|hoje|ontem|ja)\s+)*(?:recebi|recebemos|ganhei|ganhamos|caiu|cairam|entrou|entraram|me pagou|me pagaram|me devolveu|me devolveram|me deu|me deram|me transferiu)\b\s*/
const LEMBRETE_STRIP_RE = /^(?:(?:eu|preciso|tenho que|ei|oi|axel)[\s,]+)?(?:(?:me\s+)?(?:lembr[ae]r?|lembre)(?:\s+de|\s+do|\s+da|\s+que)|me\s+lembr[ae]r?|lembrete|nao\s+(?:esquecer|esquece|esqueca|esquecam|pode esquecer|posso esquecer|deixar)(?:\s+de|\s+do|\s+da)?|me\s+avis[ae]r?(?:\s+de|\s+do|\s+da|\s+que)?)\s*:?\s*/

/** Título quando só sobra o verbo ("abasteci 150"). */
const VERB_TITLES: Record<string, string> = {
  abasteci: 'Combustível',
  almocei: 'Almoço',
  jantei: 'Jantar',
  lanchei: 'Lanche',
  comi: 'Comida',
}

function titleFor(kind: DumpKind, w: Work, s: Signals): string
{
  let t = w.raw
  if (kind === 'tarefa')
  {
    blankPromptFiller(w)
    t = w.raw
  }
  t = t.replace(/\s+/g, ' ').replace(/[!?]+/g, ' ').trim()
  if (kind === 'lembrete')
  {
    const before = t
    t = stripLead(t, LEMBRETE_STRIP_RE)
    if (t !== before) t = stripLead(t, /^(?:o|a|os|as)\s+/)
  }
  else if (kind === 'gasto')
  {
    t = stripLead(t, EXPENSE_LEAD_RE)
    t = stripTail(t, EXPENSE_TAIL_RE)
    t = stripLead(t, CONNECTORS_RE)
  }
  else if (kind === 'receita')
  {
    t = stripLead(t, INCOME_LEAD_RE)
    t = stripLead(t, CONNECTORS_RE)
  }
  else if (kind === 'conta')
  {
    t = t.replace(/\s+/g, ' ')
    if (s.lembrete) t = stripLead(t, LEMBRETE_STRIP_RE)
    if (s.vence) t = stripLead(t, EXPENSE_LEAD_RE)
    t = stripLead(t, /^(?:(?:eu|preciso|tenho que|tenho de|vou)\s+)+/)
    t = stripLead(t, /^(?:(?:um|uma|o|a|do|da|dos|das|de)\s+)+/)
  }
  t = cleanupPromptTitle(t)
  if (t.length < 2) t = ''
  return t ? capitalizeNames(t).slice(0, 200) : ''
}

/** "comprar arroz, feijão e batata" → ["Arroz", "Feijão", "Batata"] */
function checklistFor(title: string): string[]
{
  const f = foldText(title)
  let body: string | null = null
  const colon = /^([^:]{2,40}):\s*(.+)$/.exec(title)
  if (colon) body = colon[2]
  else
  {
    const m = /^(?:comprar|levar|pegar|buscar|separar|trazer|lista(?: de compras)?|mercado|feira|compras)\s+(?:(?:no|na|do|da|de)\s+(?:mercado|feira|padaria)\s*:?\s+)?/.exec(f)
    if (m) body = title.slice(m[0].length)
  }
  if (!body || !/,|\s+e\s+/.test(body)) return []
  const items = body
    .split(/,|\s+e\s+/)
    .map((x) => stripLead(x.trim(), /^(?:o|a|os|as|um|uma|uns|umas)\s+/))
    .map((x) => cleanupPromptTitle(x))
    .filter((x) => x.length >= 2)
    .slice(0, 12)
  return items.length >= 2 ? items : []
}

// ---------------------------------------------------------------------------
// Classificador local
// ---------------------------------------------------------------------------

type Decision = { kind: DumpKind; conf: number; motivo: string; usaValor: boolean }

function q(word: string | null): string
{
  return `'${(word || '').trim()}'`
}

function decide(s: Signals, money: MoneyHit | null, hour: HourHit | null, date: DateRead, contou: boolean): Decision
{
  const d = (kind: DumpKind, conf: number, motivo: string, usaValor = MONEY_KINDS.includes(kind)): Decision =>
    ({ kind, conf, motivo, usaValor })

  if (money)
  {
    const forte = money.forte
    if (s.lembrete)
    {
      if (s.conta || s.vence) return d('conta', 0.7, `começa com ${q(s.lembrete)}, mas tem valor a pagar`)
      return d('lembrete', 0.8, `começa com ${q(s.lembrete)}`, false)
    }
    if (s.expensePix) return d('gasto', 0.85, `tem valor e ${q(s.expensePix)}`)
    if (s.income) return d('receita', forte ? 0.9 : 0.85, `tem valor e ${q(s.income)}`)
    if (s.vence) return d('conta', 0.9, `tem valor e ${q(s.vence)}, ainda vai sair`)
    if (s.expensePast) return d('gasto', 0.9, `tem valor e ${q(s.expensePast)}`)
    if (s.conta) return d('conta', 0.85, `tem valor e ${q(s.conta)}, ainda vai sair`)
    if (s.billNoun && date.iso) return d('conta', 0.75, `conta de ${s.billNoun} com data`)
    if (s.leadVerb && PLAN_VERBS.has(s.leadVerb)) return d('gasto', 0.45, `tem valor, mas começa com ${q(s.leadVerb)}`)
    if (s.gastoNoun) return d('gasto', forte ? 0.85 : 0.8, `valor com ${q(s.gastoNoun)}, parece gasto`)
    if (s.billNoun) return d('conta', 0.55, `valor de ${s.billNoun}, não diz se já pagou`)
    if (forte) return d('gasto', 0.55, 'tem valor, mas não diz se já pagou')
    return d('gasto', 0.45, 'número solto, pode não ser dinheiro')
  }

  const naoValor = hour?.comNumero
    ? 'tem horário, não é valor'
    : date.comNumero
      ? 'tem data, não é valor'
      : contou
        ? 'número é quantidade, não é valor'
        : null

  if (s.lembrete) return d('lembrete', 0.9, `começa com ${q(s.lembrete)}`)
  if (s.meds && hour) return d('lembrete', 0.8, 'remédio com horário vira lembrete')
  if (s.leadVerb === 'pagar' || s.leadVerb === 'quitar') return d('conta', 0.7, `começa com ${q(s.leadVerb)}, sem valor`)
  if (s.leadVerb) return d('tarefa', 0.85, naoValor ?? `começa com ${q(s.leadVerb)}`)
  if (s.vence || s.conta) return d('conta', 0.65, `fala em ${q(s.vence || s.conta)}, sem valor`)
  if (s.income) return d('receita', 0.5, `fala em ${q(s.income)}, sem valor`)
  if (s.expensePast) return d('gasto', 0.5, `fala em ${q(s.expensePast)}, sem valor`)
  if (s.appointment) return d('tarefa', 0.8, naoValor ?? `compromisso: ${q(s.appointment)}`)
  if (hour || date.iso) return d('tarefa', 0.7, naoValor ?? 'tem data ou horário')
  return d('tarefa', 0.5, 'sem verbo, data ou valor, confira')
}

/** Lê uma linha do Dump sem internet (determinístico para o mesmo `ctx.ref`). */
export function classifyDumpLine(linha: string, ctx: DumpContext = {}, index = 0): DumpItem
{
  const ref = ctx.ref ?? new Date()
  const today = localTodayIso(ref)
  const prepped = prepLine(linha)
  const w: Work = { raw: prepped, fold: foldText(prepped) }
  normalizeShortcuts(w)
  const sigFold = w.fold
  const s = readSignals(sigFold, w.raw)

  const hour = extractDumpHour(w)
  const date = extractDumpDate(w, today)
  const moneyContext = Boolean(s.income || s.vence || s.expensePast || s.conta || s.gastoNoun || s.billNoun || s.expensePix)
  const { hit, contou } = extractDumpMoney(w, Boolean(s.expensePast || s.expensePix))
  let money = hit
  // número solto numa tarefa comum ("estudar 3", "ligar pro João 15") não é valor
  if (money && !money.forte && !moneyContext && s.leadVerb && !PLAN_VERBS.has(s.leadVerb) && s.leadVerb !== 'pagar') money = null
  if (money && !money.forte && s.lembrete && !moneyContext) money = null

  const dec = decide(s, money, hour, date, contou)
  if (money && dec.usaValor) blankSpan(w, money.start, money.end)
  if (dec.kind === 'conta')
  {
    cut(w, /\b(?:e\s+|que\s+|q\s+)?(?:vence|vencem|vencendo|vencimento|venc)\b\.?(?:\s+(?:em|no|na|dia|hoje|amanha))?/)
    cut(w, /\b(?:a pagar|em aberto|pendente)\b/)
  }

  const isMoney = MONEY_KINDS.includes(dec.kind)
  let horaMinutos = hour?.min ?? null
  let horaSugerida = hour?.sugerida ?? false
  if (horaMinutos == null && !isMoney)
  {
    const imp = impliedHour(sigFold)
    if (imp != null)
    {
      horaMinutos = imp
      horaSugerida = true
    }
  }
  if (isMoney && horaSugerida)
  {
    horaMinutos = null
    horaSugerida = false
  }

  let titulo = titleFor(dec.kind, w, s)
  if (!titulo)
  {
    titulo = dec.kind === 'lembrete' && s.meds
      ? 'Tomar remédio'
      : (s.expensePast && VERB_TITLES[foldText(s.expensePast)]) || DUMP_KIND_LABELS[dec.kind]
  }

  const checklist = dec.kind === 'tarefa' ? checklistFor(titulo) : []

  let data: string | null = date.iso
  if (!data && dec.kind !== 'tarefa') data = today

  return {
    key: `dump-${index}`,
    linha,
    kind: dec.kind,
    titulo,
    valor: isMoney && money ? money.valor : null,
    categoria: isMoney ? (dec.kind === 'receita' ? 'outros' : dumpCategory(sigFold)) : null,
    data,
    horaMinutos,
    ...(horaSugerida ? { horaSugerida: true } : {}),
    checklist,
    confianca: Math.round(dec.conf * 100) / 100,
    motivo: dec.motivo,
    source: 'local',
  }
}

/** Lê o Dump inteiro, uma leitura por linha. */
export function classifyDump(text: string, ctx: DumpContext = {}): DumpItem[]
{
  return splitDumpLines(text).map((l, i) => classifyDumpLine(l, ctx, i))
}

// ---------------------------------------------------------------------------
// IA: pedido e normalização da resposta (POST /api/axel/classify-dump)
// ---------------------------------------------------------------------------

export type DumpAiRequest = {
  lines: string[]
  today: string
  weekday: string
}

/** Formato que o servidor devolve para cada linha (tudo já validado lá, mas revalidado aqui). */
export type DumpAiItem = {
  linha?: unknown
  kind?: unknown
  titulo?: unknown
  valor?: unknown
  categoria?: unknown
  data?: unknown
  /** "HH:MM" */
  hora?: unknown
  /** alternativa a `hora` (o servidor manda os dois) */
  horaMinutos?: unknown
  checklist?: unknown
  confianca?: unknown
  motivo?: unknown
}

export type DumpAiResponse = {
  items: DumpAiItem[]
  source: 'groq' | 'gemini' | 'local'
  iaDisponivel: boolean
}

const WEEKDAY_LABELS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

export const DUMP_AI_MAX_LINES = 20

/** Monta o pedido para a IA só com as linhas de baixa confiança (ou as informadas). */
export function buildDumpAiRequest(lines: string[], ctx: DumpContext = {}): DumpAiRequest
{
  const today = localTodayIso(ctx.ref ?? new Date())
  return {
    lines: lines.map((l) => String(l).slice(0, 300)).filter(Boolean).slice(0, DUMP_AI_MAX_LINES),
    today,
    weekday: WEEKDAY_LABELS[weekdayOfIso(today)],
  }
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/
const DASH_RE = /\s*[—–]\s*/g

function aiStr(v: unknown, max: number): string
{
  return typeof v === 'string' ? v.replace(DASH_RE, ', ').replace(/−/g, '-').trim().slice(0, max) : ''
}

function aiNum(v: unknown): number | null
{
  if (typeof v === 'string')
  {
    const p = parseBrlNumber(v.replace(/r\$\s*/i, ''))
    return p
  }
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

const AI_CATEGORIES: string[] = ['habitacao', 'alimentacao', 'transporte', 'lazer', 'saude', 'educacao', 'compras', 'outros']

/**
 * Converte um item vindo da IA em DumpItem seguro. Campos inválidos caem na leitura local
 * da mesma linha; se nem o tipo vier certo, devolve a leitura local sem mudanças.
 */
export function normalizeAiDumpItem(raw: unknown, linha: string, ctx: DumpContext = {}, index = 0): DumpItem
{
  const local = classifyDumpLine(linha, ctx, index)
  if (!raw || typeof raw !== 'object') return local
  const r = raw as DumpAiItem
  const kind = typeof r.kind === 'string' && (DUMP_KINDS as string[]).includes(r.kind) ? (r.kind as DumpKind) : null
  if (!kind) return local

  const today = localTodayIso(ctx.ref ?? new Date())
  const isMoney = MONEY_KINDS.includes(kind)

  const tituloRaw = cleanupPromptTitle(aiStr(r.titulo, 200))
  const titulo = tituloRaw.length >= 2 ? tituloRaw : local.titulo

  const v = aiNum(r.valor)
  const valor = isMoney
    ? v != null && v > 0 && v < 10_000_000
      ? Math.round(v * 100) / 100
      : local.valor
    : null

  const cat = aiStr(r.categoria, 40)
  const categoria: FinanceCategory | null = isMoney
    ? AI_CATEGORIES.includes(cat)
      ? cat
      : local.categoria ?? 'outros'
    : null

  const dataRaw = aiStr(r.data, 10)
  const dataOk = ISO_RE.test(dataRaw) && dataRaw >= addDaysIso(today, -60) && dataRaw <= addDaysIso(today, 730)
  let data: string | null = dataOk ? dataRaw : r.data === null ? null : local.data
  if (!data && kind !== 'tarefa') data = today

  const horaM = /^(\d{1,2}):(\d{2})$/.exec(aiStr(r.hora, 5))
  const hmNum = typeof r.horaMinutos === 'number' && Number.isInteger(r.horaMinutos) && r.horaMinutos >= 0 && r.horaMinutos < 1440
    ? r.horaMinutos
    : null
  const horaIa = horaM && Number(horaM[1]) <= 23 && Number(horaM[2]) <= 59 ? Number(horaM[1]) * 60 + Number(horaM[2]) : hmNum
  let horaMinutos = horaIa ?? (r.hora === null ? null : local.horaMinutos)
  if (isMoney && horaIa == null) horaMinutos = null

  const checklist = kind === 'tarefa'
    ? Array.isArray(r.checklist)
      ? r.checklist.map((x) => cleanupPromptTitle(aiStr(x, 120))).filter((x) => x.length >= 2).slice(0, 12)
      : local.checklist
    : []

  const c = aiNum(typeof r.confianca === 'string' ? Number(r.confianca) : r.confianca)
  const confianca = c != null ? Math.max(0, Math.min(1, Math.round(c * 100) / 100)) : 0.75
  const motivo = aiStr(r.motivo, 120) || 'leitura da IA'

  return {
    key: local.key,
    linha,
    kind,
    titulo,
    valor,
    categoria,
    data,
    horaMinutos,
    ...(horaIa == null && horaMinutos != null && local.horaSugerida ? { horaSugerida: true } : {}),
    checklist,
    confianca,
    motivo,
    source: 'ia',
  }
}

/**
 * Junta a leitura local com a resposta da IA: só as linhas de baixa confiança são trocadas,
 * casando pelo texto da linha (ou pela ordem, quando a IA não repete a linha).
 */
export function mergeDumpAi(items: DumpItem[], ai: DumpAiResponse | null, ctx: DumpContext = {}): DumpItem[]
{
  if (!ai || !Array.isArray(ai.items) || ai.items.length === 0) return items
  const low = items.filter((it) => it.confianca < DUMP_LOW_CONFIDENCE && it.source === 'local')
  const byLine = new Map<string, DumpAiItem>()
  for (const x of ai.items)
  {
    if (x && typeof x === 'object' && typeof x.linha === 'string') byLine.set(x.linha.trim(), x)
  }
  return items.map((it) =>
  {
    const pos = low.indexOf(it)
    if (pos < 0) return it
    const raw = byLine.get(it.linha.trim()) ?? (byLine.size === 0 ? ai.items[pos] : undefined)
    if (!raw) return it
    const idx = Number(/^dump-(\d+)$/.exec(it.key)?.[1] ?? 0)
    const next = normalizeAiDumpItem(raw, it.linha, ctx, idx)
    return { ...next, key: it.key }
  })
}
