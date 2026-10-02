import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  calcularElo,
  eloDetalheDoDia,
  eloNivelDoDia,
  eloSegundaDe,
  eloSomarDias,
  montarMapaDeDias,
} from '../elo'
import { isoDaysAgo, todayIso } from '../dates'
import { capXpGrant, DAILY_XP_CAP } from '../gamification/xpEconomy'
import type { PlanRecord } from '../planInsights'

/** sexta, 2 out 2026, 10:00 (horário local, America/Sao_Paulo) */
const SEXTA = new Date(2026, 9, 2, 10, 0, 0)

function intervalo(de: string, ate: string): string[]
{
  const out: string[] = []
  for (let iso = de; iso <= ate; iso = eloSomarDias(iso, 1)) out.push(iso)
  return out
}

describe('fuso de teste', () =>
{
  it('roda em UTC-3', () =>
  {
    expect(new Date('2026-10-03T01:30:00Z').getHours()).toBe(22)
  })
})

describe('calcularElo', () =>
{
  it('conta dias seguidos e deixa hoje pendente sem quebrar', () =>
  {
    const elo = calcularElo(intervalo('2026-09-28', '2026-10-01'), { ref: SEXTA })
    expect(elo.atual).toBe(4)
    expect(elo.cumpridoHoje).toBe(false)
    expect(elo.emRisco).toBe(false)
    expect(elo.dias['2026-10-02']).toBe('pendente')
    expect(elo.dias['2026-10-03']).toBe('futuro')
    expect(elo.dias['2026-10-04']).toBe('futuro')
    expect(elo.cumpridosNaSemana).toBe(4)
  })

  it('o primeiro dia sem registro da semana vira descanso', () =>
  {
    const elo = calcularElo(['2026-09-28', '2026-09-30', '2026-10-01', '2026-10-02'], { ref: SEXTA })
    expect(elo.dias['2026-09-29']).toBe('descanso')
    expect(elo.atual).toBe(4)
    expect(elo.descansoUsadoNestaSemana).toBe(true)
    expect(elo.cumpridoHoje).toBe(true)
  })

  it('o segundo dia sem registro na mesma semana quebra o elo', () =>
  {
    const elo = calcularElo(['2026-09-28', '2026-10-01', '2026-10-02'], { ref: SEXTA })
    expect(elo.dias['2026-09-29']).toBe('descanso')
    expect(elo.dias['2026-09-30']).toBe('perdido')
    expect(elo.atual).toBe(2)
    expect(elo.recorde).toBe(2)
  })

  it('o descanso renova toda segunda-feira', () =>
  {
    // seg 21 a sáb 26 cumpridos, dom 27 descanso, seg 28 descanso (semana nova)
    const dias = [...intervalo('2026-09-21', '2026-09-26'), ...intervalo('2026-09-29', '2026-10-02')]
    const elo = calcularElo(dias, { ref: SEXTA })
    expect(elo.dias['2026-09-27']).toBe('descanso')
    expect(elo.dias['2026-09-28']).toBe('descanso')
    expect(elo.atual).toBe(10)
  })

  it('fica em risco quando o descanso da semana já foi usado e hoje está aberto', () =>
  {
    const elo = calcularElo(['2026-09-28', '2026-09-30', '2026-10-01'], { ref: SEXTA })
    expect(elo.atual).toBe(3)
    expect(elo.emRisco).toBe(true)
    expect(elo.dias['2026-10-02']).toBe('pendente')
  })

  it('o recorde olha o histórico inteiro, sem janela de 90 dias', () =>
  {
    const longa = intervalo('2026-01-05', '2026-05-04') // 120 dias seguidos
    const elo = calcularElo([...longa, '2026-10-01', '2026-10-02'], { ref: SEXTA })
    expect(elo.recorde).toBe(120)
    expect(elo.atual).toBe(2)
  })

  it('nunca fica abaixo do recorde guardado', () =>
  {
    const elo = calcularElo(['2026-10-02'], { ref: SEXTA, recordeSalvo: 37 })
    expect(elo.recorde).toBe(37)
    expect(calcularElo([], { ref: SEXTA }).atual).toBe(0)
  })

  it('ignora dias no futuro', () =>
  {
    const elo = calcularElo(['2026-10-01', '2026-10-03'], { ref: SEXTA })
    expect(elo.atual).toBe(1)
    expect(elo.dias['2026-10-03']).toBe('futuro')
  })

  it('usa o dia local entre 21h e 23h59 (UTC-3)', () =>
  {
    for (const utc of ['2026-10-03T00:00:00Z', '2026-10-03T01:30:00Z', '2026-10-03T02:59:00Z'])
    {
      const ref = new Date(utc) // 21h00, 22h30, 23h59 de sexta 2/10 no Brasil
      expect(todayIso(ref)).toBe('2026-10-02')
      expect(isoDaysAgo(1, ref)).toBe('2026-10-01')
      const elo = calcularElo(['2026-10-01', '2026-10-02'], { ref })
      expect(elo.hoje).toBe('2026-10-02')
      expect(elo.cumpridoHoje).toBe(true)
      expect(elo.atual).toBe(2)
    }
  })

  it('semana começa na segunda', () =>
  {
    expect(eloSegundaDe('2026-10-04')).toBe('2026-09-28')
    expect(eloSegundaDe('2026-09-28')).toBe('2026-09-28')
  })
})

describe('teto diário de XP', () =>
{
  afterEach(() => vi.useRealTimers())

  it('usa o dia local, não zera às 21h', () =>
  {
    const mem = new Map<string, string>()
    const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) }
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 2, 20, 0, 0))
    expect(capXpGrant(storage, DAILY_XP_CAP).granted).toBe(DAILY_XP_CAP)
    vi.setSystemTime(new Date(2026, 9, 2, 22, 30, 0))
    expect(capXpGrant(storage, 10).granted).toBe(0)
    expect(mem.has('axel-xp-daily:2026-10-02')).toBe(true)
  })
})

describe('mapa de dias', () =>
{
  it('nível pelo planejado, com essenciais pesando o dobro', () =>
  {
    const base = { status: 'cumprido' as const, acoes: 1 }
    expect(eloNivelDoDia({ ...base, planejadas: 4, feitasDoPlano: 4, essenciais: 2, essenciaisFeitas: 2 })).toBe(4)
    // (2*2 + 1) / (2*2 + 2) = 0,83
    expect(eloNivelDoDia({ ...base, planejadas: 4, feitasDoPlano: 3, essenciais: 2, essenciaisFeitas: 2 })).toBe(3)
    // (0 + 2) / 6 = 0,33
    expect(eloNivelDoDia({ ...base, planejadas: 4, feitasDoPlano: 2, essenciais: 2, essenciaisFeitas: 0 })).toBe(1)
    // nada do plano, mas o dia foi cumprido com outra ação
    expect(eloNivelDoDia({ ...base, planejadas: 3, feitasDoPlano: 0, essenciais: 1, essenciaisFeitas: 0 })).toBe(1)
    expect(eloNivelDoDia({ status: 'perdido', acoes: 0, planejadas: 3, feitasDoPlano: 0, essenciais: 1, essenciaisFeitas: 0 })).toBe(0)
  })

  it('sem plano: quantos tipos de ação o dia teve', () =>
  {
    const sem = { planejadas: 0, feitasDoPlano: 0, essenciais: 0, essenciaisFeitas: 0 }
    expect(eloNivelDoDia({ ...sem, status: 'cumprido', acoes: 1 })).toBe(1)
    expect(eloNivelDoDia({ ...sem, status: 'cumprido', acoes: 2 })).toBe(2)
    expect(eloNivelDoDia({ ...sem, status: 'cumprido', acoes: 6 })).toBe(4)
    expect(eloNivelDoDia({ ...sem, status: 'descanso', acoes: 0 })).toBe(0)
    expect(eloNivelDoDia({ ...sem, status: 'futuro', acoes: 3 })).toBe(0)
  })

  it('monta semanas de segunda a domingo e conta o plano pela conclusão', () =>
  {
    const elo = calcularElo(['2026-09-28', '2026-10-01', '2026-10-02'], { ref: SEXTA })
    const plano: PlanRecord = {
      date: '2026-10-01',
      mode: 'normal' as PlanRecord['mode'],
      mood: null,
      energy: 'media',
      anxiety: 0 as PlanRecord['anxiety'],
      essentialIds: ['a'],
      plannedIds: ['a', 'b', 'c'],
      capacityMin: 0,
      plannedMin: 0,
      worriesCount: 0,
      createdAt: '',
    }
    const concluidas = new Map([
      ['a', '2026-10-01'],
      ['b', '2026-10-02'], // na manhã seguinte ainda conta
      ['c', '2026-10-05'],
    ])
    const mapa = montarMapaDeDias({
      elo,
      semanas: 2,
      planos: [plano],
      concluidas,
      acoesPorDia: { '2026-09-28': ['task', 'mood', 'water'] },
    })
    expect(mapa.colunas).toHaveLength(2)
    expect(mapa.colunas.every((c) => c.length === 7)).toBe(true)
    expect(mapa.de).toBe('2026-09-21')
    expect(mapa.ate).toBe('2026-10-04')
    const dia = mapa.colunas[1]!.find((c) => c.iso === '2026-10-01')!
    expect(dia.planejadas).toBe(3)
    expect(dia.feitasDoPlano).toBe(2)
    expect(dia.essenciaisFeitas).toBe(1)
    expect(dia.nivel).toBe(3) // (2 + 1) / 4 = 0,75
    expect(eloDetalheDoDia(dia)).toBe('Dia cumprido · 2 de 3 planejadas')
    const seg = mapa.colunas[1]![0]!
    expect(seg.nivel).toBe(3)
    expect(eloDetalheDoDia(mapa.colunas[1]!.find((c) => c.iso === '2026-09-29')!)).toBe('Descanso')
    expect(eloDetalheDoDia(mapa.colunas[0]![0]!)).toBe('Sem registro')
    expect(mapa.colunas[1]![6]!.status).toBe('futuro')
  })
})
