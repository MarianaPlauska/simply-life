import { describe, expect, it } from 'vitest'
import { avisoManha, avisoNoite, avisoSemana, avisoTarde, cadencePlan, type CadenceInput } from '../cadenceNotices'
import type { MobileTask } from '../tasks'

function tarefa(p: Partial<MobileTask>): MobileTask
{
  return {
    id: 't',
    titulo: 'Mercado',
    status: 'todo',
    dataVencimento: '2026-11-10',
    horaMinutos: null,
    estimativaMinutos: 30,
    progresso: 0,
    checklist: [],
    anotacao: '',
    prioridade: 2,
    ...p,
  }
}

const vazio: CadenceInput = { tarefas: [], ocorrencias: [] }

describe('cadenceNotices', () =>
{
  const input: CadenceInput = {
    tarefas: [
      tarefa({ id: '1', titulo: 'Academia', horaMinutos: 7 * 60 }),
      tarefa({ id: '2', titulo: 'Mercado' }),
      tarefa({ id: '3', titulo: 'Ligar mãe', horaMinutos: 18 * 60 }),
      tarefa({ id: '4', titulo: 'Feita', status: 'done', concluidoEm: '2026-11-04T15:00:00Z' }),
      tarefa({ id: '5', titulo: 'Dentista', dataVencimento: '2026-11-11', horaMinutos: 14 * 60 + 30 }),
    ],
    ocorrencias: [],
    livre: { '2026-11-11': { inicio: 15 * 60, fim: 17 * 60 } },
  }

  it('manha, tarde e noite com o que a pessoa tem', () =>
  {
    expect(avisoManha('2026-11-10', input)).toBe('Hoje: 3 coisas. Começa com Academia às 7h.')
    expect(avisoTarde('2026-11-10', input)).toBe('Ficaram 2 para hoje: Ligar mãe às 18h e Mercado. Se não couber, tudo bem.')
    expect(avisoNoite('2026-11-11', input)).toBe('Amanhã: 1 coisa, livre das 15h às 17h. Quer dar uma olhada?')
    expect(avisoManha('2026-11-12', input)).toBeNull()
  })

  it('a carta so aparece quando ha descoberta', () =>
  {
    expect(avisoTarde('2026-11-12', vazio)).toBeNull()
    expect(avisoTarde('2026-11-12', { ...vazio, descoberta: 'Nos dias com treino, você dorme melhor.' }))
      .toBe('O AXEL notou uma coisa: Nos dias com treino, você dorme melhor.')
  })

  it('tres no dia: hoje e amanha com conteudo, depois frase generica', () =>
  {
    const plan = cadencePlan('batch3', new Date(2026, 10, 10, 10, 0), input)
    expect(plan[0].key).toBe('2026-11-10-15')
    expect(plan[0].body).toContain('Ficaram 2')
    expect(plan.find((n) => n.key === '2026-11-10-21')?.url).toBe('/planejar-amanha')
    expect(plan.find((n) => n.key === '2026-11-12-9')?.body).toBe('Quando quiser, o dia cabe em um toque.')
    expect(plan).toHaveLength(14)
  })

  it('resumo semanal na segunda as 11h', () =>
  {
    const plan = cadencePlan('once', new Date(2026, 10, 10, 10, 0), input)
    expect(plan.map((n) => n.key)).toEqual(['2026-11-16-11', '2026-11-23-11'])
    expect(avisoSemana('2026-11-09', input)).toBe(
      'Semana passada: 1 tarefa concluída. Esta semana: 4 coisas no plano, a primeira é Academia na terça às 7h.',
    )
    expect(cadencePlan('off', new Date(), input)).toEqual([])
  })
})
