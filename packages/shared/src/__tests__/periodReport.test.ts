import { buildPeriodReport, daysBetween, periodReportToHtml } from '../periodReport'

const base = {
  from: '2026-10-01',
  to: '2026-10-07',
  humor: [
    { id: 1, data: '2026-09-30', humor: 1, nota: 'fora do período' },
    { id: 2, data: '2026-10-02', humor: 4, nota: 'dia bom' },
    { id: 3, data: '2026-10-03', humor: 2, nota: '' },
  ],
  finance: [
    { id: 'a', titulo: 'Mercado', valor: 200, categoria: 'alimentacao', data: '2026-10-02', tipo: 'despesa' as const },
    { id: 'b', titulo: 'Uber', valor: 30, categoria: 'transporte', data: '2026-10-03', tipo: 'despesa' as const },
    { id: 'c', titulo: 'Salário', valor: 3000, categoria: 'outros', data: '2026-10-05', tipo: 'receita' as const },
    { id: 'd', titulo: 'Antigo', valor: 999, categoria: 'outros', data: '2026-09-01', tipo: 'despesa' as const },
  ],
  meals: [
    { data: '2026-10-02', tipo: 'almoco' as const, itens: [{ nome: 'arroz', kcal: 300, proteina: 6 }] },
    { data: '2026-10-02', tipo: 'jantar' as const, itens: [{ nome: 'ovo', kcal: 200, proteina: 12 }] },
    { data: '2026-10-04', tipo: 'almoco' as const, itens: [{ nome: 'salada', kcal: 100 }] },
  ],
  waterCups: { '2026-10-02': 10, '2026-10-03': 4, '2026-09-29': 10 },
  mlPorCopo: 200,
  metaMl: 2000,
  sleepHours: { '2026-10-02': 7, '2026-10-03': 6 },
  workouts: [{ data: '2026-10-04', titulo: 'Treino A' }],
  tasksDone: [
    { titulo: 'Enviar relatório', concluidoEm: '2026-10-03T15:00:00Z' },
    { titulo: 'Velha', concluidoEm: '2026-09-20T10:00:00Z' },
  ],
}

describe('buildPeriodReport', () =>
{
  const r = buildPeriodReport(base)

  it('conta só o que está dentro do período', () =>
  {
    expect(r.dias).toBe(7)
    expect(r.humor.registros).toBe(2)
    expect(r.humor.media).toBe(3)
    expect(r.humor.notas).toEqual([{ data: '2026-10-02', humor: expect.any(String), nota: 'dia bom' }])
    expect(r.tarefas.lista).toEqual(['Enviar relatório'])
  })

  it('resume gastos por categoria e saldo', () =>
  {
    expect(r.financas.despesas).toBe(230)
    expect(r.financas.receitas).toBe(3000)
    expect(r.financas.saldo).toBe(2770)
    expect(r.financas.porCategoria[0].total).toBe(200)
    expect(r.financas.maiores[0].titulo).toBe('Mercado')
  })

  it('faz médias de comida, água e sono', () =>
  {
    expect(r.alimentacao.refeicoes).toBe(3)
    expect(r.alimentacao.diasComRegistro).toBe(2)
    expect(r.alimentacao.kcalMediaDia).toBe(300) // (500 + 100) / 2
    expect(r.agua.diasComRegistro).toBe(2)
    expect(r.agua.diasNaMeta).toBe(1)
    expect(r.agua.mediaMlDia).toBe(1400)
    expect(r.sono.mediaHoras).toBe(6.5)
    expect(r.treino.sessoes).toBe(1)
  })

  it('gera HTML com as seções e escapa o texto', () =>
  {
    const html = periodReportToHtml(buildPeriodReport({ ...base, humor: [{ id: 9, data: '2026-10-02', humor: 3, nota: '<b>oi</b>' }] }))
    expect(html).toContain('Humor')
    expect(html).toContain('Tarefas concluídas')
    expect(html).toContain('&lt;b&gt;oi&lt;/b&gt;')
  })
})

describe('daysBetween', () =>
{
  it('conta os dois extremos', () =>
  {
    expect(daysBetween('2026-10-01', '2026-10-01')).toBe(1)
    expect(daysBetween('2026-09-28', '2026-10-03')).toBe(6)
  })
})
