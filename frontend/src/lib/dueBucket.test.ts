import { describe, it, expect } from 'vitest'
import {
  bucketByDueDate,
  dueBucketDropId,
  parseDueBucketDropId,
  resolveDueBucket,
  snapDueDateForBucket,
} from './dueBucket'
import type { TarefaUnificada } from '../types'

const NOW = new Date('2026-06-10T12:00:00.000Z')

function task(overrides: Partial<TarefaUnificada> & { id: number }): TarefaUnificada
{
  return {
    user_id: 'u',
    titulo: 'Test',
    snippet_100_char: 'Test',
    score_urgencia: 50,
    status: 'pendente',
    notas_locais: null,
    descricao: null,
    prioridade: 'media',
    origem: 'manual',
    created_at: null,
    versao: 1,
    subtarefas: [],
    labels: [],
    data_vencimento: null,
    ...overrides,
  }
}

describe('resolveDueBucket', () =>
{
  it('classifica vencido', () =>
  {
    const t = task({ id: 1, data_vencimento: '2026-06-09T17:00:00.000Z' })
    expect(resolveDueBucket(t, NOW)).toBe('vencido')
  })

  it('classifica hoje', () =>
  {
    const t = task({ id: 2, data_vencimento: '2026-06-10T08:00:00.000Z' })
    expect(resolveDueBucket(t, NOW)).toBe('hoje')
  })

  it('classifica esta semana (1–7 dias)', () =>
  {
    const t = task({ id: 3, data_vencimento: '2026-06-15T17:00:00.000Z' })
    expect(resolveDueBucket(t, NOW)).toBe('esta_semana')
  })

  it('classifica próxima semana (8+ dias)', () =>
  {
    const t = task({ id: 4, data_vencimento: '2026-06-25T17:00:00.000Z' })
    expect(resolveDueBucket(t, NOW)).toBe('proxima_semana')
  })

  it('classifica sem prazo', () =>
  {
    const t = task({ id: 5, data_vencimento: null })
    expect(resolveDueBucket(t, NOW)).toBe('sem_prazo')
  })

  it('classifica concluído independente do prazo', () =>
  {
    const t = task({
      id: 6,
      status: 'concluida',
      data_vencimento: '2026-06-09T17:00:00.000Z',
    })
    expect(resolveDueBucket(t, NOW)).toBe('concluido')
  })
})

describe('bucketByDueDate', () =>
{
  it('agrupa tarefas nas faixas corretas', () =>
  {
    const tarefas = [
      task({ id: 1, data_vencimento: '2026-06-09T17:00:00.000Z' }),
      task({ id: 2, data_vencimento: '2026-06-10T17:00:00.000Z' }),
      task({ id: 3, data_vencimento: null }),
    ]

    const buckets = bucketByDueDate(tarefas, NOW)
    expect(buckets.vencido.map((t) => t.id)).toEqual([1])
    expect(buckets.hoje.map((t) => t.id)).toEqual([2])
    expect(buckets.sem_prazo.map((t) => t.id)).toEqual([3])
  })
})

describe('snapDueDateForBucket', () =>
{
  it('remove prazo em sem_prazo', () =>
  {
    expect(snapDueDateForBucket('sem_prazo', NOW)).toBeNull()
  })

  it('define hoje ao soltar em vencido ou hoje', () =>
  {
    expect(snapDueDateForBucket('hoje', NOW)).toContain('2026-06-10')
    expect(snapDueDateForBucket('vencido', NOW)).toContain('2026-06-10')
  })
})

describe('dueBucketDropId', () =>
{
  it('serializa e parseia id de drop', () =>
  {
    const id = dueBucketDropId('esta_semana')
    expect(id).toBe('due:esta_semana')
    expect(parseDueBucketDropId(id)).toBe('esta_semana')
    expect(parseDueBucketDropId('hoje')).toBeNull()
  })
})
