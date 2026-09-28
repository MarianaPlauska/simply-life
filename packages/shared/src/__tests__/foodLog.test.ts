import {
  combineFoodAndSpend,
  foodFrequency,
  foodFrequencyPhrase,
  foodItemKey,
  foodKcalOfDay,
  foodKeyFromExpenseTitle,
  foodMealTypeFromTime,
  foodMealsPerType,
  formatBrlShort,
  formatKcal,
  parseFoodLog,
  previousMonthKey,
  spendByItem,
  type FoodMealLike,
  type FoodMealType,
} from '../foodLog'
import { normalizeBarcode, parseOffResponse, parseServingGrams } from '../openFoodFacts'

/** segunda, 28 set 2026, 13:00 (horário local) */
const REF = new Date(2026, 8, 28, 13, 0, 0)
const ctx = { ref: REF }
const DASHES = /[—–−]/

type Case = {
  linha: string
  tipo: FoodMealType
  /** chaves canônicas, na ordem */
  itens: string[]
  inferido?: boolean
  qtd?: Record<string, string | null>
  data?: string
  hora?: string
}

const CASES: Case[] = [
  // pedidos do plano
  { linha: 'almocei arroz, feijão e frango', tipo: 'almoco', itens: ['arroz', 'feijao', 'frango'] },
  { linha: 'café da manhã: pão com ovo e café', tipo: 'cafe_da_manha', itens: ['pao com ovo', 'cafe'] },
  { linha: 'lanche pão de queijo', tipo: 'lanche', itens: ['pao queijo'] },
  // café da manhã
  { linha: 'Café da manhã: tapioca com queijo e café preto', tipo: 'cafe_da_manha', itens: ['tapioca', 'queijo', 'cafe'] },
  { linha: 'no café da manhã comi 2 ovos mexidos e uma banana', tipo: 'cafe_da_manha', itens: ['ovo', 'banana'], qtd: { ovo: '2', banana: null } },
  { linha: 'tomei café da manhã: pão francês com manteiga e café com leite', tipo: 'cafe_da_manha', itens: ['pao com manteiga', 'cafe com leite'] },
  { linha: 'cafe da manha iogurte com granola', tipo: 'cafe_da_manha', itens: ['iogurte', 'granola'] },
  { linha: 'desjejum: mamão e aveia', tipo: 'cafe_da_manha', itens: ['mamao', 'aveia'] },
  { linha: 'de manhã comi pão de queijo', tipo: 'cafe_da_manha', itens: ['pao queijo'] },
  { linha: 'hoje de manhã tomei um cafezinho', tipo: 'cafe_da_manha', itens: ['cafe'] },
  { linha: 'café da manhã: cuscuz com ovo', tipo: 'cafe_da_manha', itens: ['cuscuz', 'ovo'] },
  { linha: 'Café da manhã - vitamina de banana', tipo: 'cafe_da_manha', itens: ['vitamina banana'] },
  { linha: 'CAFÉ DA MANHÃ: PÃO E CAFÉ', tipo: 'cafe_da_manha', itens: ['pao', 'cafe'] },
  { linha: 'café da manhã 2 fatias de pão integral e suco de laranja', tipo: 'cafe_da_manha', itens: ['pao integral', 'suco laranja'], qtd: { 'pao integral': '2 fatias' } },
  // almoço
  { linha: 'almoço: arroz, feijão, bife e salada', tipo: 'almoco', itens: ['arroz', 'feijao', 'bife', 'salada'] },
  { linha: 'no almoço comi macarrão', tipo: 'almoco', itens: ['macarrao'] },
  { linha: 'almocei marmita', tipo: 'almoco', itens: ['marmita'] },
  { linha: 'almoço com a Ana: lasanha e refri', tipo: 'almoco', itens: ['lasanha', 'refrigerante'] },
  { linha: 'hoje o almoço foi strogonoff com arroz', tipo: 'almoco', itens: ['strogonoff', 'arroz'] },
  { linha: 'almocei arroz com feijão e frango grelhado', tipo: 'almoco', itens: ['arroz', 'feijao', 'frango'] },
  { linha: 'almoço: peixe, arroz e salada verde', tipo: 'almoco', itens: ['peixe', 'arroz', 'salada'] },
  { linha: 'almocei no restaurante: feijoada', tipo: 'almoco', itens: ['feijoada'] },
  { linha: 'almoço sushi', tipo: 'almoco', itens: ['sushi'] },
  { linha: 'almocei 200g de frango e batata doce', tipo: 'almoco', itens: ['frango', 'batata doce'], qtd: { frango: '200 g' } },
  { linha: 'almoço: um prato de sopa', tipo: 'almoco', itens: ['sopa'], qtd: { sopa: '1 prato' } },
  { linha: 'ontem almocei pizza', tipo: 'almoco', itens: ['pizza'], data: '2026-09-27', hora: '12:30' },
  { linha: 'almocei às 14h30 arroz e ovo', tipo: 'almoco', itens: ['arroz', 'ovo'], hora: '14:30' },
  // lanche
  { linha: 'lanche da tarde: bolo e café', tipo: 'lanche', itens: ['bolo', 'cafe'] },
  { linha: 'lanchei um pão de queijo e um suco', tipo: 'lanche', itens: ['pao queijo', 'suco'] },
  { linha: 'lanche: 2 pães de queijo e cafezinho', tipo: 'lanche', itens: ['pao queijo', 'cafe'], qtd: { 'pao queijo': '2' } },
  { linha: 'lanche pao queijo', tipo: 'lanche', itens: ['pao queijo'] },
  { linha: 'à tarde comi uma coxinha', tipo: 'lanche', itens: ['coxinha'] },
  { linha: 'lanche: açaí', tipo: 'lanche', itens: ['acai'] },
  { linha: 'pré treino: banana com aveia', tipo: 'lanche', itens: ['banana', 'aveia'] },
  { linha: 'pós treino whey', tipo: 'lanche', itens: ['whey protein'] },
  { linha: 'lanchinho: biscoito e chá', tipo: 'lanche', itens: ['biscoito', 'cha'] },
  { linha: 'lanche bolacha recheada', tipo: 'lanche', itens: ['biscoito recheada'] },
  { linha: 'merenda: maçã', tipo: 'lanche', itens: ['maca'] },
  { linha: 'lanche: misto quente e suco natural', tipo: 'lanche', itens: ['misto quente', 'suco'] },
  { linha: 'lanche pastel + caldo de cana', tipo: 'lanche', itens: ['pastel', 'caldo cana'] },
  // jantar
  { linha: 'jantei pizza (2 fatias) e refrigerante', tipo: 'jantar', itens: ['pizza', 'refrigerante'], qtd: { pizza: '2 fatias' } },
  { linha: 'jantar: sopa de legumes', tipo: 'jantar', itens: ['sopa legume'] },
  { linha: 'janta: arroz, feijão e ovo frito', tipo: 'jantar', itens: ['arroz', 'feijao', 'ovo'] },
  { linha: 'jantei hambúrguer com batata frita', tipo: 'jantar', itens: ['hamburguer', 'batata frita'] },
  { linha: 'à noite comi omelete', tipo: 'jantar', itens: ['omelete'] },
  { linha: 'jantar com a família: churrasco e cerveja', tipo: 'jantar', itens: ['churrasco', 'cerveja'] },
  { linha: 'jantamos lasanha e vinho', tipo: 'jantar', itens: ['lasanha', 'vinho'] },
  { linha: 'jantei ontem sanduíche natural', tipo: 'jantar', itens: ['sanduiche natural'], data: '2026-09-27' },
  { linha: 'janta às 20h: tapioca', tipo: 'jantar', itens: ['tapioca'], hora: '20:00' },
  { linha: 'jantar x-burguer e coca', tipo: 'jantar', itens: ['hamburguer', 'refrigerante'] },
  { linha: 'jantei 3 fatias de pizza', tipo: 'jantar', itens: ['pizza'], qtd: { pizza: '3 fatias' } },
  // ceia
  { linha: 'ceia: chá e bolacha', tipo: 'ceia', itens: ['cha', 'biscoito'] },
  { linha: 'antes de dormir um copo de leite', tipo: 'ceia', itens: ['leite'], qtd: { leite: '1 copo' } },
  { linha: 'de madrugada comi chocolate', tipo: 'ceia', itens: ['chocolate'] },
  // sem tipo: vem do horário
  { linha: 'comi arroz e feijão', tipo: 'almoco', itens: ['arroz', 'feijao'], inferido: true, hora: '13:00' },
  { linha: 'às 8h pão com manteiga', tipo: 'cafe_da_manha', itens: ['pao com manteiga'], inferido: true, hora: '08:00' },
  { linha: 'às 16h pão de queijo', tipo: 'lanche', itens: ['pao queijo'], inferido: true, hora: '16:00' },
  { linha: '19:30 salada e frango', tipo: 'jantar', itens: ['salada', 'frango'], inferido: true, hora: '19:30' },
  { linha: 'bebi 2 copos de água', tipo: 'almoco', itens: ['agua'], inferido: true, qtd: { agua: '2 copos' } },
  { linha: 'tomei um cafezinho 😊', tipo: 'almoco', itens: ['cafe'], inferido: true },
  { linha: 'comi 3 brigadeiros', tipo: 'almoco', itens: ['brigadeiro'], inferido: true, qtd: { brigadeiro: '3' } },
  { linha: 'sorvete', tipo: 'almoco', itens: ['sorvete'], inferido: true },
  { linha: 'um pedaço de bolo de cenoura', tipo: 'almoco', itens: ['bolo cenoura'], inferido: true, qtd: { 'bolo cenoura': '1 pedaço' } },
  { linha: 'meia xícara de arroz e feijão', tipo: 'almoco', itens: ['arroz', 'feijao'], inferido: true, qtd: { arroz: 'meia xícara' } },
  { linha: 'às 23h pipoca', tipo: 'ceia', itens: ['pipoca'], inferido: true },
  { linha: 'às 7 da manhã café com leite', tipo: 'cafe_da_manha', itens: ['cafe com leite'], inferido: true, hora: '07:00' },
  // sem itens
  { linha: 'almocei', tipo: 'almoco', itens: [] },
  { linha: 'jantar', tipo: 'jantar', itens: [] },
]

function hhmm(min: number): string
{
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
}

describe('parseFoodLog: corpus', () =>
{
  it('tem pelo menos 60 frases', () =>
  {
    expect(CASES.length).toBeGreaterThanOrEqual(60)
  })

  for (const c of CASES)
  {
    it(c.linha, () =>
    {
      const r = parseFoodLog(c.linha, ctx)
      const where = `"${c.linha}" => ${JSON.stringify({ tipo: r.tipo, inferido: r.tipoInferido, data: r.data, hora: hhmm(r.horaMinutos), itens: r.itens })}`
      expect(r.tipo, where).toBe(c.tipo)
      expect(r.itens.map((i) => i.key), where).toEqual(c.itens)
      expect(r.tipoInferido, where).toBe(Boolean(c.inferido))
      if (c.data) expect(r.data, where).toBe(c.data)
      else expect(r.data, where).toBe('2026-09-28')
      if (c.hora) expect(hhmm(r.horaMinutos), where).toBe(c.hora)
      for (const [k, q] of Object.entries(c.qtd ?? {}))
      {
        expect(r.itens.find((i) => i.key === k)?.quantidade ?? null, where).toBe(q)
      }
      for (const it of r.itens)
      {
        expect(it.nome, where).not.toMatch(DASHES)
        expect(it.nome.trim(), where).toBe(it.nome)
        expect(it.nome.length, where).toBeGreaterThan(0)
      }
    })
  }

  it('guarda o nome como a pessoa escreveu, em minúsculas', () =>
  {
    const r = parseFoodLog('lanche: Pão de Queijo', ctx)
    expect(r.itens[0].nome).toBe('pão de queijo')
  })

  it('não repete o mesmo item na mesma refeição', () =>
  {
    const r = parseFoodLog('café, cafezinho e café preto', ctx)
    expect(r.itens.map((i) => i.key)).toEqual(['cafe'])
  })

  it('refeição dita fora do horário usa o horário típico', () =>
  {
    const r = parseFoodLog('café da manhã: pão', ctx)
    expect(hhmm(r.horaMinutos)).toBe('08:00')
    const now = parseFoodLog('almoço: pão', ctx)
    expect(hhmm(now.horaMinutos)).toBe('13:00')
  })
})

describe('foodItemKey', () =>
{
  const same: [string, string][] = [
    ['pão de queijo', 'pao queijo'],
    ['pao queijo', 'pão de queijo'],
    ['Pães de Queijo', 'pão de queijo'],
    ['café', 'cafezinho'],
    ['Cafe', 'café preto'],
    ['refri', 'refrigerante'],
    ['refris', 'refrigerante'],
    ['coca-cola', 'refrigerante'],
    ['ovos', 'ovo'],
    ['feijões', 'feijão'],
    ['pastéis', 'pastel'],
    ['hambúrgueres', 'hamburguer'],
    ['bolacha', 'biscoito'],
    ['pães franceses', 'pão'],
    ['batatas fritas', 'batata frita'],
    ['iogurtes', 'yogurt'],
    ['suquinho', 'suco'],
    ['queijinho', 'queijo'],
    ['pastelzinho', 'pastel'],
    ['brócolis', 'brocolis'],
  ]
  for (const [a, b] of same)
  {
    it(`${a} = ${b}`, () =>
    {
      expect(foodItemKey(a)).toBe(foodItemKey(b))
    })
  }

  it('mantém pratos compostos conhecidos', () =>
  {
    expect(foodItemKey('café com leite')).toBe('cafe com leite')
    expect(foodItemKey('pão com ovo')).toBe('pao com ovo')
    expect(foodItemKey('café com leite')).not.toBe(foodItemKey('café'))
  })

  it('não confunde coxinha com coxa', () =>
  {
    expect(foodItemKey('coxinha')).toBe('coxinha')
  })
})

describe('foodMealTypeFromTime', () =>
{
  it('divide o dia sem sobreposição', () =>
  {
    expect(foodMealTypeFromTime(2 * 60)).toBe('ceia')
    expect(foodMealTypeFromTime(6 * 60)).toBe('cafe_da_manha')
    expect(foodMealTypeFromTime(10 * 60 + 29)).toBe('cafe_da_manha')
    expect(foodMealTypeFromTime(10 * 60 + 30)).toBe('almoco')
    expect(foodMealTypeFromTime(15 * 60)).toBe('lanche')
    expect(foodMealTypeFromTime(19 * 60)).toBe('jantar')
    expect(foodMealTypeFromTime(22 * 60 + 30)).toBe('ceia')
  })
})

function meal(data: string, tipo: FoodMealType, texto: string): FoodMealLike
{
  return { data, tipo, itens: parseFoodLog(texto, ctx).itens }
}

describe('foodFrequency', () =>
{
  const meals: FoodMealLike[] = [
    meal('2026-09-02', 'lanche', 'pão de queijo e café'),
    meal('2026-09-05', 'lanche', 'pães de queijo'),
    meal('2026-09-10', 'cafe_da_manha', 'pao queijo, cafezinho'),
    meal('2026-09-20', 'almoco', 'arroz e feijão'),
    meal('2026-09-29', 'lanche', 'pão de queijo'), // depois do "hoje" do teste, conta no mês
    meal('2026-08-03', 'lanche', 'pão de queijo'),
    meal('2026-08-04', 'lanche', 'café'),
    meal('2026-08-05', 'lanche', 'café'),
    meal('2026-08-06', 'lanche', 'café'),
    meal('2026-08-30', 'lanche', 'pão de queijo'), // depois do dia 28: fora da comparação
    meal('2026-07-01', 'almoco', 'arroz'),
  ]

  it('conta refeições por item e ordena pela frequência', () =>
  {
    const rows = foodFrequency(meals, '2026-09', ctx)
    const pdq = rows[0]
    expect(pdq.key).toBe('pao queijo')
    expect(pdq.nome).toBe('pão de queijo')
    expect(pdq.vezes).toBe(4)
    expect(pdq.porRefeicao).toEqual({ lanche: 3, cafe_da_manha: 1 })
    expect(pdq.refeicaoMaisComum).toBe('lanche')
    expect(foodFrequencyPhrase(pdq)).toBe('pão de queijo, 4 vezes')
  })

  it('compara com o mesmo período do mês passado', () =>
  {
    const rows = foodFrequency(meals, '2026-09', ctx)
    const by = Object.fromEntries(rows.map((r) => [r.key, r]))
    expect(by['pao queijo'].mesPassado).toBe(1)
    expect(by['pao queijo'].tendencia).toBe('mais')
    expect(by.cafe.vezes).toBe(2)
    expect(by.cafe.mesPassado).toBe(3)
    expect(by.cafe.tendencia).toBe('menos')
    expect(by.arroz.tendencia).toBe('novo')
    expect(by.feijao.vezes).toBe(1)
  })

  it('mês fechado compara com o mês anterior inteiro', () =>
  {
    const rows = foodFrequency(meals, '2026-08', ctx)
    const by = Object.fromEntries(rows.map((r) => [r.key, r]))
    expect(by['pao queijo'].vezes).toBe(2)
    expect(by['pao queijo'].tendencia).toBe('novo')
  })

  it('conta tipos de refeição e vira mês com janeiro', () =>
  {
    expect(foodMealsPerType(meals, '2026-09')).toEqual({ cafe_da_manha: 1, almoco: 1, lanche: 3, jantar: 0, ceia: 0 })
    expect(previousMonthKey('2026-01')).toBe('2025-12')
    expect(previousMonthKey('2026-09')).toBe('2026-08')
  })

  it('1 vez no singular', () =>
  {
    expect(foodFrequencyPhrase({ nome: 'arroz', vezes: 1 })).toBe('arroz, 1 vez')
  })
})

describe('spendByItem', () =>
{
  const txs = [
    { titulo: 'café 12,50', valor: 12.5, data: '2026-09-02', tipo: 'despesa', categoria: 'alimentacao' },
    { titulo: 'Cafe', valor: 8, data: '2026-09-03', tipo: 'despesa', categoria: 'outros' },
    { titulo: 'cafezinho', valor: 6, data: '2026-09-04', tipo: 'despesa', categoria: 'compras' },
    { titulo: 'Café na padaria', valor: 9.5, data: '2026-09-05', tipo: 'despesa', categoria: 'alimentacao' },
    { titulo: 'Pão de queijo', valor: 7, data: '2026-09-06', tipo: 'despesa', categoria: 'alimentacao' },
    { titulo: 'pao queijo', valor: 7, data: '2026-09-07', tipo: 'despesa' },
    { titulo: 'Almoço', valor: 32, data: '2026-09-08', tipo: 'despesa', categoria: 'alimentacao' },
    { titulo: 'iFood', valor: 45.9, data: '2026-09-09', tipo: 'despesa', categoria: 'alimentacao' },
    { titulo: 'Uber', valor: 20, data: '2026-09-09', tipo: 'despesa', categoria: 'transporte' },
    { titulo: 'Café', valor: 10, data: '2026-08-30', tipo: 'despesa', categoria: 'alimentacao' },
    { titulo: 'Reembolso café', valor: 10, data: '2026-09-10', tipo: 'receita', categoria: 'alimentacao' },
    { titulo: 'Coxinha', valor: 6, data: '2026-09-11', tipo: 'despesa', categoria: 'alimentacao' },
    { titulo: 'Feira do mês', valor: 120, data: '2026-09-12', tipo: 'despesa', categoria: 'alimentacao' },
    { titulo: 'Presente', valor: 80, data: '2026-09-12', tipo: 'despesa', categoria: 'compras' },
  ]

  it('agrupa café, Cafe e cafezinho', () =>
  {
    const rows = spendByItem(txs, '2026-09')
    const cafe = rows.find((r) => r.key === 'cafe')!
    expect(cafe.vezes).toBe(4)
    expect(cafe.total).toBe(36)
    expect(cafe.nome).toBe('café')
    const pdq = rows.find((r) => r.key === 'pao queijo')!
    expect(pdq.vezes).toBe(2)
    expect(pdq.total).toBe(14)
  })

  it('deixa de fora outras categorias, receitas e outros meses', () =>
  {
    const keys = spendByItem(txs, '2026-09').map((r) => r.key)
    expect(keys).not.toContain('uber')
    expect(keys).not.toContain('presente')
    expect(keys).toContain('ifood')
    expect(keys).toContain('almoco')
    expect(keys).toContain('feira mes')
  })

  it('ordena pelo total', () =>
  {
    const rows = spendByItem(txs, '2026-09')
    expect(rows[0].key).toBe('feira mes')
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].total).toBeGreaterThanOrEqual(rows[i].total)
  })

  it('aceita chaves das refeições como comida', () =>
  {
    const rows = spendByItem([{ titulo: 'Kombucha', valor: 15, data: '2026-09-01', tipo: 'despesa', categoria: 'outros' }], '2026-09', { foodKeys: ['kombucha'] })
    expect(rows).toHaveLength(1)
  })

  it('frase junta vezes e total', () =>
  {
    const freq = foodFrequency([meal('2026-09-02', 'lanche', 'café')], '2026-09', ctx)
    const rows = combineFoodAndSpend(freq, spendByItem(txs, '2026-09'))
    const cafe = rows.find((r) => r.key === 'cafe')!
    expect(cafe.frase).toBe('café: 4 vezes no mês, R$ 36')
    expect(cafe.comeuVezes).toBe(1)
    for (const r of rows) expect(r.frase).not.toMatch(DASHES)
  })

  it('título do gasto', () =>
  {
    expect(foodKeyFromExpenseTitle('Café 12,50')).toBe('cafe')
    expect(foodKeyFromExpenseTitle('R$ 7 pão de queijo')).toBe('pao queijo')
    expect(foodKeyFromExpenseTitle('Almoço com o time')).toBe('almoco')
    expect(foodKeyFromExpenseTitle('Coca 2L')).toBe('refrigerante')
  })

  it('formata reais sem centavos quando redondo', () =>
  {
    expect(formatBrlShort(214)).toBe('R$ 214')
    expect(formatBrlShort(214.5)).toBe('R$ 214,50')
    expect(formatBrlShort(1214.05)).toBe('R$ 1.214,05')
  })
})

describe('calorias', () =>
{
  it('soma só o que é conhecido', () =>
  {
    const day = foodKcalOfDay([
      { data: '2026-09-28', itens: [{ kcal: 120 }, { kcal: null }, {}] },
      { data: '2026-09-28', itens: [{ kcal: 330.4 }] },
      { data: '2026-09-27', itens: [{ kcal: 999 }] },
    ], '2026-09-28')
    expect(day).toEqual({ total: 450, comKcal: 2, semKcal: 2 })
    expect(formatKcal(1450)).toBe('1.450 kcal')
  })
})

describe('Open Food Facts', () =>
{
  it('normaliza código de barras', () =>
  {
    expect(normalizeBarcode(' 7891000 100103 ')).toBe('7891000100103')
    expect(normalizeBarcode('123')).toBeNull()
  })

  it('lê a porção', () =>
  {
    expect(parseServingGrams('30 g')).toBe(30)
    expect(parseServingGrams('1 copo (200 ml)')).toBe(200)
    expect(parseServingGrams('1 unidade')).toBeNull()
    expect(parseServingGrams('1,5 kg')).toBe(1500)
  })

  it('lê o produto', () =>
  {
    const p = parseOffResponse({
      status: 1,
      product: {
        product_name: 'Biscoito Recheado Chocolate',
        brands: 'Marca X, Grupo Y',
        serving_size: '30 g',
        nutriments: { 'energy-kcal_100g': 480 },
      },
    }, '7891000100103')!
    expect(p.nome).toBe('Biscoito Recheado Chocolate')
    expect(p.marca).toBe('Marca X')
    expect(p.kcal100g).toBe(480)
    expect(p.kcalPorcao).toBe(144)
    expect(p.key).toBe(foodItemKey('biscoito recheado chocolate'))
  })

  it('converte kJ e trata produto ausente', () =>
  {
    const p = parseOffResponse({ status: 1, product: { product_name: 'Suco', nutriments: { energy_100g: 184 } } }, '12345678')!
    expect(p.kcal100g).toBe(44)
    expect(p.kcalPorcao).toBeNull()
    expect(parseOffResponse({ status: 0 }, '12345678')).toBeNull()
    expect(parseOffResponse({ status: 1, product: { product_name: '' } }, '12345678')).toBeNull()
  })
})
