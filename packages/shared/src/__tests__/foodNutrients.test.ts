import { describe, expect, it } from 'vitest'
import {
  applyFoodKcal,
  clampItemGrams,
  foodSourceLabel,
  formatItemNutrients,
  itemWantsAiKcal,
  normalizeFoodKcalAiResponse,
  pickFoodKcal,
  pickFoodNutrients,
  sanitizeFoodSourceUrls,
  type FoodPersonalKcal,
} from '../foodKcal'
import { foodKcalOfDay, foodNutrientAverages, formatGrams, mealProteinGrams, type FoodItem } from '../foodLog'
import { offProductHasNutrients, parseOffResponse } from '../openFoodFacts'
// servidor (JS puro, sem rede)
// @ts-expect-error módulo JS sem tipos
import * as server from '../../../../api/_lib/foodNutrientsParse.js'

const DASHES = /[—–−]/

const item = (over: Partial<FoodItem> = {}): FoodItem => ({ key: 'pao queijo', nome: 'pão de queijo', quantidade: null, ...over })

describe('Open Food Facts: proteína e açúcar', () =>
{
  it('lê por 100 g e por porção (valor da porção quando existe)', () =>
  {
    const p = parseOffResponse({
      status: 1,
      product: {
        product_name: 'Iogurte natural',
        serving_size: '170 g',
        nutriments: {
          'energy-kcal_100g': 60,
          proteins_100g: 4.2,
          sugars_100g: 5,
          sugars_serving: 8.5,
        },
      },
    }, '7891000000001')!
    expect(p.proteina100g).toBe(4.2)
    // 4.2 × 1.7 = 7.14 → uma casa abaixo de 10 g
    expect(p.proteinaPorcao).toBe(7.1)
    expect(p.acucar100g).toBe(5)
    expect(p.acucarPorcao).toBe(8.5)
    expect(offProductHasNutrients(p)).toBe(true)
  })

  it('fica nulo quando a embalagem não diz, e descarta valor impossível por 100 g', () =>
  {
    const p = parseOffResponse({
      status: 1,
      product: { product_name: 'Biscoito', nutriments: { 'energy-kcal_100g': 480, proteins_100g: '', sugars_100g: 140 } },
    }, '7891000000002')!
    expect(p.proteina100g).toBeNull()
    expect(p.proteinaPorcao).toBeNull()
    expect(p.acucar100g).toBeNull()
  })

  it('reconhece cache antigo sem os campos novos', () =>
  {
    expect(offProductHasNutrients({ barcode: '1', nome: 'x', kcal100g: 100 } as never)).toBe(false)
    expect(offProductHasNutrients(null)).toBe(false)
  })
})

describe('pickFoodNutrients', () =>
{
  const personal: FoodPersonalKcal = { kcal: 100, proteina: 3, acucar: 1, porcao: '1 unidade', updatedAt: '2026-01-01' }

  it('escolhe kcal, proteína e açúcar juntos, da mesma fonte', () =>
  {
    const pick = pickFoodNutrients(item(), {
      personal,
      ai: { kcal: 90, proteina: 2, acucar: 0.5, porcao: '1 unidade', confianca: 0.8 },
    })!
    expect(pick).toMatchObject({ kcal: 100, proteina: 3, acucar: 1, fonte: 'pessoal' })
  })

  it('não mistura: fonte melhor sem proteína deixa proteína nula', () =>
  {
    const pick = pickFoodNutrients(item({ kcal: 120, fonte: 'manual' }), {
      ai: { kcal: 90, proteina: 2, acucar: 0.5, porcao: null, confianca: 0.8 },
    })!
    expect(pick.fonte).toBe('manual')
    expect(pick.proteina).toBeNull()
  })

  it('fonte sem caloria não concorre; IA vence a tabela local e leva os links', () =>
  {
    const pick = pickFoodNutrients(item(), {
      personal: null,
      ai: { kcal: 95, proteina: 2.4, acucar: 0.6, porcao: '1 unidade', confianca: 0.7, fontes: ['https://exemplo.com/a', 'ftp://x'] },
      local: { kcal: 90, porcao: '1 unidade média', confianca: 0.55 },
    })!
    expect(pick).toMatchObject({ kcal: 95, proteina: 2.4, acucar: 0.6, fonte: 'ia', fontes: ['https://exemplo.com/a'] })
    expect(pickFoodKcal).toBe(pickFoodNutrients)
  })

  it('applyFoodKcal preenche os três e devolve o mesmo objeto quando nada muda', () =>
  {
    const [a] = applyFoodKcal([item()], { personal: { 'pao queijo': personal } })
    expect(a).toMatchObject({ kcal: 100, proteina: 3, acucar: 1, fonte: 'pessoal' })
    const [b] = applyFoodKcal([a], { personal: { 'pao queijo': personal } })
    expect(b).toBe(a)
  })

  it('estimativa antiga da IA sem proteína pede a IA de novo; nula não', () =>
  {
    expect(itemWantsAiKcal({ kcal: 90, fonte: 'ia' })).toBe(true)
    expect(itemWantsAiKcal({ kcal: 90, fonte: 'ia', proteina: null, acucar: null })).toBe(false)
    expect(itemWantsAiKcal({ kcal: 90, fonte: 'manual' })).toBe(false)
  })

  it('limita gramas e links', () =>
  {
    expect(clampItemGrams('18,46')).toBe(18)
    expect(clampItemGrams(4.56)).toBe(4.6)
    expect(clampItemGrams(900)).toBe(300)
    expect(clampItemGrams(-1)).toBeNull()
    expect(clampItemGrams(null)).toBeNull()
    expect(sanitizeFoodSourceUrls(['https://a.com', 'https://a.com', 'javascript:alert(1)', 'http://b.com', 'https://c.com'])).toEqual(['https://a.com', 'http://b.com'])
  })
})

describe('formatação', () =>
{
  it('linha do item sem travessão, com ≈ na estimativa', () =>
  {
    const s = formatItemNutrients({ kcal: 320, proteina: 18, acucar: 4, fonte: 'ia' })!
    expect(s).toBe('≈ 320 kcal · 18 g prot · 4 g açúcar')
    expect(s).not.toMatch(DASHES)
    expect(formatItemNutrients({ kcal: 120, proteina: null, acucar: 2.5, fonte: 'manual' })).toBe('120 kcal · 2,5 g açúcar')
    expect(formatItemNutrients({ kcal: null, fonte: null })).toBeNull()
    expect(formatGrams(4.5)).toBe('4,5 g')
  })

  it('rótulo da fonte', () =>
  {
    expect(foodSourceLabel({ fonte: 'ia', fontes: ['https://a.com'] })).toBe('pesquisa na web')
    expect(foodSourceLabel({ fonte: 'ia', fontes: null })).toBe('estimativa da IA')
    expect(foodSourceLabel({ fonte: 'pessoal' })).toBe('tabela pessoal')
    expect(foodSourceLabel({ fonte: 'openfoodfacts' })).toBe('Open Food Facts')
  })
})

describe('resposta da IA no app', () =>
{
  it('lê proteína, açúcar e fontes; servidor antigo (só kcal) continua valendo', () =>
  {
    const out = normalizeFoodKcalAiResponse({
      iaDisponivel: true,
      items: [
        { kcal: 450, proteina: 25, acucar: 2, porcao: '1 concha cheia', confianca: 0.7, fontes: ['https://x.com/feijoada'], extra: 1 } as never,
        { kcal: 90, porcao: '1 unidade', confianca: 0.6 },
      ],
    }, 2)
    expect(out[0]).toMatchObject({ kcal: 450, proteina: 25, acucar: 2, fontes: ['https://x.com/feijoada'] })
    expect(out[1]).toMatchObject({ kcal: 90, proteina: null, acucar: null })
    expect(out[1]!.fontes).toBeUndefined()
  })
})

describe('totais e médias', () =>
{
  const meals = [
    { data: '2026-10-02', itens: [{ kcal: 300, proteina: 20, acucar: 5, fonte: 'ia' }, { kcal: null }] },
    { data: '2026-10-02', itens: [{ kcal: 200, proteina: 10, acucar: null, fonte: 'manual' }] },
    { data: '2026-10-01', itens: [{ kcal: 1000, proteina: null, acucar: 30, fonte: 'manual' }] },
    // fora da janela de 7 dias
    { data: '2026-09-20', itens: [{ kcal: 5000, proteina: 200, acucar: 200, fonte: 'manual' }] },
  ]

  it('soma o dia com proteína e açúcar', () =>
  {
    const d = foodKcalOfDay(meals, '2026-10-02')
    expect(d).toMatchObject({ total: 500, comKcal: 2, semKcal: 1, estimadas: 1, proteina: 30, comProteina: 2, acucar: 5, comAcucar: 1 })
  })

  it('média só entre dias com refeição e com o dado', () =>
  {
    const a = foodNutrientAverages(meals, '2026-10-02', 7)
    expect(a.janela).toBe(7)
    expect(a.diasComRefeicao).toBe(2)
    expect(a.kcal).toEqual({ media: 750, dias: 2 })
    expect(a.proteina).toEqual({ media: 30, dias: 1 })
    expect(a.acucar).toEqual({ media: 18, dias: 2 })
    expect(a.temEstimativa).toBe(true)
    const m30 = foodNutrientAverages(meals, '2026-10-02', 30)
    expect(m30.diasComRefeicao).toBe(3)
    expect(foodNutrientAverages([], '2026-10-02', 7).kcal).toEqual({ media: null, dias: 0 })
  })

  it('proteína de uma refeição', () =>
  {
    expect(mealProteinGrams({ itens: [{ proteina: 12.5 }, { proteina: null }, {}, { proteina: 6 }] })).toBe(19)
  })
})

describe('servidor: texto do Gemini com pesquisa', () =>
{
  const body = {
    candidates: [{
      content: {
        parts: [
          { text: 'Aqui está a estimativa:\n```json\n{"items": [{"nome": "pão de queijo", "kcal": 95.4, "proteina": "2,46 g", "acucar": 0.4, "porcao": "1 unidade — média", "confianca": 0.8},' },
          { text: ' {"nome": "feijoada", "kcal": 9000, "proteina": 999, "acucar": -3, "porcao": "1 concha", "confianca": 2},]}\n```' },
        ],
      },
      groundingMetadata: {
        groundingChunks: [
          { web: { uri: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AAA', title: 'tabela.com.br' } },
          { web: { uri: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/BBB', title: 'receitas.com' } },
          { web: { uri: 'javascript:alert(1)', title: 'x' } },
        ],
        groundingSupports: [
          { segment: { text: '"nome": "feijoada", "kcal": 9000' }, groundingChunkIndices: [1] },
        ],
      },
    }],
  }

  it('acha o JSON no meio do texto, com cerca, partes e vírgula sobrando', () =>
  {
    const { parsed, fontesPorItem } = server.parseGroundedGeminiResponse(body, ['pão de queijo', 'feijoada'])
    expect(parsed.items).toHaveLength(2)
    // feijoada: link do trecho que fala dela; pão de queijo: links gerais
    expect(fontesPorItem[1]).toEqual(['https://vertexaisearch.cloud.google.com/grounding-api-redirect/BBB'])
    expect(fontesPorItem[0]).toHaveLength(2)
    const items = server.normalizeFoodNutrientsAi(parsed, 2, fontesPorItem)
    expect(items[0]).toMatchObject({ kcal: 95, proteina: 2.5, acucar: 0.4, confianca: 0.8 })
    expect(items[0].porcao).not.toMatch(DASHES)
    expect(items[1]).toMatchObject({ kcal: 3000, proteina: 300, acucar: null, confianca: 1 })
    expect(items[1].fontes).toEqual(['https://vertexaisearch.cloud.google.com/grounding-api-redirect/BBB'])
  })

  it('texto sem JSON ou resposta vazia não quebra', () =>
  {
    expect(server.extractJsonFromText('não sei')).toBeNull()
    const { parsed, fontesPorItem } = server.parseGroundedGeminiResponse({}, ['x'])
    expect(parsed).toBeNull()
    expect(fontesPorItem).toEqual([[]])
    const items = server.normalizeFoodNutrientsAi(parsed, 1)
    expect(items[0]).toEqual({ kcal: null, proteina: null, acucar: null, porcao: null, confianca: 0 })
  })

  it('item desconhecido fica nulo e sem fontes', () =>
  {
    const items = server.normalizeFoodNutrientsAi({ items: [{ kcal: null, proteina: 5 }] }, 1, [['https://a.com']])
    expect(items[0]).toEqual({ kcal: null, proteina: null, acucar: null, porcao: null, confianca: 0 })
  })
})
