/**
 * Comida por texto: "almocei arroz, feijão e frango" vira uma refeição com itens.
 * Mesmo jeito do Dump: leitura local (offline, convidado), a tela mostra o que entendeu
 * antes de salvar. Sem julgamento: só frequência, tendência e quanto custou.
 *
 * Ordem da leitura: horário → dia (ontem) → tipo da refeição → verbos → itens → quantidade.
 * O tipo vem do texto ("almoço", "jantei", "lanche da tarde"); sem isso, do horário.
 */
import { localTodayIso } from './dates'
import { addDaysIso, foldText } from './taskPrompt'

export type FoodMealType = 'cafe_da_manha' | 'almoco' | 'lanche' | 'jantar' | 'ceia'

export const FOOD_MEAL_TYPES: FoodMealType[] = ['cafe_da_manha', 'almoco', 'lanche', 'jantar', 'ceia']

export const FOOD_MEAL_LABELS: Record<FoodMealType, string> = {
  cafe_da_manha: 'Café da manhã',
  almoco: 'Almoço',
  lanche: 'Lanche',
  jantar: 'Jantar',
  ceia: 'Ceia',
}

export type FoodItem = {
  /** chave canônica ("pao queijo" para "pão de queijo", "pães de queijo", "pao queijo") */
  key: string
  /** como aparece na tela ("pão de queijo") */
  nome: string
  /** "2", "1 copo", "200 g"; null quando não disse */
  quantidade: string | null
  kcal?: number | null
  /** de onde veio o dado de caloria: 'pessoal' | 'openfoodfacts' | 'ia' | 'estimativa_local' | 'manual' */
  fonte?: string | null
  barcode?: string | null
  /** porção considerada na estimativa ("1 concha"); só no aparelho, não vai para a nuvem */
  porcao?: string | null
}

export type FoodLogParse = {
  texto: string
  tipo: FoodMealType
  /** true quando o tipo veio do horário, não do texto */
  tipoInferido: boolean
  /** ISO YYYY-MM-DD */
  data: string
  /** minutos desde 00:00: dito no texto ou o "agora" da leitura */
  horaMinutos: number
  horaDita: boolean
  itens: FoodItem[]
}

export type FoodLogContext = {
  /** "agora" da leitura; testes passam uma data fixa */
  ref?: Date
}

/** Refeição salva, no formato mínimo que as contas precisam. */
export type FoodMealLike = {
  data: string
  tipo: FoodMealType
  itens: { key: string; nome: string; kcal?: number | null }[]
}

// ---------------------------------------------------------------------------
// Nomes canônicos
// ---------------------------------------------------------------------------

/** Chave canônica → nome na tela. Também define o que conta como "comida conhecida". */
export const FOOD_LABELS: Record<string, string> = {
  cafe: 'café',
  'cafe com leite': 'café com leite',
  cappuccino: 'cappuccino',
  'pao queijo': 'pão de queijo',
  pao: 'pão',
  'pao com ovo': 'pão com ovo',
  'pao com manteiga': 'pão com manteiga',
  'pao integral': 'pão integral',
  refrigerante: 'refrigerante',
  agua: 'água',
  'agua coco': 'água de coco',
  suco: 'suco',
  'suco laranja': 'suco de laranja',
  cha: 'chá',
  leite: 'leite',
  cerveja: 'cerveja',
  vinho: 'vinho',
  arroz: 'arroz',
  feijao: 'feijão',
  frango: 'frango',
  carne: 'carne',
  bife: 'bife',
  peixe: 'peixe',
  ovo: 'ovo',
  omelete: 'omelete',
  salada: 'salada',
  macarrao: 'macarrão',
  lasanha: 'lasanha',
  strogonoff: 'strogonoff',
  sopa: 'sopa',
  pizza: 'pizza',
  hamburguer: 'hambúrguer',
  'batata frita': 'batata frita',
  batata: 'batata',
  sanduiche: 'sanduíche',
  'misto quente': 'misto quente',
  marmita: 'marmita',
  salgado: 'salgado',
  coxinha: 'coxinha',
  pastel: 'pastel',
  tapioca: 'tapioca',
  cuscuz: 'cuscuz',
  acai: 'açaí',
  iogurte: 'iogurte',
  granola: 'granola',
  aveia: 'aveia',
  fruta: 'fruta',
  banana: 'banana',
  maca: 'maçã',
  mamao: 'mamão',
  queijo: 'queijo',
  presunto: 'presunto',
  biscoito: 'biscoito',
  bolo: 'bolo',
  chocolate: 'chocolate',
  sorvete: 'sorvete',
  brigadeiro: 'brigadeiro',
  doce: 'doce',
  vitamina: 'vitamina',
  'whey protein': 'whey protein',
  sushi: 'sushi',
  // refeições como gasto ("almoço 32", "iFood")
  almoco: 'almoço',
  jantar: 'jantar',
  lanche: 'lanche',
  'cafe manha': 'café da manhã',
  ifood: 'iFood',
  padaria: 'padaria',
  mercado: 'mercado',
  restaurante: 'restaurante',
}

/** Forma base (sem acento, singular, sem "de") → chave canônica. */
const FOOD_SYNONYMS: Record<string, string> = {
  cafezinho: 'cafe',
  'cafe preto': 'cafe',
  'cafe coado': 'cafe',
  'cafe passado': 'cafe',
  'cafe expresso': 'cafe',
  'cafe espresso': 'cafe',
  expresso: 'cafe',
  espresso: 'cafe',
  pingado: 'cafe com leite',
  'cafe leite': 'cafe com leite',
  capuccino: 'cappuccino',
  capuchino: 'cappuccino',
  cappucino: 'cappuccino',
  'paozinho queijo': 'pao queijo',
  'pao queijinho': 'pao queijo',
  paozinho: 'pao',
  'pao frances': 'pao',
  'pao sal': 'pao',
  cacetinho: 'pao',
  carioquinha: 'pao',
  'pao ovo': 'pao com ovo',
  'pao manteiga': 'pao com manteiga',
  refri: 'refrigerante',
  coca: 'refrigerante',
  'coca cola': 'refrigerante',
  cocacola: 'refrigerante',
  'coca zero': 'refrigerante',
  guarana: 'refrigerante',
  pepsi: 'refrigerante',
  fanta: 'refrigerante',
  sprite: 'refrigerante',
  'agua mineral': 'agua',
  'agua gelada': 'agua',
  'agua com gas': 'agua',
  'agua sem gas': 'agua',
  suquinho: 'suco',
  'suco natural': 'suco',
  chazinho: 'cha',
  cerva: 'cerveja',
  breja: 'cerveja',
  chopp: 'cerveja',
  chope: 'cerveja',
  cervejinha: 'cerveja',
  arrozinho: 'arroz',
  'arroz branco': 'arroz',
  feijaozinho: 'feijao',
  'feijao preto': 'feijao',
  'feijao carioca': 'feijao',
  franguinho: 'frango',
  'peito frango': 'frango',
  'file frango': 'frango',
  'frango grelhado': 'frango',
  'frango assado': 'frango',
  'frango frito': 'frango',
  ovinho: 'ovo',
  'ovo mexido': 'ovo',
  'ovo frito': 'ovo',
  'ovo cozido': 'ovo',
  saladinha: 'salada',
  'salada verde': 'salada',
  espaguete: 'macarrao',
  macarronada: 'macarrao',
  massa: 'macarrao',
  estrogonofe: 'strogonoff',
  estrogonoff: 'strogonoff',
  strogonofe: 'strogonoff',
  hamburger: 'hamburguer',
  burger: 'hamburguer',
  burguer: 'hamburguer',
  'x burguer': 'hamburguer',
  xburguer: 'hamburguer',
  'x burger': 'hamburguer',
  frita: 'batata frita',
  batatinha: 'batata',
  'batatinha frita': 'batata frita',
  sanduba: 'sanduiche',
  lanche: 'lanche',
  misto: 'misto quente',
  quentinha: 'marmita',
  marmitex: 'marmita',
  salgadinho: 'salgado',
  acaizinho: 'acai',
  'acai tigela': 'acai',
  yogurt: 'iogurte',
  yogurte: 'iogurte',
  iogurt: 'iogurte',
  bolacha: 'biscoito',
  bolachinha: 'biscoito',
  biscoitinho: 'biscoito',
  bolinho: 'bolo',
  'fatia bolo': 'bolo',
  chocolatinho: 'chocolate',
  sorvetinho: 'sorvete',
  docinho: 'doce',
  whey: 'whey protein',
  'agua de coco': 'agua coco',
  'cafe da manha': 'cafe manha',
  almocinho: 'almoco',
  janta: 'jantar',
  'i food': 'ifood',
  supermercado: 'mercado',
}

/** Palavras que já estão no singular apesar do "s" final. */
const SINGULAR_S = new Set([
  'brocolis', 'lapis', 'onibus', 'atlas', 'tenis', 'gas', 'pires', 'virus', 'bis', 'mais', 'tres',
  'seis', 'dois', 'depois', 'ananas', 'jus', 'mousse', 'nachos', 'chips', 'croissants', 'minas',
  'pos', 'pres', 'cuscus', 'ingles', 'frances', 'portugues', 'japones', 'chines', 'mes',
])

function singularWord(w: string): string
{
  if (w.length <= 3 || SINGULAR_S.has(w)) return w
  if (w.endsWith('aes')) return `${w.slice(0, -3)}ao`
  if (w.endsWith('oes')) return `${w.slice(0, -3)}ao`
  if (w.endsWith('aos')) return w.slice(0, -1)
  if (w.endsWith('ais')) return `${w.slice(0, -2)}l`
  if (w.endsWith('eis')) return `${w.slice(0, -2)}l`
  if (w.endsWith('ois')) return `${w.slice(0, -2)}l`
  if (w.endsWith('uis')) return `${w.slice(0, -2)}l`
  if (w.endsWith('eses')) return w.slice(0, -2)
  if (/[aeiou]res$/.test(w)) return w.slice(0, -2)
  if (w.endsWith('zes')) return w.slice(0, -2)
  if (w.endsWith('ns')) return `${w.slice(0, -2)}m`
  if (/[aeiou]s$/.test(w)) return w.slice(0, -1)
  if (/ts$/.test(w) && w.length > 4) return w.slice(0, -1)
  return w
}

const KEY_DROP = new Set(['de', 'da', 'do', 'das', 'dos', 'd', 'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas'])

function baseForm(name: string): string
{
  const words = foldText(name)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  const out = words
    .filter((w) => !KEY_DROP.has(w))
    .map(singularWord)
  if (out.length > 1) for (let i = 0; i < out.length; i++) out[i] = WORD_MAP[out[i]] ?? out[i]
  return out.join(' ').replace(/\bpao (?:frances|sal)\b/g, 'pao').replace(/^x hamburguer\b/, 'hamburguer')
}

/** Troca palavra por palavra dentro de nomes compostos ("bolacha recheada" → "biscoito recheada"). */
const WORD_MAP: Record<string, string> = {
  bolacha: 'biscoito',
  bolachinha: 'biscoito',
  biscoitinho: 'biscoito',
  cafezinho: 'cafe',
  paozinho: 'pao',
  yogurt: 'iogurte',
  yogurte: 'iogurte',
  iogurt: 'iogurte',
  refri: 'refrigerante',
  hamburger: 'hamburguer',
  burger: 'hamburguer',
  burguer: 'hamburguer',
  acaizinho: 'acai',
  suquinho: 'suco',
  franguinho: 'frango',
  arrozinho: 'arroz',
  feijaozinho: 'feijao',
  estrogonofe: 'strogonoff',
  estrogonoff: 'strogonoff',
}

/** Tira diminutivo de uma palavra só quando o resultado é comida conhecida. */
function undiminish(base: string): string | null
{
  if (base.includes(' ')) return null
  const tries: string[] = []
  const m = /^(.+?)(zinh|quinh|inh)([oa])$/.exec(base)
  if (!m) return null
  if (m[2] === 'zinh') tries.push(m[1])
  if (m[2] === 'quinh') tries.push(`${m[1]}co`, `${m[1]}ca`)
  if (m[2] === 'inh') tries.push(`${m[1]}${m[3]}`, `${m[1]}o`, `${m[1]}a`)
  for (const t of tries)
  {
    const k = FOOD_SYNONYMS[t] ?? t
    if (FOOD_LABELS[k]) return k
  }
  return null
}

/**
 * Chave canônica de um item: sem acento, no singular, sem "de", com sinônimos.
 * "Pães de queijo", "pao queijo" e "pão de queijo" → "pao queijo".
 */
export function foodItemKey(name: string): string
{
  const base = baseForm(name)
  if (!base) return ''
  const direct = FOOD_SYNONYMS[base] ?? base
  if (FOOD_LABELS[direct]) return direct
  return undiminish(base) ?? direct
}

/** A chave é de algo que o app reconhece como comida ou refeição. */
export function isKnownFoodKey(key: string): boolean
{
  return Boolean(FOOD_LABELS[key])
}

/** Nome para a tela: o canônico quando conhecido, senão o que a pessoa escreveu. */
export function foodLabel(key: string, fallback?: string): string
{
  return FOOD_LABELS[key] ?? (fallback?.trim() || key)
}

// ---------------------------------------------------------------------------
// Leitura do texto
// ---------------------------------------------------------------------------

const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}]/gu

type Work = { raw: string; fold: string }

function work(text: string): Work
{
  const raw = (text || '').normalize('NFC').replace(EMOJI_RE, ' ').replace(/\s+/g, ' ').trim()
  const fold = foldText(raw)
  // foldText mantém o tamanho do texto NFC (acentos compostos viram uma letra)
  return fold.length === raw.length ? { raw, fold } : { raw: fold, fold }
}

function cutAt(w: Work, start: number, end: number, filler = ' '): void
{
  w.raw = `${w.raw.slice(0, start)}${filler}${w.raw.slice(end)}`
  w.fold = `${w.fold.slice(0, start)}${filler}${w.fold.slice(end)}`
}

/** Remove a primeira ocorrência; devolve o trecho casado (fold) ou null. */
function take(w: Work, re: RegExp): RegExpExecArray | null
{
  const m = re.exec(w.fold)
  if (!m) return null
  cutAt(w, m.index, m.index + m[0].length, ' , ')
  return m
}

function takeAll(w: Work, re: RegExp): number
{
  let n = 0
  while (take(w, re)) n += 1
  return n
}

/** Apaga (com espaços do mesmo tamanho) todas as ocorrências nos dois lados. */
function blankAll(w: Work, re: RegExp): void
{
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`)
  const hits: [number, number][] = []
  let m: RegExpExecArray | null
  while ((m = g.exec(w.fold)))
  {
    if (!m[0])
    {
      g.lastIndex += 1
      continue
    }
    hits.push([m.index, m.index + m[0].length])
  }
  for (const [a, b] of hits.reverse()) cutAt(w, a, b, ' '.repeat(b - a))
}

const MEAL_PATTERNS: { tipo: FoodMealType; re: RegExp }[] = [
  { tipo: 'cafe_da_manha', re: /\b(?:(?:tomei|tomamos|no|de|pro|para o|meu|o)\s+)?(?:cafe[\s-]+da[\s-]+manha|desjejum|pequeno[\s-]+almoco|brunch)\b/ },
  { tipo: 'almoco', re: /\b(?:(?:no|de|pro|para o|meu|o)\s+)?(?:almoc(?:o|ei|amos|ando)|almocinho)\b/ },
  { tipo: 'jantar', re: /\b(?:(?:no|na|de|pro|meu|minha|o|a)\s+)?(?:jantar|janta|jantei|jantamos|jantando|jantinha)\b/ },
  { tipo: 'ceia', re: /\b(?:(?:na|de|minha|a)\s+)?ceia\b|\bantes de dormir\b|\bde madrugada\b/ },
  { tipo: 'lanche', re: /\b(?:(?:no|de|pro|meu|um|o)\s+)?(?:lanche(?:i|amos)?|lanchinho|merenda|pre[\s-]?treino|pos[\s-]?treino)(?:\s+da\s+(?:tarde|manha|noite))?\b/ },
]

const PERIOD_PATTERNS: { tipo: FoodMealType; re: RegExp }[] = [
  { tipo: 'cafe_da_manha', re: /\b(?:de|pela|na|hoje de|hoje a)\s+manha\b/ },
  { tipo: 'lanche', re: /\b(?:a|de|pela|na|hoje a|hoje de)\s+tarde(?:zinha)?\b/ },
  { tipo: 'jantar', re: /\b(?:a|de|pela|na|hoje a|hoje de)\s+noite\b/ },
]

/** Tipo da refeição pelo horário (minutos desde 00:00). */
export function foodMealTypeFromTime(minutes: number): FoodMealType
{
  const m = ((minutes % 1440) + 1440) % 1440
  if (m < 5 * 60) return 'ceia'
  if (m < 10 * 60 + 30) return 'cafe_da_manha'
  if (m < 15 * 60) return 'almoco'
  if (m < 18 * 60 + 30) return 'lanche'
  if (m < 22 * 60) return 'jantar'
  return 'ceia'
}

/** Horário típico de cada refeição, para quando a pessoa troca o tipo na revisão. */
export const FOOD_MEAL_DEFAULT_MINUTES: Record<FoodMealType, number> = {
  cafe_da_manha: 8 * 60,
  almoco: 12 * 60 + 30,
  lanche: 16 * 60,
  jantar: 20 * 60,
  ceia: 22 * 60 + 30,
}

function extractTime(w: Work): number | null
{
  const re = /\b(?:(?:as|a|pelas|umas|por volta das)\s+)?(\d{1,2})(?:(?::|h)(\d{2})?|\s*horas?)(?:\s*min)?(?:\s+da\s+(manha|tarde|noite|madrugada))?\b/
  let m = re.exec(w.fold)
  let bare = false
  if (!m)
  {
    m = /\b(?:as|pelas|umas|por volta das)\s+(\d{1,2})(?:\s+da\s+(manha|tarde|noite|madrugada))?\b()/.exec(w.fold)
    bare = true
  }
  if (!m) return null
  let h = Number(m[1])
  const min = bare ? 0 : Number(m[2] ?? 0)
  const period = bare ? m[2] : m[3]
  if (!Number.isFinite(h) || h > 23 || min > 59) return null
  if ((period === 'tarde' || period === 'noite') && h < 12) h += 12
  cutAt(w, m.index, m.index + m[0].length)
  return h * 60 + min
}

const FILLER_RE = /\b(?:eu|hoje|agora|agorinha|comi|comemos|comendo|tomei|tomamos|tomando|bebi|bebemos|belisquei|provei|pedi|pedimos|fiz|preparei|foi|teve|era|so|apenas|somente|tipo|de novo|mais uma vez|tambem|ainda|la|aqui|com (?:a|o) \w+|(?:no|na|em|do|da)\s+(?:restaurante|padaria|lanchonete|shopping|trabalho|escritorio|faculdade|escola|mercado|rua|casa|bar|cantina|refeitorio|academia))\b/g

const NUMBER_WORDS: Record<string, string> = {
  um: '1', uma: '1', dois: '2', duas: '2', tres: '3', quatro: '4', cinco: '5', seis: '6',
  sete: '7', oito: '8', nove: '9', dez: '10', meio: 'meio', meia: 'meia',
}

const UNIT_RE = '(?:g|gr|gramas?|kg|ml|l|litros?|copos?|copinhos?|xicaras?|xicrinhas?|fatias?|pedacos?|pedacinhos?|pratos?|colher(?:es)?(?:\\s+de\\s+(?:sopa|cha|sobremesa))?|conchas?|unidades?|un|latas?|latinhas?|garrafas?|porc(?:ao|oes)|bolas?|potes?|potinhos?|tacas?|canecas?|punhados?|tigelas?|cumbucas?|saquinhos?|pacotes?|barras?|barrinhas?|doses?|goles?|cafezinhos?)'

const QTY_RE = new RegExp(
  `^(\\d+(?:[.,]\\d+)?|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|meio|meia)\\s*(${UNIT_RE})?\\b\\s*(?:de\\s+|do\\s+|da\\s+)?`,
)

const UNIT_ONLY_RE = new RegExp(`^(${UNIT_RE})\\s+(?:de|do|da)\\s+`)

function cleanItemText(s: string): string
{
  return s
    .replace(/^[\s:.\-–—,;!?]+|[\s:.\-–—,;!?]+$/g, '')
    .replace(/^(?:(?:e|de|do|da|no|na|com|o|a|os|as|uns|umas|meu|minha|um pouco de|um monte de|bastante)\s+)+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseItem(rawPiece: string): FoodItem | null
{
  let raw = cleanItemText(work(rawPiece).raw)
  let fold = foldText(raw)
  if (fold.length !== raw.length) raw = fold
  let quantidade: string | null = null
  const drop = (a: number, b: number) =>
  {
    raw = `${raw.slice(0, a)} ${raw.slice(b)}`.replace(/\s+/g, ' ').trim()
    fold = foldText(raw)
  }
  // "pizza (2 fatias)"
  const paren = /\(([^)]*)\)/.exec(fold)
  if (paren)
  {
    const inner = raw.slice(paren.index + 1, paren.index + paren[0].length - 1).trim()
    if (/^(?:\d|(?:um|uma|dois|duas|tres|meia|meio)\b)/.test(foldText(inner))) quantidade = inner
    drop(paren.index, paren.index + paren[0].length)
  }
  // valor em reais esquecido no meio ("café 12,50") não é quantidade
  const money = /(?:r\$\s*)?\d+,\d{2}\b|r\$\s*\d+(?:[.,]\d+)?/.exec(fold)
  if (money) drop(money.index, money.index + money[0].length)
  raw = cleanItemText(raw)
  fold = foldText(raw)

  const q = QTY_RE.exec(fold)
  if (q && q[0].length < fold.length)
  {
    const n = NUMBER_WORDS[q[1]] ?? q[1].replace('.', ',')
    const unitAt = q[2] ? fold.indexOf(q[2], q[1].length) : -1
    const unit = q[2] ? raw.slice(unitAt, unitAt + q[2].length) : null
    const isArticle = (q[1] === 'um' || q[1] === 'uma') && !unit
    if (!isArticle) quantidade = unit ? `${n} ${unit}` : n
    raw = raw.slice(q[0].length)
    fold = fold.slice(q[0].length)
  }
  else
  {
    const u = UNIT_ONLY_RE.exec(fold)
    if (u && u[0].length < fold.length)
    {
      quantidade = raw.slice(0, u[1].length)
      raw = raw.slice(u[0].length)
      fold = fold.slice(u[0].length)
    }
  }
  // "pão de queijo x2" / "2x"
  const times = /\s*(?:x\s*(\d+)|(\d+)\s*x)$/.exec(fold)
  if (times && times.index > 0)
  {
    quantidade = quantidade ?? (times[1] ?? times[2])
    raw = raw.slice(0, times.index)
  }
  const nome = cleanItemText(raw).toLowerCase()
  if (!nome || !/[a-z]/.test(foldText(nome))) return null
  const key = foodItemKey(nome)
  if (!key) return null
  return { key, nome, quantidade }
}

/** "arroz, feijão e frango" → ["arroz", "feijão", "frango"]; "pão com ovo" fica junto. */
export function splitFoodItems(text: string): string[]
{
  return (text || '')
    .split(/\s*(?:,|;|:|\+|\/|\n|\s&\s|\be\b|\bmais\b(?!\s+(?:uma|um)\s+vez))\s*/i)
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * "arroz com feijão" vira dois itens quando os dois lados são comida conhecida
 * e o conjunto não é um prato conhecido ("pão com ovo" e "café com leite" ficam juntos).
 */
function splitWithCom(piece: string): string[]
{
  const f = foldText(piece)
  const m = /\scom\s/.exec(f)
  if (!m || f.length !== piece.length) return [piece]
  const whole = parseItem(piece)
  if (whole && isKnownFoodKey(whole.key)) return [piece]
  const a = piece.slice(0, m.index)
  const b = piece.slice(m.index + m[0].length)
  const ia = parseItem(a)
  const ib = parseItem(b)
  if (ia && ib && isKnownFoodKey(ia.key) && isKnownFoodKey(ib.key)) return [a, ...splitWithCom(b)]
  return [piece]
}

/**
 * Lê uma linha de refeição. Sempre devolve um tipo; itens podem vir vazios ("almocei").
 */
export function parseFoodLog(texto: string, ctx: FoodLogContext = {}): FoodLogParse
{
  const ref = ctx.ref ?? new Date()
  const w = work(texto)
  let data = localTodayIso(ref)

  const hora = extractTime(w)

  if (take(w, /\banteontem\b/)) data = addDaysIso(data, -2)
  else if (take(w, /\bontem\b/)) data = addDaysIso(data, -1)

  let tipo: FoodMealType | null = null
  for (const p of MEAL_PATTERNS)
  {
    if (take(w, p.re))
    {
      tipo = tipo ?? p.tipo
      takeAll(w, p.re)
    }
  }
  let periodTipo: FoodMealType | null = null
  for (const p of PERIOD_PATTERNS)
  {
    if (take(w, p.re)) periodTipo = periodTipo ?? p.tipo
  }

  blankAll(w, FILLER_RE)

  const seen = new Set<string>()
  const itens: FoodItem[] = []
  for (const piece of splitFoodItems(w.raw))
  {
    for (const part of splitWithCom(piece))
    {
      const it = parseItem(part)
      if (!it || seen.has(it.key)) continue
      seen.add(it.key)
      itens.push(it)
    }
  }

  const nowMin = ref.getHours() * 60 + ref.getMinutes()
  const tipoInferido = tipo == null && periodTipo == null
  const finalTipo = tipo ?? periodTipo ?? foodMealTypeFromTime(hora ?? nowMin)
  const isToday = data === localTodayIso(ref)
  const nowFits = tipoInferido || foodMealTypeFromTime(nowMin) === finalTipo
  return {
    texto: (texto || '').trim(),
    tipo: finalTipo,
    tipoInferido,
    data,
    horaMinutos: hora ?? (isToday && nowFits ? nowMin : FOOD_MEAL_DEFAULT_MINUTES[finalTipo]),
    horaDita: hora != null,
    itens,
  }
}

// ---------------------------------------------------------------------------
// Frequência
// ---------------------------------------------------------------------------

export type FoodTrend = 'novo' | 'mais' | 'menos' | 'igual'

export const FOOD_TREND_LABELS: Record<FoodTrend, string> = {
  novo: 'Novo neste mês',
  mais: 'Mais vezes que no mês passado',
  menos: 'Menos vezes que no mês passado',
  igual: 'Igual ao mês passado',
}

export type FoodFrequencyRow = {
  key: string
  nome: string
  /** refeições do mês com o item */
  vezes: number
  porRefeicao: Partial<Record<FoodMealType, number>>
  refeicaoMaisComum: FoodMealType | null
  /** mesmo período do mês anterior (até o mesmo dia, se o mês é o atual) */
  mesPassado: number
  tendencia: FoodTrend
}

/** "2026-09" → "2026-08" */
export function previousMonthKey(month: string): string
{
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, (m || 1) - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function countItems(meals: FoodMealLike[], month: string, maxDay: number | null)
{
  const out = new Map<string, { vezes: number; nome: string; por: Partial<Record<FoodMealType, number>> }>()
  for (const meal of meals)
  {
    if (!meal?.data?.startsWith(month)) continue
    if (maxDay != null && Number(meal.data.slice(8, 10)) > maxDay) continue
    const inMeal = new Set<string>()
    for (const it of meal.itens ?? [])
    {
      const key = it.key || foodItemKey(it.nome)
      if (!key || inMeal.has(key)) continue
      inMeal.add(key)
      const cur = out.get(key) ?? { vezes: 0, nome: it.nome, por: {} }
      cur.vezes += 1
      cur.nome = it.nome || cur.nome
      cur.por[meal.tipo] = (cur.por[meal.tipo] ?? 0) + 1
      out.set(key, cur)
    }
  }
  return out
}

/**
 * Quantas refeições do mês tiveram cada item, por tipo de refeição, e a tendência
 * contra o mesmo período do mês passado. Ordem: mais frequente primeiro.
 */
export function foodFrequency(meals: FoodMealLike[], month: string, ctx: FoodLogContext = {}): FoodFrequencyRow[]
{
  const ref = ctx.ref ?? new Date()
  const refMonth = localTodayIso(ref).slice(0, 7)
  const maxDay = month === refMonth ? ref.getDate() : null
  const cur = countItems(meals, month, null)
  const prev = countItems(meals, previousMonthKey(month), maxDay)
  const rows: FoodFrequencyRow[] = []
  for (const [key, c] of cur)
  {
    const mesPassado = prev.get(key)?.vezes ?? 0
    let best: FoodMealType | null = null
    for (const t of FOOD_MEAL_TYPES) if ((c.por[t] ?? 0) > (best ? c.por[best] ?? 0 : 0)) best = t
    rows.push({
      key,
      nome: foodLabel(key, c.nome),
      vezes: c.vezes,
      porRefeicao: c.por,
      refeicaoMaisComum: best,
      mesPassado,
      tendencia: mesPassado === 0 ? 'novo' : c.vezes > mesPassado ? 'mais' : c.vezes < mesPassado ? 'menos' : 'igual',
    })
  }
  return rows.sort((a, b) => b.vezes - a.vezes || a.nome.localeCompare(b.nome))
}

/** Quantas refeições de cada tipo no mês. */
export function foodMealsPerType(meals: FoodMealLike[], month: string): Record<FoodMealType, number>
{
  const out: Record<FoodMealType, number> = { cafe_da_manha: 0, almoco: 0, lanche: 0, jantar: 0, ceia: 0 }
  for (const m of meals) if (m?.data?.startsWith(month) && out[m.tipo] != null) out[m.tipo] += 1
  return out
}

export function foodTimesLabel(n: number): string
{
  return `${n} ${n === 1 ? 'vez' : 'vezes'}`
}

/** "pão de queijo, 12 vezes" */
export function foodFrequencyPhrase(row: Pick<FoodFrequencyRow, 'nome' | 'vezes'>): string
{
  return `${row.nome}, ${foodTimesLabel(row.vezes)}`
}

// ---------------------------------------------------------------------------
// Comida com dinheiro
// ---------------------------------------------------------------------------

export type FoodExpenseLike = {
  titulo: string
  valor: number
  data: string
  tipo?: string
  categoria?: string | null
}

export type FoodItemSpend = {
  key: string
  nome: string
  vezes: number
  total: number
}

const EXPENSE_NOISE_RE = /\b(?:comprei|paguei|gastei|pedi|pedido|compra|comprinha|gasto|um|uma|uns|umas|o|a)\b/g

/** Chave de comida a partir do título de um gasto ("Café 12,50 na padaria" → "cafe"). */
export function foodKeyFromExpenseTitle(titulo: string): string
{
  const s = foldText(titulo || '')
    .replace(/r\$\s*\d+(?:[.,]\d+)*/g, ' ')
    .replace(/\d+(?:[.,]\d+)*\s*(?:ml|l|g|kg|un|x)?\b/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .replace(EXPENSE_NOISE_RE, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const whole = foodItemKey(s)
  if (isKnownFoodKey(whole)) return whole
  const cut = /\s(na|no|nas|nos|em|pra|pro|para|com|do|da)\s/.exec(` ${s} `)
  if (cut && cut.index > 0)
  {
    const beforeKey = foodItemKey(s.slice(0, cut.index))
    if (beforeKey && (isKnownFoodKey(beforeKey) || !/^d[oa]$/.test(cut[1]))) return beforeKey
  }
  return whole
}

/** 214 → "R$ 214" · 214.5 → "R$ 214,50" · 1214 → "R$ 1.214" */
export function formatBrlShort(value: number): string
{
  const v = Math.round((Number.isFinite(value) ? value : 0) * 100) / 100
  const int = Math.trunc(Math.abs(v))
  const cents = Math.round((Math.abs(v) - int) * 100)
  const intStr = String(int).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${v < 0 ? '-' : ''}R$ ${intStr}${cents ? `,${String(cents).padStart(2, '0')}` : ''}`
}

/**
 * Agrupa os gastos do mês pelo item ("café 12,50", "Cafe", "cafezinho" → café).
 * Entra o que é da categoria alimentação ou tem nome de comida conhecida (ou de algo
 * que a pessoa registrou como refeição, via `foodKeys`).
 */
export function spendByItem(
  expenses: FoodExpenseLike[],
  month: string,
  opts: { foodKeys?: Iterable<string> } = {},
): FoodItemSpend[]
{
  const extra = new Set(opts.foodKeys ?? [])
  const out = new Map<string, FoodItemSpend>()
  for (const e of expenses ?? [])
  {
    if (!e || e.tipo === 'receita') continue
    if (!e.data?.startsWith(month)) continue
    const valor = Math.abs(Number(e.valor) || 0)
    if (!valor) continue
    const key = foodKeyFromExpenseTitle(e.titulo)
    if (!key) continue
    if (e.categoria !== 'alimentacao' && !isKnownFoodKey(key) && !extra.has(key)) continue
    const cur = out.get(key) ?? { key, nome: foodLabel(key, (e.titulo || '').replace(/\s*(?:r\$\s*)?\d+(?:[.,]\d+)*\s*/gi, ' ').trim().toLowerCase()), vezes: 0, total: 0 }
    cur.vezes += 1
    cur.total = Math.round((cur.total + valor) * 100) / 100
    out.set(key, cur)
  }
  return [...out.values()].sort((a, b) => b.total - a.total || b.vezes - a.vezes)
}

export type FoodMoneyRow = FoodItemSpend & {
  /** refeições registradas com o item no mês (0 se não registrou) */
  comeuVezes: number
  /** "café: 18 vezes no mês, R$ 214" */
  frase: string
}

/** Junta gasto por item com a frequência das refeições. */
export function combineFoodAndSpend(freq: FoodFrequencyRow[], spend: FoodItemSpend[]): FoodMoneyRow[]
{
  const byKey = new Map(freq.map((f) => [f.key, f]))
  return spend.map((s) => ({
    ...s,
    comeuVezes: byKey.get(s.key)?.vezes ?? 0,
    frase: `${s.nome}: ${foodTimesLabel(s.vezes)} no mês, ${formatBrlShort(s.total)}`,
  }))
}

// ---------------------------------------------------------------------------
// Calorias (opcional, só onde o dado existe)
// ---------------------------------------------------------------------------

export type FoodKcalDay = {
  total: number
  /** itens com caloria conhecida */
  comKcal: number
  semKcal: number
  /** dos itens com caloria, quantos são estimativa (IA ou tabela local) */
  estimadas: number
}

/** Soma as calorias do dia; itens sem dado não contam. `estimadas` diz quantos são aproximados. */
export function foodKcalOfDay(
  meals: { data: string; itens: { kcal?: number | null; fonte?: string | null }[] }[],
  iso: string,
): FoodKcalDay
{
  let total = 0
  let comKcal = 0
  let semKcal = 0
  let estimadas = 0
  for (const m of meals)
  {
    if (m.data !== iso) continue
    for (const it of m.itens ?? [])
    {
      if (typeof it.kcal === 'number' && Number.isFinite(it.kcal) && it.kcal >= 0)
      {
        total += it.kcal
        comKcal += 1
        if (it.fonte === 'ia' || it.fonte === 'estimativa_local') estimadas += 1
      }
      else semKcal += 1
    }
  }
  return { total: Math.round(total), comKcal, semKcal, estimadas }
}

/** 1450 → "1.450 kcal" */
export function formatKcal(kcal: number): string
{
  return `${String(Math.round(kcal)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} kcal`
}
