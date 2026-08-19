import { describe, it, expect } from 'vitest'
import { mapFetchedTarefas } from './mapFetchedTarefas'
import { isFazer1h, isFazerHoje, isNestaSemana } from './kanbanTemporalColumns'
import {
  bucketByTemporalHorizon,
  horizonPersistPatch,
  resolveTemporalHorizon,
} from './temporalHorizon'
import type { TarefaUnificada } from '../types'

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

describe('mapFetchedTarefas', () =>
{
  it('colapsa a mesma tarefa repetida por JOIN 1:N (labels × subtarefas)', () =>
  {
    const rows = [
      {
        id: 10,
        titulo: 'Revisar proposta',
        status: 'pendente',
        prioridade: 'alta',
        score_urgencia: 80,
        user_id: 'u',
        snippet_100_char: 'x',
        notas_locais: null,
        descricao: null,
        origem: 'manual',
        data_vencimento: null,
        created_at: null,
        versao: 1,
        tarefa_labels: [{ label_id: 1, labels: { id: 1, nome: 'Trabalho', cor: '#f00' } }],
        subtarefas: [{ id: 1, titulo: 'A', concluida: false, ordem: 0 }],
      },
      {
        id: 10,
        titulo: 'Revisar proposta',
        status: 'pendente',
        prioridade: 'alta',
        score_urgencia: 80,
        user_id: 'u',
        snippet_100_char: 'x',
        notas_locais: null,
        descricao: null,
        origem: 'manual',
        data_vencimento: null,
        created_at: null,
        versao: 1,
        tarefa_labels: [{ label_id: 2, labels: { id: 2, nome: 'Urgente', cor: '#0f0' } }],
        subtarefas: [{ id: 2, titulo: 'B', concluida: false, ordem: 1 }],
      },
    ]

    const tarefas = mapFetchedTarefas(rows)
    expect(tarefas).toHaveLength(1)
    expect(tarefas[0].id).toBe(10)
    expect(tarefas[0].labels.map((l) => l.nome).sort()).toEqual(['Trabalho', 'Urgente'])
    expect(tarefas[0].subtarefas.map((s) => s.titulo).sort()).toEqual(['A', 'B'])
  })
})

describe('kanbanTemporalColumns', () =>
{
  it('não coloca a mesma task em Fazer 1h e Fazer Hoje', () =>
  {
    const altaCritica = task({
      id: 1,
      prioridade: 'alta',
      score_urgencia: 80,
      status: 'pendente',
    })
    expect(isFazer1h(altaCritica)).toBe(true)
    expect(isFazerHoje(altaCritica)).toBe(false)
    expect(isNestaSemana(altaCritica)).toBe(false)
  })
})

describe('horizon override persistido', () =>
{
  it('sobrevive ao reload: resolveTemporalHorizon usa horizon_override', () =>
  {
    const t = task({
      id: 3,
      score_urgencia: 20,
      status: 'pendente',
      horizon_override: 'hoje',
    })
    expect(resolveTemporalHorizon(t)).toBe('hoje')
    const buckets = bucketByTemporalHorizon([t])
    expect(buckets.hoje.map((x) => x.id)).toEqual([3])
    expect(buckets.backlog).toHaveLength(0)
  })

  it('horizonPersistPatch grava score/status alinhados ao horizonte', () =>
  {
    expect(horizonPersistPatch('hoje').horizon_override).toBe('hoje')
    expect(horizonPersistPatch('hoje').score_urgencia).toBeGreaterThanOrEqual(92)
    const afterReload = task({
      id: 4,
      ...horizonPersistPatch('semana'),
    })
    expect(resolveTemporalHorizon(afterReload)).toBe('semana')
  })
})
