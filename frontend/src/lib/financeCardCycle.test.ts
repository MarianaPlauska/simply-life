import { describe, expect, it } from 'vitest'
import {
  dueDateFromUserBillingDays,
  getBillingCycle,
  resolveDueDay,
} from './financeCardCycle'
import type { VirtualCard } from '../store/storeTypes'

const baseCard = (patch: Partial<VirtualCard> = {}): VirtualCard =>
({
  id: 'card_test',
  nome: 'Teste',
  titular: 'Titular',
  numero: '**** 1234',
  validade: '12/30',
  cvv: '***',
  limite: 5000,
  tipo_gradiente: 'purple',
  bandeira: 'visa',
  status: 'ativo',
  ...patch,
})

describe('financeCardCycle', () =>
{
  it('vence no mesmo mês quando fechamento é dia 11 e vencimento dia 18', () =>
  {
    const card = baseCard({ dia_fechamento: 11, dia_vencimento: 18 })
    const ref = new Date(2026, 5, 24)
    const labels = dueDateFromUserBillingDays(card, ref)

    expect(labels?.fecha).toBe('2026-07-11')
    expect(labels?.vence).toBe('2026-07-18')

    const cycle = getBillingCycle(card, ref)
    expect(cycle.dueDate).toBe('2026-07-18')
  })

  it('não infere vencimento quando só fechamento está salvo', () =>
  {
    const card = baseCard({ dia_fechamento: 11 })
    expect(resolveDueDay(card)).toBeNull()
    expect(dueDateFromUserBillingDays(card)).toBeNull()
  })

  it('vence no mês seguinte quando dia de vencimento é anterior ao fechamento', () =>
  {
    const card = baseCard({ dia_fechamento: 25, dia_vencimento: 10 })
    const labels = dueDateFromUserBillingDays(card, new Date(2026, 5, 24))

    expect(labels?.fecha).toBe('2026-06-25')
    expect(labels?.vence).toBe('2026-07-10')
  })
})
