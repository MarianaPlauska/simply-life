import {
  SHARED_GOAL_CHEERS,
  SHARED_GOAL_FAIXA_LABELS,
  SHARED_GOAL_METRICAS,
  SHARED_GOAL_RITMO_LABELS,
  expectedPace,
  faixaFromRatio,
  isOnPace,
  ritmoFromRatio,
  sharedGoalAlvoLabel,
  sharedGoalBackfillDays,
  sharedGoalCycle,
  sharedGoalDuration,
  sharedGoalEndSummary,
  sharedGoalHeadline,
  sharedGoalProgressFromRpc,
  sharedGoalValueFromHabit,
  suggestNextAlvo,
  validateSharedGoalDraft,
  type SharedGoalDraft,
} from '../sharedGoals'
import { addDaysIso, diffDaysIso, weekdayOfIso } from '../taskPrompt'

const DASHES = /[—–−]/

describe('faixas', () =>
{
  it('divide o pote em quartos', () =>
  {
    expect(faixaFromRatio(0)).toBe(0)
    expect(faixaFromRatio(0.24)).toBe(0)
    expect(faixaFromRatio(0.25)).toBe(1)
    expect(faixaFromRatio(0.5)).toBe(2)
    expect(faixaFromRatio(0.74)).toBe(2)
    expect(faixaFromRatio(0.75)).toBe(3)
    expect(faixaFromRatio(0.99)).toBe(3)
    expect(faixaFromRatio(1)).toBe(4)
    expect(faixaFromRatio(3)).toBe(4)
    expect(faixaFromRatio(Number.NaN)).toBe(0)
  })
})

describe('ritmo', () =>
{
  it('esperado conta meio dia para hoje', () =>
  {
    expect(expectedPace(1, 7)).toBeCloseTo(0.5 / 7)
    expect(expectedPace(4, 7)).toBeCloseTo(3.5 / 7)
    expect(expectedPace(7, 7)).toBe(1)
    expect(expectedPace(0, 7)).toBe(0)
    expect(expectedPace(3, 0)).toBe(1)
  })

  it('logo no primeiro dia ninguém fica atrás', () =>
  {
    expect(ritmoFromRatio(0, expectedPace(1, 7))).toBe('no_ritmo')
  })

  it('compara com o esperado', () =>
  {
    const exp = expectedPace(4, 7)
    expect(ritmoFromRatio(0.2, exp)).toBe('atras')
    expect(ritmoFromRatio(0.5, exp)).toBe('no_ritmo')
    expect(ritmoFromRatio(0.8, exp)).toBe('a_frente')
    expect(ritmoFromRatio(1, 1)).toBe('a_frente')
  })

  it('no ritmo inclui quem está à frente', () =>
  {
    const exp = expectedPace(4, 7)
    expect(isOnPace(0.2, exp)).toBe(false)
    expect(isOnPace(0.45, exp)).toBe(true)
    expect(isOnPace(2, exp)).toBe(true)
  })
})

describe('datas e ciclos', () =>
{
  it('soma e diferença de dias', () =>
  {
    expect(addDaysIso('2026-09-28', 6)).toBe('2026-10-04')
    expect(diffDaysIso('2026-09-28', '2026-10-04')).toBe(6)
    expect(weekdayOfIso('2026-09-28')).toBe(1)
    expect(weekdayOfIso('2026-10-04')).toBe(0)
  })

  it('período total', () =>
  {
    const c = sharedGoalCycle({ inicio: '2026-09-01', fim: '2026-09-21', ciclo: 'total' }, '2026-09-10')
    expect(c).toMatchObject({ start: '2026-09-01', end: '2026-09-21', daysTotal: 21, daysElapsed: 10, ended: false })
  })

  it('ciclo semanal a partir do início, sem semana pela metade', () =>
  {
    const g = { inicio: '2026-09-03', fim: null, ciclo: 'semanal' as const }
    expect(sharedGoalCycle(g, '2026-09-03')).toMatchObject({ start: '2026-09-03', end: '2026-09-09', daysElapsed: 1, index: 0 })
    expect(sharedGoalCycle(g, '2026-09-09')).toMatchObject({ start: '2026-09-03', daysElapsed: 7, index: 0 })
    expect(sharedGoalCycle(g, '2026-09-10')).toMatchObject({ start: '2026-09-10', end: '2026-09-16', daysElapsed: 1, index: 1 })
  })

  it('semanal com fim corta o último ciclo', () =>
  {
    const g = { inicio: '2026-09-01', fim: '2026-09-10', ciclo: 'semanal' as const }
    const c = sharedGoalCycle(g, '2026-09-09')
    expect(c).toMatchObject({ start: '2026-09-08', end: '2026-09-10', daysTotal: 3, daysElapsed: 2 })
  })

  it('depois do fim, o período fica encerrado e cheio', () =>
  {
    const c = sharedGoalCycle({ inicio: '2026-09-01', fim: '2026-09-07', ciclo: 'total' }, '2026-09-20')
    expect(c).toMatchObject({ ended: true, daysElapsed: 7, daysTotal: 7 })
  })

  it('antes do início', () =>
  {
    const c = sharedGoalCycle({ inicio: '2026-10-01', fim: '2026-10-07', ciclo: 'total' }, '2026-09-28')
    expect(c.notStarted).toBe(true)
    expect(c.daysElapsed).toBe(0)
    expect(sharedGoalBackfillDays(c, '2026-09-28')).toEqual([])
  })

  it('dias para preencher vão do início do ciclo até hoje', () =>
  {
    const g = { inicio: '2026-09-25', fim: null, ciclo: 'semanal' as const }
    const c = sharedGoalCycle(g, '2026-09-28')
    expect(sharedGoalBackfillDays(c, '2026-09-28')).toEqual(['2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28'])
  })

  it('durações prontas', () =>
  {
    // 2026-09-28 é segunda
    expect(sharedGoalDuration('esta_semana', '2026-09-28')).toEqual({ inicio: '2026-09-28', fim: '2026-10-04', ciclo: 'total' })
    // sábado: estende até o domingo seguinte
    expect(sharedGoalDuration('esta_semana', '2026-10-03').fim).toBe('2026-10-11')
    expect(sharedGoalDuration('duas_semanas', '2026-09-28').fim).toBe('2026-10-11')
    expect(sharedGoalDuration('vinte_um', '2026-09-28').fim).toBe('2026-10-18')
    expect(sharedGoalDuration('um_mes', '2026-09-28').fim).toBe('2026-10-27')
    expect(sharedGoalDuration('sem_fim', '2026-09-28')).toEqual({ inicio: '2026-09-28', fim: null, ciclo: 'semanal' })
    expect(sharedGoalDuration('datas', '2026-09-28', { inicio: '2026-10-01', fim: '2026-10-05' }).fim).toBe('2026-10-05')
  })
})

describe('rascunho', () =>
{
  const base: SharedGoalDraft = {
    titulo: 'Água juntos',
    metrica: 'agua',
    unidade: 'L',
    alvo: 10,
    modo: 'pote',
    exibicao: 'faixas',
    inicio: '2026-09-28',
    fim: '2026-10-04',
    ciclo: 'total',
  }

  it('aceita uma meta válida', () =>
  {
    expect(validateSharedGoalDraft(base)).toBeNull()
  })

  it('recusa sem nome, sem alvo, livre sem unidade, datas trocadas', () =>
  {
    expect(validateSharedGoalDraft({ ...base, titulo: ' ' })).not.toBeNull()
    expect(validateSharedGoalDraft({ ...base, alvo: 0 })).not.toBeNull()
    expect(validateSharedGoalDraft({ ...base, metrica: 'livre', unidade: '' })).not.toBeNull()
    expect(validateSharedGoalDraft({ ...base, fim: '2026-09-20' })).not.toBeNull()
    expect(validateSharedGoalDraft({ ...base, fim: null, ciclo: 'total' })).not.toBeNull()
  })
})

describe('valores e textos', () =>
{
  it('água em ml vira litros; humor vira dia registrado', () =>
  {
    expect(sharedGoalValueFromHabit('agua', 1500)).toBe(1.5)
    expect(sharedGoalValueFromHabit('humor', 3)).toBe(1)
    expect(sharedGoalValueFromHabit('treino', 1)).toBe(1)
    expect(sharedGoalValueFromHabit('sono', -2)).toBe(0)
  })

  it('rótulo do alvo', () =>
  {
    expect(sharedGoalAlvoLabel({ alvo: 10, unidade: 'L', modo: 'pote', ciclo: 'total', metrica: 'agua' })).toBe('10 L juntos')
    expect(sharedGoalAlvoLabel({ alvo: 3, unidade: 'treinos', modo: 'cada_um', ciclo: 'semanal', metrica: 'treino' })).toBe('3 treinos cada um por semana')
  })

  it('manchete sem número de ninguém', () =>
  {
    const base = { modo: 'pote' as const, exibicao: 'faixas' as const, faixa: 3 as const, ritmo: null, onPace: null, members: 2, ended: false, notStarted: false }
    expect(sharedGoalHeadline(base)).toBe('Quase lá, juntos')
    expect(sharedGoalHeadline({ ...base, ended: true })).toBe('Vocês chegaram a quase lá juntos')
    expect(sharedGoalHeadline({ ...base, exibicao: 'ritmo', faixa: null, ritmo: 'atras' })).toBe('Um pouco atrás, e tudo bem')
    expect(sharedGoalHeadline({ ...base, modo: 'cada_um', exibicao: 'ritmo', faixa: null, onPace: 2, members: 3 })).toBe('2 de 3 no ritmo')
  })

  it('resumo e sugestão do próximo ciclo', () =>
  {
    expect(sharedGoalEndSummary(4)).toBe('Vocês conseguiram juntos')
    expect(suggestNextAlvo(10, 4)).toBe(11)
    expect(suggestNextAlvo(10, 1)).toBe(6)
    expect(suggestNextAlvo(3, 3)).toBe(3)
  })

  it('lê a resposta da função de progresso', () =>
  {
    const p = sharedGoalProgressFromRpc({ ok: true, exibicao: 'faixas', modo: 'pote', faixa: 2, ritmo: null, members: 2, days_elapsed: 3, days_total: 7, cycle_start: '2026-09-28', cycle_end: '2026-10-04', ended: false })
    expect(p?.faixa).toBe(2)
    expect(p?.members).toBe(2)
    expect(sharedGoalProgressFromRpc({ ok: false })).toBeNull()
    expect(sharedGoalProgressFromRpc(null)).toBeNull()
  })

  it('nenhum texto usa travessão', () =>
  {
    const all = [
      ...SHARED_GOAL_CHEERS.map((c) => c.label),
      ...Object.values(SHARED_GOAL_FAIXA_LABELS),
      ...Object.values(SHARED_GOAL_RITMO_LABELS),
      ...SHARED_GOAL_METRICAS.flatMap((m) => [m.label, m.hint]),
    ]
    for (const s of all) expect(s).not.toMatch(DASHES)
  })

  it('cinco mensagens prontas', () =>
  {
    expect(SHARED_GOAL_CHEERS.map((c) => c.label)).toEqual([
      'Tô contigo',
      'Bora juntos',
      'Orgulho de você',
      'Um passo de cada vez',
      'Descansa hoje, amanhã tem mais',
    ])
  })
})
