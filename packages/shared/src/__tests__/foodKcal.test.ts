import { describe, expect, it } from 'vitest'
import {
  applyFoodKcal,
  buildFoodKcalAiRequest,
  clampItemKcal,
  estimateFoodKcalLocal,
  formatItemKcal,
  isEstimatedKcalSource,
  itemWantsAiKcal,
  localFoodTableSize,
  normalizeFoodKcalAiResponse,
  pickFoodKcal,
  type FoodPersonalKcal,
} from '../foodKcal'
import { foodItemKey, parseFoodLog, type FoodItem } from '../foodLog'

const DASHES = /[—–−]/

const COMMON = [
  'arroz', 'feijão', 'frango', 'ovo', 'pão francês', 'pão de queijo', 'café', 'café com leite', 'banana', 'maçã',
  'macarrão', 'carne moída', 'bife', 'salada', 'tapioca', 'cuscuz', 'açaí', 'refrigerante', 'suco', 'cerveja',
  'coxinha', 'pizza', 'iogurte', 'cafezinho', 'coca', 'pães de queijo', 'feijoada', 'batata doce',
]

describe('estimateFoodKcalLocal', () =>
{
  it('tem por volta de 80 itens e conhece os comuns', () =>
  {
    expect(localFoodTableSize()).toBeGreaterThanOrEqual(80)
    for (const nome of COMMON)
    {
      const est = estimateFoodKcalLocal({ nome, quantidade: null })
      expect(est, nome).not.toBeNull()
      expect(est!.kcal).toBeGreaterThanOrEqual(0)
      expect(est!.kcal).toBeLessThanOrEqual(3000)
      expect(est!.porcao).toBeTruthy()
      expect(est!.porcao!).not.toMatch(DASHES)
      expect(est!.confianca).toBeGreaterThan(0)
      expect(est!.confianca).toBeLessThanOrEqual(1)
    }
  })

  it('usa a porção caseira típica quando não disse quantidade', () =>
  {
    const arroz = estimateFoodKcalLocal({ nome: 'arroz', quantidade: null })!
    expect(arroz.kcal).toBe(200)
    expect(arroz.porcao).toBe('4 colheres de sopa')
    expect(estimateFoodKcalLocal({ nome: 'café', quantidade: null })!.kcal).toBeLessThan(20)
  })

  it('multiplica pela contagem e escala por gramas', () =>
  {
    const ovo1 = estimateFoodKcalLocal({ nome: 'ovo', quantidade: null })!.kcal
    const ovo2 = estimateFoodKcalLocal({ nome: 'ovo', quantidade: '2' })!
    expect(ovo2.kcal).toBe(ovo1 * 2)
    expect(ovo2.porcao).toContain('2')
    const frango = estimateFoodKcalLocal({ nome: 'frango', quantidade: '300 g' })!
    const frangoBase = estimateFoodKcalLocal({ nome: 'frango', quantidade: null })!
    expect(frango.kcal).toBe(frangoBase.kcal * 2)
    expect(frango.porcao).toBe('300 g')
    expect(estimateFoodKcalLocal({ nome: 'refrigerante', quantidade: '1 l' })!.kcal).toBe(400)
    const meia = estimateFoodKcalLocal({ nome: 'pizza', quantidade: 'meia' })!
    expect(meia.kcal).toBe(140)
    expect(estimateFoodKcalLocal({ nome: 'pão de queijo', quantidade: '2 unidades' })!.kcal).toBe(180)
  })

  it('cai no item base para variações e devolve null para o desconhecido', () =>
  {
    const uva = estimateFoodKcalLocal({ nome: 'suco de uva', quantidade: null })!
    expect(uva.kcal).toBe(estimateFoodKcalLocal({ nome: 'suco', quantidade: null })!.kcal)
    expect(uva.confianca).toBeLessThan(estimateFoodKcalLocal({ nome: 'suco', quantidade: null })!.confianca)
    expect(estimateFoodKcalLocal({ nome: 'xyzabc', quantidade: null })).toBeNull()
  })

  it('funciona direto com o que o parser lê', () =>
  {
    const p = parseFoodLog('almocei arroz, feijão e 2 ovos', { ref: new Date(2026, 8, 28, 13) })
    const itens = applyFoodKcal(p.itens)
    expect(itens.every((i) => typeof i.kcal === 'number' && i.fonte === 'estimativa_local')).toBe(true)
    expect(itens.find((i) => i.key === 'ovo')!.kcal).toBe(160)
  })
})

describe('prioridade', () =>
{
  const personal: FoodPersonalKcal = { kcal: 310, porcao: '1 prato', updatedAt: '2026-09-28T12:00:00Z' }
  const ai = { kcal: 250, porcao: '1 escumadeira', confianca: 0.7 }
  const local = { kcal: 200, porcao: '4 colheres de sopa', confianca: 0.5 }

  it('pessoal > código de barras > IA > local', () =>
  {
    expect(pickFoodKcal({}, { personal, ai, local })).toEqual({ kcal: 310, proteina: null, acucar: null, fonte: 'pessoal', porcao: '1 prato', fontes: null })
    expect(pickFoodKcal({ kcal: 180, fonte: 'openfoodfacts' }, { personal, ai, local })!.fonte).toBe('pessoal')
    expect(pickFoodKcal({ kcal: 180, fonte: 'openfoodfacts' }, { ai, local })).toMatchObject({ kcal: 180, fonte: 'openfoodfacts' })
    expect(pickFoodKcal({}, { ai, local })).toMatchObject({ kcal: 250, fonte: 'ia' })
    expect(pickFoodKcal({}, { local })).toMatchObject({ kcal: 200, fonte: 'estimativa_local' })
    expect(pickFoodKcal({}, {})).toBeNull()
  })

  it('o que a pessoa digitou no item fica acima de tudo', () =>
  {
    expect(pickFoodKcal({ kcal: 999, fonte: 'manual' }, { personal, ai, local })).toMatchObject({ kcal: 999, fonte: 'manual' })
  })

  it('IA substitui a estimativa local já salva, mas não um valor pessoal', () =>
  {
    expect(pickFoodKcal({ kcal: 200, fonte: 'estimativa_local' }, { ai })).toMatchObject({ kcal: 250, fonte: 'ia' })
    expect(pickFoodKcal({ kcal: 310, fonte: 'pessoal' }, { ai, local })).toMatchObject({ kcal: 310, fonte: 'pessoal' })
    expect(itemWantsAiKcal({ kcal: 200, fonte: 'estimativa_local' })).toBe(true)
    // estimativa da IA de antes de proteína e açúcar (campos ausentes) pede de novo
    expect(itemWantsAiKcal({ kcal: 250, fonte: 'ia' })).toBe(true)
    expect(itemWantsAiKcal({ kcal: 250, fonte: 'ia', proteina: 12, acucar: null })).toBe(false)
    expect(itemWantsAiKcal({})).toBe(true)
  })

  it('applyFoodKcal usa o pessoal pela chave e a IA pelo índice', () =>
  {
    const itens: FoodItem[] = [
      { key: 'arroz', nome: 'arroz', quantidade: null },
      { key: 'feijao', nome: 'feijão', quantidade: null },
      { key: 'xyz', nome: 'xyz', quantidade: null },
    ]
    const out = applyFoodKcal(itens, { personal: { arroz: personal }, ai: [ai, null, { kcal: 90, porcao: null, confianca: 0.3 }] })
    expect(out[0]).toMatchObject({ kcal: 310, fonte: 'pessoal' })
    expect(out[1]).toMatchObject({ fonte: 'estimativa_local' })
    expect(out[2]).toMatchObject({ kcal: 90, fonte: 'ia' })
    expect(applyFoodKcal(itens, { useLocal: false })[0].kcal).toBeUndefined()
  })
})

describe('IA e formato', () =>
{
  it('limita o pedido a 20 itens', () =>
  {
    const req = buildFoodKcalAiRequest(Array.from({ length: 30 }, (_, i) => ({ nome: `item ${i}`, quantidade: null })), 'almoco')
    expect(req.items).toHaveLength(20)
    expect(req.tipo).toBe('almoco')
  })

  it('valida e limita a resposta', () =>
  {
    const out = normalizeFoodKcalAiResponse({
      iaDisponivel: true,
      items: [
        { kcal: 320.4, porcao: '1 prato raso', confianca: 0.8 },
        { kcal: 99999, porcao: '1 balde', confianca: 3 },
        { kcal: -5 },
        { kcal: 'abc' },
      ],
    }, 5)
    expect(out[0]).toEqual({ kcal: 320, proteina: null, acucar: null, porcao: '1 prato raso', confianca: 0.8 })
    expect(out[1]).toEqual({ kcal: 3000, proteina: null, acucar: null, porcao: '1 balde', confianca: 1 })
    expect(out[2]).toBeNull()
    expect(out[3]).toBeNull()
    expect(out[4]).toBeNull()
    expect(normalizeFoodKcalAiResponse({ iaDisponivel: false, items: [{ kcal: 10 }] }, 1)).toEqual([null])
    expect(clampItemKcal('120,6')).toBe(121)
  })

  it('estimativa com ≈, dado da pessoa sem', () =>
  {
    expect(formatItemKcal(320, 'ia')).toBe('≈ 320 kcal')
    expect(formatItemKcal(1450, 'estimativa_local')).toBe('≈ 1.450 kcal')
    expect(formatItemKcal(320, 'manual')).toBe('320 kcal')
    expect(formatItemKcal(320, 'pessoal')).toBe('320 kcal')
    expect(isEstimatedKcalSource('openfoodfacts')).toBe(false)
    expect(foodItemKey('pão de queijo')).toBe('pao queijo')
  })
})
