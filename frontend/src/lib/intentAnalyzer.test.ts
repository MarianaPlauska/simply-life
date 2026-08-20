import { describe, expect, it } from 'vitest'
import { analyzeTaskIntent } from './intentAnalyzer'
import { HOJE_SCORE_FLOOR } from './temporalHorizon'
import type { TarefaUnificada } from '../types'

function task(partial: Partial<TarefaUnificada> & { titulo: string }): TarefaUnificada
{
  return {
    id: 1,
    user_id: 'u',
    descricao: null,
    snippet_100_char: '',
    score_urgencia: 40,
    status: 'pendente',
    prioridade: 'media',
    origem: 'gmail',
    notas_locais: null,
    data_vencimento: null,
    created_at: '2026-08-19T10:00:00Z',
    versao: 1,
    subtarefas: [],
    labels: [],
    ...partial,
  }
}

describe('analyzeTaskIntent', () =>
{
  it('promove título urgente para o piso de Hoje', () =>
  {
    const result = analyzeTaskIntent(task({ titulo: '[URGENTE] Aprovar documento' }))
    expect(result.forceMinScore).toBe(HOJE_SCORE_FLOOR)
    expect(result.matchedSignals.length).toBeGreaterThan(0)
  })

  it('promove remetente chave mesmo sem a palavra urgente', () =>
  {
    const result = analyzeTaskIntent(task({
      titulo: 'Pode olhar o relatório?',
      remetente: 'chefe@empresa.com',
    }))
    expect(result.forceMinScore).toBe(HOJE_SCORE_FLOOR)
    expect(result.urgencyReason).toMatch(/remetente chave/i)
  })

  it('não promove FYI de remetente comum', () =>
  {
    const result = analyzeTaskIntent(task({
      titulo: 'FYI status da sprint',
      remetente: 'coleg@empresa.com',
    }))
    expect(result.category).toBe('alinhamento')
    expect(result.forceMinScore).toBeNull()
  })
})
