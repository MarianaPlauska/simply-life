/**
 * Busca de produto no Open Food Facts pelo código de barras, com cache no aparelho.
 * Regras da API: só leitura, poucos pedidos (um por leitura), User-Agent com nome do app.
 * No navegador o User-Agent é do próprio navegador (cabeçalho protegido); no app vai o nosso.
 */
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import {
  normalizeBarcode,
  offProductUrl,
  offUserAgent,
  parseOffResponse,
  type OffProduct,
} from '@simply-life/shared'
import { useFoodLogStore } from '../store/foodLogStore'

export type OffLookup =
  | { ok: true; product: OffProduct; fromCache: boolean }
  | { ok: false; reason: 'codigo' | 'nao_encontrado' | 'rede' }

/** Cache vale 30 dias; depois busca de novo (a base é colaborativa e muda). */
const CACHE_MS = 30 * 24 * 60 * 60 * 1000

export async function lookupBarcode(input: string): Promise<OffLookup>
{
  const barcode = normalizeBarcode(input)
  if (!barcode) return { ok: false, reason: 'codigo' }
  const cached = useFoodLogStore.getState().offCache[barcode]
  if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < CACHE_MS)
  {
    return { ok: true, product: cached, fromCache: true }
  }
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = ctrl ? setTimeout(() => ctrl.abort(), 9000) : null
  try
  {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (Platform.OS !== 'web')
    {
      headers['User-Agent'] = offUserAgent(Platform.OS === 'ios' ? 'iOS' : 'Android', Constants.expoConfig?.version ?? '1.0')
    }
    const res = await fetch(offProductUrl(barcode), { headers, signal: ctrl?.signal })
    if (res.status === 404) return { ok: false, reason: 'nao_encontrado' }
    if (!res.ok) return cached ? { ok: true, product: cached, fromCache: true } : { ok: false, reason: 'rede' }
    const product = parseOffResponse(await res.json(), barcode)
    if (!product) return { ok: false, reason: 'nao_encontrado' }
    useFoodLogStore.getState().cacheProduct(product)
    return { ok: true, product, fromCache: false }
  }
  catch
  {
    return cached ? { ok: true, product: cached, fromCache: true } : { ok: false, reason: 'rede' }
  }
  finally
  {
    if (timer) clearTimeout(timer)
  }
}
