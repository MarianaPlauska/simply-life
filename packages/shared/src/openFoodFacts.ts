/**
 * Open Food Facts (API v2), só leitura por código de barras.
 * Do produto fica: nome, marca, porção, kcal, proteína e açúcares (por 100 g e por porção).
 * Licença ODbL: toda tela que mostra esse dado cita "Dados: Open Food Facts".
 * Aqui fica só a parte pura (URL, cabeçalho, leitura da resposta); a busca mora no app.
 */
import { foodItemKey } from './foodLog'

export const OFF_ATTRIBUTION = 'Dados: Open Food Facts'
export const OFF_ATTRIBUTION_URL = 'https://world.openfoodfacts.org'
export const OFF_SOURCE = 'openfoodfacts'

/** A API pede um User-Agent com nome do app, plataforma, versão e site. */
export function offUserAgent(platform: string, version = '1.0'): string
{
  return `SimplyLife - ${platform} - Version ${version} - https://simply-life.app`
}

export const OFF_FIELDS = 'product_name,product_name_pt,brands,nutriments,serving_size'

export function offProductUrl(barcode: string): string
{
  return `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${OFF_FIELDS}`
}

/** Só dígitos, 8 a 14 (EAN-8, UPC-A, EAN-13, GTIN-14); senão null. */
export function normalizeBarcode(input: string): string | null
{
  const d = (input || '').replace(/\D/g, '')
  return d.length >= 8 && d.length <= 14 ? d : null
}

export type OffProduct = {
  barcode: string
  nome: string
  key: string
  marca: string | null
  kcal100g: number | null
  /** texto da embalagem ("30 g", "1 copo (200 ml)") */
  porcao: string | null
  /** gramas ou ml da porção, quando dá para ler */
  porcaoGramas: number | null
  kcalPorcao: number | null
  /** gramas de proteína em 100 g e na porção (null quando a embalagem não diz) */
  proteina100g: number | null
  proteinaPorcao: number | null
  /** gramas de açúcares totais em 100 g e na porção */
  acucar100g: number | null
  acucarPorcao: number | null
}

/** Produto do cache já tem os campos de proteína e açúcar (mesmo que nulos)? Cache antigo não tem e é buscado de novo. */
export function offProductHasNutrients(p: Partial<OffProduct> | null | undefined): boolean
{
  return Boolean(p) && 'proteina100g' in (p as object) && 'acucar100g' in (p as object)
}

/** "30 g" → 30 · "1 copo (200 ml)" → 200 · "1 unidade" → null */
export function parseServingGrams(serving: string | null | undefined): number | null
{
  if (!serving) return null
  const all = [...serving.toLowerCase().matchAll(/(\d+(?:[.,]\d+)?)\s*(g|gr|ml|kg|l)\b/g)]
  const m = all[all.length - 1]
  if (!m) return null
  let n = Number(m[1].replace(',', '.'))
  if (!Number.isFinite(n) || n <= 0) return null
  if (m[2] === 'kg' || m[2] === 'l') n *= 1000
  return Math.round(n * 10) / 10
}

function num(v: unknown): number | null
{
  if (v === '' || v == null) return null
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) && n >= 0 ? n : null
}

function grams(v: number | null): number | null
{
  if (v == null) return null
  const c = Math.min(300, v)
  return c < 10 ? Math.round(c * 10) / 10 : Math.round(c)
}

/** Nutriente por 100 g e por porção: usa o valor da porção quando existe, senão calcula pelos gramas. */
function nutrientPair(
  nutr: Record<string, unknown>,
  name: string,
  porcaoGramas: number | null,
): { per100: number | null; perServing: number | null }
{
  const raw100 = num(nutr[`${name}_100g`])
  const per100 = raw100 != null && raw100 <= 100 ? raw100 : null
  const serv = num(nutr[`${name}_serving`])
  const perServing = serv != null
    ? serv
    : per100 != null && porcaoGramas != null
      ? (per100 * porcaoGramas) / 100
      : null
  return { per100: grams(per100), perServing: grams(perServing) }
}

/** Lê a resposta da API; null quando o produto não existe ou veio sem nome. */
export function parseOffResponse(json: unknown, barcode: string): OffProduct | null
{
  if (!json || typeof json !== 'object') return null
  const j = json as { status?: number; product?: Record<string, unknown> }
  if (j.status === 0 || !j.product) return null
  const p = j.product
  const nome = String(p.product_name_pt || p.product_name || '').trim()
  if (!nome) return null
  const nutr = (p.nutriments ?? {}) as Record<string, unknown>
  let kcal100g = num(nutr['energy-kcal_100g'])
  if (kcal100g == null)
  {
    const kj = num(nutr['energy_100g']) ?? num(nutr['energy-kj_100g'])
    if (kj != null) kcal100g = Math.round(kj / 4.184)
  }
  const porcao = typeof p.serving_size === 'string' && p.serving_size.trim() ? p.serving_size.trim() : null
  const porcaoGramas = parseServingGrams(porcao)
  const kcalServ = num(nutr['energy-kcal_serving'])
  const kcalPorcao = kcalServ != null
    ? Math.round(kcalServ)
    : kcal100g != null && porcaoGramas != null
      ? Math.round((kcal100g * porcaoGramas) / 100)
      : null
  const marca = typeof p.brands === 'string' && p.brands.trim() ? p.brands.split(',')[0].trim() : null
  const prot = nutrientPair(nutr, 'proteins', porcaoGramas)
  const acu = nutrientPair(nutr, 'sugars', porcaoGramas)
  return {
    barcode,
    nome,
    key: foodItemKey(nome),
    marca,
    kcal100g: kcal100g != null ? Math.round(kcal100g) : null,
    porcao,
    porcaoGramas,
    kcalPorcao,
    proteina100g: prot.per100,
    proteinaPorcao: prot.perServing,
    acucar100g: acu.per100,
    acucarPorcao: acu.perServing,
  }
}
