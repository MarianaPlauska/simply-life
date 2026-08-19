import { describe, it, expect } from 'vitest'
import { countByKind, periodCopy, type AxelDecisionEvent } from './axelDecisionLog'

describe('periodCopy', () =>
{
  it('resume decisões da semana em português', () =>
  {
    const events: AxelDecisionEvent[] = [
      { id: '1', user_id: 'u', task_id: 1, kind: 'deferred_load', rationale: null, score: 80, horizon: 'semana', created_at: '2026-08-18T10:00:00Z' },
      { id: '2', user_id: 'u', task_id: 2, kind: 'deferred_load', rationale: null, score: 70, horizon: 'semana', created_at: '2026-08-18T11:00:00Z' },
      { id: '3', user_id: 'u', task_id: 3, kind: 'decay_backlog', rationale: null, score: 20, horizon: 'backlog', created_at: '2026-08-19T09:00:00Z' },
    ]
    const copy = periodCopy(countByKind(events), 'Essa semana')
    expect(copy).toContain('adiou 2 por carga')
    expect(copy).toContain('1 entraram em decay')
  })
})
