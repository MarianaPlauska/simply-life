import {
  activeLifeGoals,
  lifeGoalCheer,
  lifeGoalDueLabel,
  lifeGoalEndIso,
  lifeGoalMicroLabel,
  lifeGoalNeedsRefresh,
  lifeGoalPeriodDays,
  practiceGoalTitle,
  lifeGoalProgress,
  lifeGoalTimeLabel,
  lifeGoalToggleFeita,
  lifeGoalTogglePasso,
  LIFE_GOALS_MAX,
  brDateFromIso,
  isoFromBrDate,
  lifeGoalsPaused,
  lifeGoalsPauseUntil,
  maskBrDate,
  type LifeGoal,
} from '../lifeGoals'

const REF = new Date(2026, 9, 10, 12) // sábado, 10 de outubro de 2026

const goal = (p: Partial<LifeGoal>): LifeGoal => ({
  title: 'Meta',
  category: 'custom',
  cadence: 'week',
  periodStart: '2026-10-05',
  ...p,
})

describe('meta com dia exato', () =>
{
  it('vale até o dia escolhido, inclusive', () =>
  {
    expect(lifeGoalNeedsRefresh(goal({ cadence: 'date', dueDate: '2026-10-10' }), REF)).toBe(false)
    expect(lifeGoalNeedsRefresh(goal({ cadence: 'date', dueDate: '2026-10-20' }), REF)).toBe(false)
    expect(lifeGoalNeedsRefresh(goal({ cadence: 'date', dueDate: '2026-10-09' }), REF)).toBe(true)
  })

  it('sem dia escolhido não vale', () =>
  {
    expect(lifeGoalNeedsRefresh(goal({ cadence: 'date' }), REF)).toBe(true)
  })

  it('mostra o prazo', () =>
  {
    const g = goal({ cadence: 'date', dueDate: '2026-10-20', title: 'Manter 50 reais na conta' })
    expect(lifeGoalDueLabel(g)).toBe('até 20/10')
    expect(lifeGoalMicroLabel(g, REF)).toBe('Meta até 20/10: Manter 50 reais na conta')
  })
})

describe('activeLifeGoals', () =>
{
  it('junta a lista com a meta antiga sem repetir e tira as vencidas', () =>
  {
    const antiga = goal({ title: 'Dormir 7h' })
    const lista = [
      antiga,
      goal({ title: 'Ler', cadence: 'date', dueDate: '2026-10-30' }),
      goal({ title: 'Vencida', cadence: 'date', dueDate: '2026-10-01' }),
    ]
    expect(activeLifeGoals(lista, antiga, REF).map((g) => g.title)).toEqual(['Dormir 7h', 'Ler'])
  })

  it('aceita só a meta antiga (contas de antes da lista)', () =>
  {
    expect(activeLifeGoals(undefined, goal({ title: 'Água' }), REF)).toHaveLength(1)
  })

  it(`limita a ${LIFE_GOALS_MAX} metas`, () =>
  {
    const muitas = Array.from({ length: 8 }, (_, i) => goal({ title: `M${i}` }))
    expect(activeLifeGoals(muitas, null, REF)).toHaveLength(LIFE_GOALS_MAX)
  })
})

describe('progresso da meta', () =>
{
  it('acha o último dia de cada tipo de prazo', () =>
  {
    expect(lifeGoalEndIso(goal({ cadence: 'week', periodStart: '2026-10-05' }))).toBe('2026-10-10')
    expect(lifeGoalEndIso(goal({ cadence: 'month', periodStart: '2026-10-05' }))).toBe('2026-10-31')
    expect(lifeGoalEndIso(goal({ cadence: 'date', dueDate: '2026-10-20' }))).toBe('2026-10-20')
  })

  it('conta o tempo sem pressa e acolhe o último dia', () =>
  {
    expect(lifeGoalTimeLabel(lifeGoalProgress(goal({ cadence: 'date', dueDate: '2026-10-15' }), REF))).toBe('faltam 5 dias, no seu ritmo')
    expect(lifeGoalTimeLabel(lifeGoalProgress(goal({ cadence: 'date', dueDate: '2026-10-11' }), REF))).toBe('falta 1 dia, no seu ritmo')
    expect(lifeGoalTimeLabel(lifeGoalProgress(goal({ cadence: 'week' }), REF))).toContain('último dia')
  })

  it('anota um passo por dia e "cheguei lá" conta o passo', () =>
  {
    const g = lifeGoalTogglePasso(goal({}), REF)
    expect(lifeGoalProgress(g, REF)).toMatchObject({ passos: 1, passoHoje: true })
    expect(lifeGoalProgress(lifeGoalTogglePasso(g, REF), REF).passos).toBe(0)
    const feita = lifeGoalToggleFeita(goal({}), REF)
    expect(lifeGoalProgress(feita, REF)).toMatchObject({ feita: true, passos: 1 })
  })

  it('a frase nunca cobra nem fala em falha', () =>
  {
    for (const passos of [0, 1, 2, 5])
    {
      for (const seed of [0, 1, 2])
      {
        const frase = lifeGoalCheer({ fim: '2026-10-10', diasRestantes: 1, passos, passoHoje: false, feita: false, alvo: null }, seed)
        expect(frase).not.toMatch(/falhou|atrasad|só falta|corre|urgente|{n}|{s}/i)
      }
    }
    expect(lifeGoalCheer({ fim: '', diasRestantes: 1, passos: 1, passoHoje: true, feita: false, alvo: null }, 0)).toBe('1 passo dado. Um de cada vez, como deve ser.')
  })
})

describe('meta de saúde mental com número de vezes', () =>
{
  it('monta o título da prática', () =>
  {
    expect(practiceGoalTitle('respirar', 3, false)).toBe('Respirar com calma, 3 vezes')
    expect(practiceGoalTitle('diario', 7, true)).toBe('Escrever no diário, todo dia')
  })

  it('conta os dias do período para "todo dia"', () =>
  {
    expect(lifeGoalPeriodDays(goal({ cadence: 'date', periodStart: '2026-10-10', dueDate: '2026-10-16' }))).toBe(7)
  })

  it('comemora quando completa as vezes, sem precisar marcar "cheguei lá"', () =>
  {
    let g = goal({ alvo: 2, pratica: 'respirar' })
    g = lifeGoalTogglePasso(g, new Date(2026, 9, 9, 12))
    g = lifeGoalTogglePasso(g, REF)
    const p = lifeGoalProgress(g, REF)
    expect(p).toMatchObject({ passos: 2, alvo: 2, feita: false })
    expect(lifeGoalCheer(p, 0)).toMatch(/2 vezes|2 de 2/)
  })
})

describe('data no formato do Brasil', () =>
{
  it('converte, mascara e recusa datas que não existem', () =>
  {
    expect(brDateFromIso('2026-10-12')).toBe('12/10/2026')
    expect(maskBrDate('12102026')).toBe('12/10/2026')
    expect(maskBrDate('121')).toBe('12/1')
    expect(isoFromBrDate('12/10/2026')).toBe('2026-10-12')
    expect(isoFromBrDate('31/02/2026')).toBeNull()
    expect(isoFromBrDate('12/10')).toBeNull()
  })
})

describe('pausa das metas', () =>
{
  it('tem sempre um fim e acaba sozinha', () =>
  {
    const ref = new Date(2026, 9, 6, 12)
    expect(lifeGoalsPauseUntil(1, ref)).toBe('2026-10-06')
    expect(lifeGoalsPauseUntil(7, ref)).toBe('2026-10-12')
    expect(lifeGoalsPauseUntil(9999, ref)).toBe('2026-11-04')
    expect(lifeGoalsPaused('2026-10-06', ref)).toBe(true)
    expect(lifeGoalsPaused('2026-10-05', ref)).toBe(false)
    expect(lifeGoalsPaused(null, ref)).toBe(false)
  })
})
