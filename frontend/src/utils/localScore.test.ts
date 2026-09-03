import { describe, expect, it } from 'vitest'
import { localScoreFromText } from './localScore'

describe('localScoreFromText', () =>
{
  it('manda urgente para o piso de Hoje', () =>
  {
    expect(localScoreFromText('URGENTE - revisar contrato')).toEqual({
      score: 92,
      prioridade: 'critica',
    })
  })

  it('mantém tarefa neutra fora de Hoje', () =>
  {
    expect(localScoreFromText('Organizar gaveta').score).toBeLessThanOrEqual(70)
  })
})
