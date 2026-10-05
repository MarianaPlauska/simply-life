/**
 * Calorias, proteína e açúcar por item da Comida, só quando a pessoa liga "Mostrar calorias e nutrientes".
 * Os três números saem sempre juntos da mesma fonte.
 *
 * De onde vem o número (ordem de prioridade ao preencher):
 *   1. o que a pessoa digitou neste item ('manual')
 *   2. o valor que ela já corrigiu antes para o mesmo item ('pessoal')
 *   3. código de barras ('openfoodfacts')
 *   4. estimativa da IA ('ia')
 *   5. tabela local pequena ('estimativa_local'), para convidado, offline ou IA fora
 *
 * A tabela local é feita de valores redondos de porções caseiras típicas, escritos à mão
 * como referência aproximada. Não é tabela oficial (nada de TACO/TBCA): tudo que sai daqui
 * aparece na tela como estimativa ("≈ 320 kcal").
 */
import { foodItemKey, type FoodItem, type FoodMealType } from './foodLog'
import { foldText } from './taskPrompt'

export type FoodKcalSource = 'pessoal' | 'openfoodfacts' | 'ia' | 'estimativa_local' | 'manual'

export const FOOD_KCAL_SOURCES: FoodKcalSource[] = ['pessoal', 'openfoodfacts', 'ia', 'estimativa_local', 'manual']

/** Maior vence. Fonte desconhecida num item antigo conta como dado conhecido (igual ao código de barras). */
const SOURCE_RANK: Record<FoodKcalSource, number> = {
  manual: 5,
  pessoal: 4,
  openfoodfacts: 3,
  ia: 2,
  estimativa_local: 1,
}

export const FOOD_KCAL_MAX_ITEM = 3000
export const FOOD_KCAL_AI_MAX_ITEMS = 20

/** Estimativas aparecem com "≈" e o rótulo "estimativa". */
export function isEstimatedKcalSource(fonte: string | null | undefined): boolean
{
  return fonte === 'ia' || fonte === 'estimativa_local'
}

/** 320 → "≈ 320 kcal" quando estimado, "320 kcal" quando é dado da pessoa ou da embalagem. */
export function formatItemKcal(kcal: number, fonte: string | null | undefined): string
{
  const n = String(Math.round(kcal)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${isEstimatedKcalSource(fonte) ? '≈ ' : ''}${n} kcal`
}

export function clampItemKcal(v: unknown): number | null
{
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : typeof v === 'number' ? v : NaN
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(Math.min(FOOD_KCAL_MAX_ITEM, n))
}

/** Teto de proteína e de açúcar por item, em gramas (igual ao CHECK da migração 077). */
export const FOOD_GRAMS_MAX_ITEM = 300

/** Gramas de proteína ou açúcar: 0 a 300, uma casa abaixo de 10 g, inteiro acima. null quando não é número. */
export function clampItemGrams(v: unknown): number | null
{
  if (v == null || v === '') return null
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : typeof v === 'number' ? v : NaN
  if (!Number.isFinite(n) || n < 0) return null
  const c = Math.min(FOOD_GRAMS_MAX_ITEM, n)
  return c < 10 ? Math.round(c * 10) / 10 : Math.round(c)
}

/** Só links http(s) curtos, sem repetir, até 2. */
export function sanitizeFoodSourceUrls(v: unknown): string[]
{
  if (!Array.isArray(v)) return []
  const out: string[] = []
  for (const raw of v)
  {
    if (typeof raw !== 'string') continue
    const u = raw.trim()
    if (u.length > 500 || !/^https?:\/\/[^\s]+$/i.test(u)) continue
    if (!out.includes(u)) out.push(u)
    if (out.length >= 2) break
  }
  return out
}

function fmtGrams(g: number): string
{
  const r = g < 10 ? Math.round(g * 10) / 10 : Math.round(g)
  return `${String(r).replace('.', ',')} g`
}

/**
 * Linha curta do item: "≈ 320 kcal · 18 g prot · 4 g açúcar".
 * Só entra o que existe; null quando não há nenhum número.
 */
export function formatItemNutrients(it: Pick<FoodItem, 'kcal' | 'proteina' | 'acucar' | 'fonte'>): string | null
{
  const parts: string[] = []
  if (typeof it.kcal === 'number' && Number.isFinite(it.kcal)) parts.push(formatItemKcal(it.kcal, it.fonte))
  else if (isEstimatedKcalSource(it.fonte)) parts.push('≈')
  if (typeof it.proteina === 'number' && Number.isFinite(it.proteina)) parts.push(`${fmtGrams(it.proteina)} prot`)
  if (typeof it.acucar === 'number' && Number.isFinite(it.acucar)) parts.push(`${fmtGrams(it.acucar)} açúcar`)
  if (!parts.length || (parts.length === 1 && parts[0] === '≈')) return null
  if (parts[0] === '≈') return `≈ ${parts.slice(1).join(' · ')}`
  return parts.join(' · ')
}

/** De onde vieram os números, em palavras ("pesquisa na web", "Open Food Facts"). null sem fonte. */
export function foodSourceLabel(it: Pick<FoodItem, 'fonte' | 'fontes'>): string | null
{
  switch (it.fonte)
  {
    case 'manual':
      return 'você'
    case 'pessoal':
      return 'tabela pessoal'
    case 'openfoodfacts':
      return 'Open Food Facts'
    case 'ia':
      return it.fontes && it.fontes.length ? 'pesquisa na web' : 'estimativa da IA'
    case 'estimativa_local':
      return 'tabela do app'
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Tabela local (valores aproximados e redondos, porções caseiras)
// ---------------------------------------------------------------------------

type LocalFood = {
  nome: string
  /** kcal da porção típica */
  kcal: number
  porcao: string
  /** gramas ou ml da porção, para quando a pessoa diz "200 g" */
  gramas?: number
}

const LOCAL_FOODS: LocalFood[] = [
  // base do prato
  { nome: 'arroz', kcal: 200, porcao: '4 colheres de sopa', gramas: 150 },
  { nome: 'arroz integral', kcal: 180, porcao: '4 colheres de sopa', gramas: 150 },
  { nome: 'feijão', kcal: 140, porcao: '1 concha', gramas: 140 },
  { nome: 'feijoada', kcal: 450, porcao: '1 concha cheia', gramas: 250 },
  { nome: 'feijão tropeiro', kcal: 350, porcao: '1 concha', gramas: 150 },
  { nome: 'macarrão', kcal: 300, porcao: '1 prato raso', gramas: 200 },
  { nome: 'miojo', kcal: 380, porcao: '1 pacote', gramas: 85 },
  { nome: 'lasanha', kcal: 450, porcao: '1 pedaço', gramas: 250 },
  { nome: 'strogonoff', kcal: 350, porcao: '1 concha', gramas: 200 },
  { nome: 'sopa', kcal: 200, porcao: '1 prato fundo', gramas: 350 },
  { nome: 'risoto', kcal: 400, porcao: '1 prato raso', gramas: 250 },
  { nome: 'purê', kcal: 180, porcao: '3 colheres de sopa', gramas: 150 },
  { nome: 'farofa', kcal: 200, porcao: '2 colheres de sopa', gramas: 50 },
  { nome: 'mandioca', kcal: 200, porcao: '2 pedaços', gramas: 150 },
  { nome: 'polenta', kcal: 150, porcao: '2 pedaços', gramas: 150 },
  { nome: 'batata', kcal: 120, porcao: '1 unidade média', gramas: 150 },
  { nome: 'batata doce', kcal: 130, porcao: '1 unidade média', gramas: 150 },
  { nome: 'batata frita', kcal: 350, porcao: '1 porção média', gramas: 120 },
  { nome: 'salada', kcal: 30, porcao: '1 prato de sobremesa' },
  { nome: 'legumes', kcal: 60, porcao: '1 porção', gramas: 120 },
  { nome: 'brócolis', kcal: 30, porcao: '1 xícara', gramas: 90 },
  // proteínas
  { nome: 'frango', kcal: 250, porcao: '1 filé médio', gramas: 150 },
  { nome: 'carne', kcal: 300, porcao: '1 pedaço médio', gramas: 150 },
  { nome: 'bife', kcal: 280, porcao: '1 bife médio', gramas: 120 },
  { nome: 'carne moída', kcal: 250, porcao: '4 colheres de sopa', gramas: 120 },
  { nome: 'linguiça', kcal: 250, porcao: '1 gomo', gramas: 80 },
  { nome: 'peixe', kcal: 200, porcao: '1 filé', gramas: 150 },
  { nome: 'ovo', kcal: 80, porcao: '1 unidade', gramas: 50 },
  { nome: 'omelete', kcal: 220, porcao: '1 omelete de 2 ovos', gramas: 120 },
  { nome: 'queijo', kcal: 80, porcao: '1 fatia', gramas: 20 },
  { nome: 'presunto', kcal: 30, porcao: '1 fatia', gramas: 15 },
  { nome: 'whey protein', kcal: 120, porcao: '1 dose', gramas: 30 },
  // pães e café da manhã
  { nome: 'pão', kcal: 150, porcao: '1 pão francês', gramas: 50 },
  { nome: 'pão integral', kcal: 70, porcao: '1 fatia', gramas: 25 },
  { nome: 'pão com ovo', kcal: 250, porcao: '1 unidade' },
  { nome: 'pão com manteiga', kcal: 200, porcao: '1 unidade' },
  { nome: 'pão de queijo', kcal: 90, porcao: '1 unidade média', gramas: 30 },
  { nome: 'torrada', kcal: 40, porcao: '1 unidade', gramas: 10 },
  { nome: 'tapioca', kcal: 250, porcao: '1 unidade média' },
  { nome: 'crepioca', kcal: 200, porcao: '1 unidade' },
  { nome: 'cuscuz', kcal: 200, porcao: '1 pedaço médio', gramas: 150 },
  { nome: 'panqueca', kcal: 250, porcao: '1 unidade' },
  { nome: 'manteiga', kcal: 35, porcao: '1 colher de chá', gramas: 5 },
  { nome: 'requeijão', kcal: 50, porcao: '1 colher de sopa', gramas: 20 },
  { nome: 'iogurte', kcal: 120, porcao: '1 pote', gramas: 170 },
  { nome: 'granola', kcal: 130, porcao: '2 colheres de sopa', gramas: 30 },
  { nome: 'aveia', kcal: 110, porcao: '3 colheres de sopa', gramas: 30 },
  { nome: 'mingau', kcal: 250, porcao: '1 tigela', gramas: 250 },
  { nome: 'barra de cereal', kcal: 90, porcao: '1 unidade', gramas: 25 },
  // frutas
  { nome: 'fruta', kcal: 70, porcao: '1 porção' },
  { nome: 'banana', kcal: 90, porcao: '1 unidade', gramas: 100 },
  { nome: 'maçã', kcal: 80, porcao: '1 unidade', gramas: 150 },
  { nome: 'mamão', kcal: 60, porcao: '1 fatia', gramas: 150 },
  { nome: 'laranja', kcal: 70, porcao: '1 unidade', gramas: 150 },
  { nome: 'uva', kcal: 70, porcao: '1 cacho pequeno', gramas: 100 },
  { nome: 'melancia', kcal: 50, porcao: '1 fatia', gramas: 200 },
  { nome: 'abacate', kcal: 160, porcao: '3 colheres de sopa', gramas: 100 },
  { nome: 'açaí', kcal: 450, porcao: '1 tigela média', gramas: 300 },
  // bebidas
  { nome: 'café', kcal: 5, porcao: '1 xícara', gramas: 60 },
  { nome: 'café com leite', kcal: 80, porcao: '1 xícara', gramas: 150 },
  { nome: 'cappuccino', kcal: 120, porcao: '1 xícara', gramas: 200 },
  { nome: 'leite', kcal: 120, porcao: '1 copo', gramas: 200 },
  { nome: 'achocolatado', kcal: 180, porcao: '1 copo', gramas: 250 },
  { nome: 'chá', kcal: 2, porcao: '1 xícara', gramas: 200 },
  { nome: 'água', kcal: 0, porcao: '1 copo', gramas: 250 },
  { nome: 'água de coco', kcal: 60, porcao: '1 copo', gramas: 300 },
  { nome: 'suco', kcal: 110, porcao: '1 copo', gramas: 250 },
  { nome: 'suco de laranja', kcal: 110, porcao: '1 copo', gramas: 250 },
  { nome: 'caldo de cana', kcal: 250, porcao: '1 copo', gramas: 300 },
  { nome: 'vitamina', kcal: 250, porcao: '1 copo', gramas: 300 },
  { nome: 'refrigerante', kcal: 140, porcao: '1 lata', gramas: 350 },
  { nome: 'energético', kcal: 110, porcao: '1 lata', gramas: 250 },
  { nome: 'cerveja', kcal: 150, porcao: '1 lata', gramas: 350 },
  { nome: 'vinho', kcal: 125, porcao: '1 taça', gramas: 150 },
  { nome: 'caipirinha', kcal: 250, porcao: '1 copo' },
  // lanches e pratos prontos
  { nome: 'pizza', kcal: 280, porcao: '1 fatia', gramas: 110 },
  { nome: 'hambúrguer', kcal: 500, porcao: '1 unidade' },
  { nome: 'cachorro quente', kcal: 350, porcao: '1 unidade' },
  { nome: 'sanduíche', kcal: 350, porcao: '1 unidade' },
  { nome: 'misto quente', kcal: 300, porcao: '1 unidade' },
  { nome: 'salgado', kcal: 250, porcao: '1 unidade' },
  { nome: 'coxinha', kcal: 250, porcao: '1 unidade' },
  { nome: 'pastel', kcal: 300, porcao: '1 unidade' },
  { nome: 'esfiha', kcal: 200, porcao: '1 unidade' },
  { nome: 'empada', kcal: 250, porcao: '1 unidade' },
  { nome: 'quibe', kcal: 250, porcao: '1 unidade' },
  { nome: 'sushi', kcal: 400, porcao: '10 peças' },
  { nome: 'marmita', kcal: 650, porcao: '1 marmita' },
  { nome: 'prato feito', kcal: 650, porcao: '1 prato' },
  { nome: 'pipoca', kcal: 150, porcao: '1 saquinho', gramas: 35 },
  { nome: 'amendoim', kcal: 170, porcao: '1 punhado', gramas: 30 },
  { nome: 'castanha', kcal: 180, porcao: '1 punhado', gramas: 30 },
  // doces
  { nome: 'biscoito', kcal: 130, porcao: '4 unidades', gramas: 30 },
  { nome: 'bolo', kcal: 250, porcao: '1 fatia', gramas: 80 },
  { nome: 'chocolate', kcal: 140, porcao: '1 barrinha', gramas: 25 },
  { nome: 'sorvete', kcal: 200, porcao: '2 bolas', gramas: 100 },
  { nome: 'brigadeiro', kcal: 100, porcao: '1 unidade', gramas: 20 },
  { nome: 'pudim', kcal: 250, porcao: '1 fatia', gramas: 100 },
  { nome: 'gelatina', kcal: 70, porcao: '1 pote' },
  { nome: 'doce', kcal: 150, porcao: '1 porção' },
  // refeição inteira escrita como item ("almoço 32")
  { nome: 'café da manhã', kcal: 350, porcao: '1 refeição' },
  { nome: 'almoço', kcal: 650, porcao: '1 prato' },
  { nome: 'jantar', kcal: 600, porcao: '1 prato' },
  { nome: 'lanche', kcal: 300, porcao: '1 lanche' },
]

let tableByKey: Map<string, LocalFood> | null = null

function localTable(): Map<string, LocalFood>
{
  if (!tableByKey)
  {
    tableByKey = new Map()
    for (const f of LOCAL_FOODS)
    {
      const k = foodItemKey(f.nome)
      if (k && !tableByKey.has(k)) tableByKey.set(k, f)
    }
  }
  return tableByKey
}

/** Quantos itens a tabela local conhece (para teste e para a tela de ajuda). */
export function localFoodTableSize(): number
{
  return localTable().size
}

function findLocal(key: string): { food: LocalFood; exact: boolean } | null
{
  const table = localTable()
  const exact = table.get(key)
  if (exact) return { food: exact, exact: true }
  const words = key.split(' ')
  // "suco uva" → suco · "biscoito recheada" → biscoito · "frango molho" → frango
  for (let n = words.length - 1; n >= 1; n--)
  {
    const hit = table.get(words.slice(0, n).join(' '))
    if (hit) return { food: hit, exact: false }
  }
  return null
}

type Amount = { mult: number } | { gramas: number }

const MASS_UNIT_RE = /^(g|gr|gramas?|kg|ml|l|litros?)$/

/** "2" → ×2 · "meia" → ×0,5 · "200 g" → 200 g · "1 copo" → ×1 · "meio copo" → ×0,5 */
function readAmount(quantidade: string | null | undefined): Amount | null
{
  const q = foldText(quantidade || '').trim()
  if (!q) return null
  const m = /^(\d+(?:[.,]\d+)?|meia|meio)\s*([a-z]+)?/.exec(q)
  if (!m) return null
  const n = m[1] === 'meia' || m[1] === 'meio' ? 0.5 : Number(m[1].replace(',', '.'))
  if (!Number.isFinite(n) || n <= 0) return null
  const unit = m[2] ?? ''
  if (MASS_UNIT_RE.test(unit))
  {
    const g = unit === 'kg' || unit === 'l' || unit.startsWith('litro') ? n * 1000 : n
    return { gramas: g }
  }
  return { mult: Math.min(20, n) }
}

function roundEstimate(kcal: number): number
{
  const v = Math.max(0, Math.min(FOOD_KCAL_MAX_ITEM, kcal))
  return v < 20 ? Math.round(v) : Math.round(v / 5) * 5
}

export type FoodKcalCandidate = {
  kcal: number
  /** gramas de proteína na quantidade dita; null/ausente quando não se sabe */
  proteina?: number | null
  /** gramas de açúcares totais na quantidade dita; null/ausente quando não se sabe */
  acucar?: number | null
  /** porção considerada ("1 concha", "200 g") */
  porcao: string | null
  /** 0 a 1 */
  confianca: number
  /** links da pesquisa na web, quando a IA usou */
  fontes?: string[]
}

/**
 * Estimativa local de um item, pela porção dita ou pela porção caseira típica.
 * null quando o item não está na tabela.
 */
export function estimateFoodKcalLocal(item: { nome: string; key?: string; quantidade?: string | null }): FoodKcalCandidate | null
{
  const key = item.key || foodItemKey(item.nome)
  if (!key) return null
  const found = findLocal(key)
  if (!found) return null
  const { food, exact } = found
  let kcal = food.kcal
  let porcao = food.porcao
  let conf = exact ? 0.55 : 0.35
  const amount = readAmount(item.quantidade)
  if (amount && 'gramas' in amount)
  {
    if (food.gramas)
    {
      kcal = (food.kcal * amount.gramas) / food.gramas
      porcao = (item.quantidade ?? '').trim()
      conf += 0.1
    }
  }
  else if (amount)
  {
    kcal = food.kcal * amount.mult
    porcao = (item.quantidade ?? '').trim() || porcao
    if (/^\d+(?:[.,]\d+)?$|^mei[ao]$/.test(foldText(porcao)))
    {
      porcao = amount.mult === 1
        ? food.porcao
        : amount.mult === 0.5
          ? `meia porção (${food.porcao})`
          : `${porcao} porções (${food.porcao} cada)`
    }
  }
  return { kcal: roundEstimate(kcal), porcao, confianca: Math.round(conf * 100) / 100 }
}

// ---------------------------------------------------------------------------
// Valores pessoais e a escolha final
// ---------------------------------------------------------------------------

/** O que a pessoa já corrigiu (ou leu no código de barras) para um item, por item_key. */
export type FoodPersonalKcal = {
  kcal: number
  /** gramas; ausente em valores antigos (antes da migração 077) */
  proteina?: number | null
  acucar?: number | null
  porcao: string | null
  updatedAt: string
}

/** Kcal, proteína e açúcar escolhidos juntos, da mesma fonte. */
export type FoodNutrientPick = {
  kcal: number
  proteina: number | null
  acucar: number | null
  fonte: FoodKcalSource
  porcao: string | null
  fontes: string[] | null
}

/** Nome antigo, mantido para quem só olha a caloria. */
export type FoodKcalPick = FoodNutrientPick

function rankOf(fonte: string | null | undefined): number
{
  if (fonte && fonte in SOURCE_RANK) return SOURCE_RANK[fonte as FoodKcalSource]
  // item antigo sem fonte conhecida: trata como dado da embalagem
  return SOURCE_RANK.openfoodfacts
}

type NutrientSource = {
  kcal?: number | null
  proteina?: number | null
  acucar?: number | null
  porcao?: string | null
  fontes?: string[] | null
}

/**
 * Escolhe kcal, proteína e açúcar do item, sempre os três da mesma fonte (a caloria manda:
 * fonte sem caloria não concorre). O que já está no item concorre com os candidatos pela
 * prioridade: manual > pessoal > código de barras > IA > tabela local.
 */
export function pickFoodNutrients(
  item: Pick<FoodItem, 'kcal' | 'fonte'> & { proteina?: number | null; acucar?: number | null; porcao?: string | null; fontes?: string[] | null },
  c: { personal?: FoodPersonalKcal | null; ai?: FoodKcalCandidate | null; local?: FoodKcalCandidate | null },
): FoodNutrientPick | null
{
  let best: (FoodNutrientPick & { rank: number }) | null = null
  const consider = (src: NutrientSource | null | undefined, fonte: FoodKcalSource, rank: number) =>
  {
    const kcal = clampItemKcal(src?.kcal)
    if (kcal == null) return
    // estável: em empate fica o que já estava no item (vem primeiro)
    if (best && rank <= best.rank) return
    const fontes = sanitizeFoodSourceUrls(src?.fontes)
    best = {
      kcal,
      proteina: clampItemGrams(src?.proteina),
      acucar: clampItemGrams(src?.acucar),
      fonte,
      porcao: src?.porcao ?? null,
      fontes: fontes.length ? fontes : null,
      rank,
    }
  }
  const ownFonte = (item.fonte && item.fonte in SOURCE_RANK ? item.fonte : 'openfoodfacts') as FoodKcalSource
  consider(item, ownFonte, rankOf(item.fonte))
  consider(c.personal, 'pessoal', SOURCE_RANK.pessoal)
  consider(c.ai, 'ia', SOURCE_RANK.ia)
  consider(c.local, 'estimativa_local', SOURCE_RANK.estimativa_local)
  if (!best) return null
  const b = best as FoodNutrientPick & { rank: number }
  return { kcal: b.kcal, proteina: b.proteina, acucar: b.acucar, fonte: b.fonte, porcao: b.porcao, fontes: b.fontes }
}

/** Compatível com o nome antigo; devolve também proteína e açúcar. */
export const pickFoodKcal = pickFoodNutrients

function sameNumber(a: number | null | undefined, b: number | null | undefined): boolean
{
  return (a ?? null) === (b ?? null)
}

function sameList(a: string[] | null | undefined, b: string[] | null | undefined): boolean
{
  const x = a ?? []
  const y = b ?? []
  return x.length === y.length && x.every((v, i) => v === y[i])
}

/**
 * Preenche kcal/proteína/açúcar/fonte/porção dos itens. `ai` vem alinhado pelo índice (null onde
 * a IA não soube). A tabela local entra sozinha quando nada melhor existe.
 * Item que não muda volta como o mesmo objeto (dá para comparar por referência).
 */
export function applyFoodKcal<T extends FoodItem>(
  items: T[],
  opts: {
    personal?: Record<string, FoodPersonalKcal | undefined>
    ai?: (FoodKcalCandidate | null | undefined)[]
    useLocal?: boolean
  } = {},
): T[]
{
  return items.map((it, i) =>
  {
    const pick = pickFoodNutrients(it, {
      personal: opts.personal?.[it.key] ?? null,
      ai: opts.ai?.[i] ?? null,
      local: opts.useLocal === false ? null : estimateFoodKcalLocal(it),
    })
    if (!pick) return it
    if (
      pick.kcal === it.kcal
      && pick.fonte === it.fonte
      && sameNumber(pick.proteina, it.proteina)
      && sameNumber(pick.acucar, it.acucar)
      && sameList(pick.fontes, it.fontes)
    ) return it
    return {
      ...it,
      kcal: pick.kcal,
      proteina: pick.proteina,
      acucar: pick.acucar,
      fonte: pick.fonte,
      fontes: pick.fontes,
      porcao: pick.porcao ?? it.porcao ?? null,
    }
  })
}

/**
 * O item ainda pode melhorar com a IA: sem dado, só com a tabela local, ou uma estimativa
 * antiga da IA feita antes de existir proteína e açúcar (campos ausentes, não nulos).
 */
export function itemWantsAiKcal(it: Pick<FoodItem, 'kcal' | 'fonte'> & { proteina?: number | null; acucar?: number | null }): boolean
{
  if (clampItemKcal(it.kcal) == null || it.fonte === 'estimativa_local') return true
  return it.fonte === 'ia' && it.proteina === undefined && it.acucar === undefined
}

// ---------------------------------------------------------------------------
// Pedido e resposta da IA (POST /api/axel/estimate-food-kcal)
// ---------------------------------------------------------------------------

export type FoodKcalAiRequest = {
  tipo: FoodMealType
  items: { nome: string; quantidade: string | null }[]
}

export type FoodKcalAiResponse = {
  items?: { kcal?: unknown; proteina?: unknown; acucar?: unknown; porcao?: unknown; confianca?: unknown; fontes?: unknown }[]
  source?: string
  iaDisponivel?: boolean
}

export function buildFoodKcalAiRequest(
  items: { nome: string; quantidade?: string | null }[],
  tipo: FoodMealType,
): FoodKcalAiRequest
{
  return {
    tipo,
    items: items.slice(0, FOOD_KCAL_AI_MAX_ITEMS).map((i) => ({
      nome: String(i.nome || '').trim().slice(0, 80),
      quantidade: i.quantidade ? String(i.quantidade).trim().slice(0, 40) : null,
    })),
  }
}

/** Resposta da IA → candidatos alinhados pelo índice do pedido (null onde não veio nada útil). */
export function normalizeFoodKcalAiResponse(json: FoodKcalAiResponse | null | undefined, n: number): (FoodKcalCandidate | null)[]
{
  const out: (FoodKcalCandidate | null)[] = Array.from({ length: n }, () => null)
  if (!json?.iaDisponivel || !Array.isArray(json.items)) return out
  for (let i = 0; i < Math.min(n, json.items.length); i++)
  {
    const r = json.items[i]
    const kcal = clampItemKcal(r?.kcal)
    if (kcal == null) continue
    const conf = Number(r?.confianca)
    const porcao = typeof r?.porcao === 'string' ? r.porcao.replace(/[—–−]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40) : ''
    const fontes = sanitizeFoodSourceUrls(r?.fontes)
    out[i] = {
      kcal,
      // servidor antigo não manda: fica null (a IA respondeu, só não soube)
      proteina: clampItemGrams(r?.proteina),
      acucar: clampItemGrams(r?.acucar),
      porcao: porcao || null,
      confianca: Number.isFinite(conf) ? Math.max(0, Math.min(1, conf)) : 0.5,
      ...(fontes.length ? { fontes } : {}),
    }
  }
  return out
}
