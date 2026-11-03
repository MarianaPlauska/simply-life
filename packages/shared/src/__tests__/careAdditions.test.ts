import { describe, expect, it } from 'vitest'
import { calcularElo } from '../elo'
import { energyBudget, energyFromMinutes, energyPoints, suggestedEnergyStock } from '../energyBudget'
import { burnoutSpan, protectedIsoDates } from '../burnoutMode'
import { bodyChecked, toggleBodyAnswer } from '../bodyCheck'
import { doneTodayLines } from '../doneToday'
import { nearbyPlace, parseTaskPlace, placeSlug, tasksForPlace, withTaskPlace } from '../places'
import { holdIsReady, holdReleasesAt, shouldHoldImpulse } from '../impulseHold'
import { forgetfulnessReport } from '../forgetfulnessReport'
import { buildVisualDay } from '../visualDay'
import { OVERLOAD_STEPS } from '../overloadProtocol'

const SEXTA = new Date(2026, 9, 2, 10, 0, 0)

describe('energia', () =>
{
  it('soma pontos e não sugere medidor menor sem sinal', () =>
  {
    expect(energyPoints('alta')).toBe(3)
    expect(energyFromMinutes(10)).toBe('baixa')
    const budget = energyBudget(9, 8)
    expect(budget.over).toBe(true)
    expect(budget.phrase).toContain('não muda sozinho')
    expect(suggestedEnergyStock(8, {})).toBeNull()
    expect(suggestedEnergyStock(8, { humorLow: true })).toBe(6)
  })
})

describe('burnout e elo', () =>
{
  it('protege dois dias sem gastar o descanso livre da semana', () =>
  {
    const elo = calcularElo(['2026-09-28', '2026-10-01', '2026-10-02'], {
      ref: SEXTA,
      proteger: ['2026-09-29', '2026-09-30'],
    })
    expect(elo.dias['2026-09-29']).toBe('descanso')
    expect(elo.dias['2026-09-30']).toBe('descanso')
    expect(elo.dias['2026-09-30']).not.toBe('perdido')
    expect(elo.atual).toBe(3)
    expect(elo.descansoUsadoNestaSemana).toBe(false)
  })

  it('sem a lista de proteção, o segundo furo continua quebrando', () =>
  {
    const elo = calcularElo(['2026-09-28', '2026-10-01', '2026-10-02'], { ref: SEXTA })
    expect(elo.dias['2026-09-30']).toBe('perdido')
    expect(elo.atual).toBe(2)
  })

  it('hoje protegido não fica em risco', () =>
  {
    const elo = calcularElo(['2026-09-28', '2026-09-30', '2026-10-01'], {
      ref: SEXTA,
      proteger: ['2026-10-02'],
    })
    expect(elo.emRisco).toBe(false)
    expect(elo.dias['2026-10-02']).toBe('pendente')
  })

  it('monta o intervalo de 3 dias a partir de hoje', () =>
  {
    const span = burnoutSpan('2026-10-02', 3)
    expect(protectedIsoDates(span, [])).toEqual(['2026-10-02', '2026-10-03', '2026-10-04'])
  })
})

describe('corpo, feito e lugar', () =>
{
  it('marca um toque sem apagar os outros', () =>
  {
    const day = toggleBodyAnswer(toggleBodyAnswer(undefined, 'comi'), 'bebi')
    expect(bodyChecked(day)).toBe(true)
    expect(day.comi).toBe(true)
    expect(toggleBodyAnswer(day, 'comi').comi).toBe(false)
  })

  it('lista o que já foi feito hoje e ignora outro dia', () =>
  {
    const lines = doneTodayLines({
      today: '2026-10-02',
      tasks: [
        { id: '1', titulo: 'Ligar', status: 'done', concluidoEm: '2026-10-02T12:00:00' },
        { id: '2', titulo: 'Ontem', status: 'done', concluidoEm: '2026-10-01T12:00:00' },
      ],
      txs: [{ id: 'c', titulo: 'café', valor: 12.5, tipo: 'despesa', data: '2026-10-02' }],
      humorCount: 1,
      aguaCopos: 2,
      bodyChecked: false,
    })
    expect(lines.map((line) => line.text)).toEqual([
      'Ligar',
      'Saiu R$ 12,50 · café',
      'Humor registrado',
      'Água: 2 copos',
    ])
  })

  it('grava o lugar na anotação e acha a tarefa aberta', () =>
  {
    expect(placeSlug('Mercado da esquina')).toBe('mercado-da-esquina')
    const notas = withTaskPlace('levar a lista', 'Mercado')
    expect(parseTaskPlace(notas)).toBe('mercado')
    const open = tasksForPlace(
      [{ anotacao: notas, status: 'todo' }, { anotacao: notas, status: 'done' }],
      'mercado',
    )
    expect(open).toHaveLength(1)
  })

  it('escolhe o lugar mais perto dentro do raio', () =>
  {
    const hit = nearbyPlace(
      [
        { id: '1', nome: 'Casa', slug: 'casa', lat: 0, lng: 0 },
        { id: '2', nome: 'Longe', slug: 'longe', lat: 10, lng: 10 },
      ],
      { lat: 0.0001, lng: 0.0001 },
      180,
    )
    expect(hit?.slug).toBe('casa')
  })
})

describe('dinheiro', () =>
{
  it('só segura gasto imediato acima do teto, com a espera ligada', () =>
  {
    expect(shouldHoldImpulse(false, 80, { titulo: 'tênis', valor: 200, planejado: false })).toBe(false)
    expect(shouldHoldImpulse(true, 80, { titulo: 'tênis', valor: 200, planejado: false })).toBe(true)
    expect(shouldHoldImpulse(true, 80, { titulo: 'aluguel', valor: 200, planejado: true })).toBe(false)
    expect(shouldHoldImpulse(true, 80, { titulo: 'café', valor: 12, planejado: false })).toBe(false)
    const at = holdReleasesAt(new Date('2026-10-02T12:00:00Z'))
    expect(holdIsReady(at, new Date('2026-10-03T12:00:00Z'))).toBe(true)
    expect(holdIsReady(at, new Date('2026-10-02T18:00:00Z'))).toBe(false)
  })

  it('aponta taxa, assinatura e repetido', () =>
  {
    const items = forgetfulnessReport([
      { id: '1', titulo: 'Multa do banco', valor: 8, data: '2026-10-01', tipo: 'despesa' },
      { id: '2', titulo: 'Streaming', valor: 30, data: '2026-08-02', tipo: 'despesa' },
      { id: '3', titulo: 'Streaming', valor: 30, data: '2026-09-02', tipo: 'despesa' },
      { id: '4', titulo: 'Pão', valor: 10, data: '2026-10-02', tipo: 'despesa' },
      { id: '5', titulo: 'Pão', valor: 10, data: '2026-10-02', tipo: 'despesa' },
    ])
    expect(items.map((item) => item.kind)).toEqual(['taxa', 'assinatura', 'repetido'])
  })
})

describe('tempo de troca', () =>
{
  const event = {
    id: '1',
    titulo: 'Dentista',
    date: '2026-10-02',
    inicio: 600,
    fim: 660,
    allDay: false,
    busy: true,
    local: null,
  }

  it('com buffer 0 o dia continua só com o compromisso', () =>
  {
    const day = buildVisualDay({
      date: '2026-10-02',
      tasks: [],
      events: [event],
      ref: new Date(2026, 9, 2, 8, 0, 0),
    })
    expect(day.blocks.map((block) => block.kind)).toEqual(['agenda'])
  })

  it('com buffer reserva a troca e nomeia a espera, sem ocupar a espera', () =>
  {
    const day = buildVisualDay({
      date: '2026-10-02',
      tasks: [],
      events: [event],
      ref: new Date(2026, 9, 2, 8, 0, 0),
      transitionBufferMin: 10,
    })
    const troca = day.blocks.find((block) => block.kind === 'troca')
    const espera = day.blocks.find((block) => block.kind === 'espera')
    expect(troca?.inicio).toBe(590)
    expect(troca?.fim).toBe(600)
    expect(troca?.soft).toBeUndefined()
    expect(espera?.soft).toBe(true)
    expect(espera?.titulo).toBe('Até Dentista')
  })
})

describe('sobrecarga', () =>
{
  it('tem quatro passos e não promete atendimento', () =>
  {
    expect(OVERLOAD_STEPS).toHaveLength(4)
    expect(OVERLOAD_STEPS.map((step) => step.title).join(' ')).not.toMatch(/diagnóst/i)
  })
})
