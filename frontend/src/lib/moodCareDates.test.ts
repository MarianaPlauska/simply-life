import { describe, expect, it } from 'vitest'
import {
  applyMoodCareDueShifts,
  computeMoodCareDueShifts,
  isProtectedFromMoodCare,
} from './moodCareDates'
import type { TarefaUnificada } from '../types'

function task(partial: Partial<TarefaUnificada> & { id: number; titulo: string }): TarefaUnificada
{
  return {
    user_id: 'u',
    descricao: null,
    snippet_100_char: '',
    score_urgencia: 40,
    status: 'pendente',
    prioridade: 'media',
    origem: 'manual',
    notas_locais: null,
    data_vencimento: null,
    created_at: '2026-08-19T10:00:00Z',
    versao: 1,
    subtarefas: [],
    labels: [],
    ...partial,
  }
}

describe('moodCareDates', () =>
{
  const wednesday = new Date('2026-08-19T12:00:00')

  it('adia prazo leve quando o humor pede recuperação', () =>
  {
    const light = task({
      id: 1,
      titulo: 'Organizar gaveta',
      score_urgencia: 35,
      data_vencimento: '2026-08-19T17:00:00.000Z',
    })

    const shifts = computeMoodCareDueShifts([light], 'recuperacao', { now: wednesday })
    expect(shifts).toHaveLength(1)
    expect(shifts[0].taskId).toBe(1)
    expect(new Date(shifts[0].nextDue).getDay()).toBe(5)
  })

  it('não mexe em urgente, VIP nem override', () =>
  {
    const urgent = task({
      id: 2,
      titulo: 'URGENTE - contrato',
      score_urgencia: 40,
      data_vencimento: '2026-08-19T17:00:00.000Z',
    })
    const vip = task({
      id: 3,
      titulo: 'Revisão do deck',
      remetente: 'chefe@empresa.com',
      score_urgencia: 40,
      data_vencimento: '2026-08-19T17:00:00.000Z',
    })
    const pinned = task({
      id: 4,
      titulo: 'Manter hoje',
      score_urgencia: 20,
      horizon_override: 'hoje',
      data_vencimento: '2026-08-19T17:00:00.000Z',
    })

    expect(isProtectedFromMoodCare(urgent)).toBe(true)
    expect(isProtectedFromMoodCare(vip)).toBe(true)
    expect(isProtectedFromMoodCare(pinned)).toBe(true)
    expect(computeMoodCareDueShifts([urgent, vip, pinned], 'cuidado', { now: wednesday })).toEqual([])
  })

  it('não adia o que já vence no futuro', () =>
  {
    const later = task({
      id: 5,
      titulo: 'Ler artigo',
      score_urgencia: 20,
      data_vencimento: '2026-08-25T17:00:00.000Z',
    })
    expect(computeMoodCareDueShifts([later], 'cuidado', { now: wednesday })).toEqual([])
  })

  it('aplica o novo prazo nas tarefas pontuadas', () =>
  {
    const light = task({
      id: 6,
      titulo: 'Comprar pão',
      data_vencimento: '2026-08-19T17:00:00.000Z',
    })
    const shifts = computeMoodCareDueShifts([light], 'cuidado', { now: wednesday })
    const next = applyMoodCareDueShifts([light], shifts)
    expect(next[0].data_vencimento).toBe(shifts[0].nextDue)
  })
})
