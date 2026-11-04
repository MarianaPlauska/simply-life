import {
  blocoConflicts,
  blocoOccursOn,
  expandBlocos,
  fitFlexiveis,
  nextFreeSlot,
  parseBlocoFala,
  resumoDia,
  type Bloco,
} from '../meuMundo'

function bloco(p: Partial<Bloco>): Bloco
{
  return {
    id: 'b1',
    titulo: 'Academia',
    tipo: 'fixo',
    dataInicio: '2026-11-02',
    horaMinutos: 7 * 60,
    duracaoMinutos: 60,
    repete: 'nao',
    diasSemana: [],
    intervaloSemanas: 1,
    repeteAte: null,
    avisoMinutos: null,
    avisoFim: false,
    cor: null,
    categoria: null,
    ...p,
  }
}

describe('meuMundo', () =>
{
  it('repete nos dias da semana escolhidos', () =>
  {
    const b = bloco({ repete: 'semanal', diasSemana: [1, 3, 5] })
    expect(blocoOccursOn(b, '2026-11-02')).toBe(true)
    expect(blocoOccursOn(b, '2026-11-03')).toBe(false)
    expect(blocoOccursOn(b, '2026-11-04')).toBe(true)
    expect(blocoOccursOn(b, '2026-11-01')).toBe(false)
  })

  it('respeita a cada N semanas e a data final', () =>
  {
    const b = bloco({ repete: 'semanal', diasSemana: [1], intervaloSemanas: 2, repeteAte: '2026-11-30' })
    expect(blocoOccursOn(b, '2026-11-09')).toBe(false)
    expect(blocoOccursOn(b, '2026-11-16')).toBe(true)
    expect(blocoOccursOn(b, '2026-11-30')).toBe(true)
    expect(blocoOccursOn(b, '2026-12-14')).toBe(false)
  })

  it('usa a hora mudada só naquele dia', () =>
  {
    const b = bloco({ repete: 'diario' })
    const occ = expandBlocos([b], [{ blocoId: 'b1', dia: '2026-11-03', status: null, horaMinutos: 9 * 60 }], '2026-11-02', '2026-11-04')
    expect(occ.map((o) => o.inicio)).toEqual([420, 540, 420])
  })

  it('acusa conflito e ignora quando só encosta', () =>
  {
    const academia = bloco({ repete: 'semanal', diasSemana: [1, 3, 5] })
    const others = expandBlocos([academia], [], '2026-11-02', '2026-11-15')
    const consulta = bloco({ id: 'b2', titulo: 'Consulta', dataInicio: '2026-11-04', horaMinutos: 7 * 60 + 30 })
    expect(blocoConflicts(consulta, others, [], '2026-11-02')).toEqual([{ dia: '2026-11-04', titulo: 'Academia', inicio: 420 }])
    const depois = bloco({ id: 'b3', dataInicio: '2026-11-04', horaMinutos: 8 * 60 })
    expect(blocoConflicts(depois, others, [], '2026-11-02')).toEqual([])
  })

  it('sugere o primeiro horário livre depois do conflito', () =>
  {
    const others = expandBlocos([bloco({})], [], '2026-11-02', '2026-11-02')
    expect(nextFreeSlot('2026-11-02', 60, others, [], { from: 7 * 60 + 30 })).toBe(8 * 60)
  })
})

describe('parseBlocoFala', () =>
{
  it('entende dias e hora', () =>
  {
    expect(parseBlocoFala('academia seg qua sex 7h')).toEqual({
      titulo: 'Academia',
      horaMinutos: 420,
      duracaoMinutos: 60,
      repete: 'semanal',
      diasSemana: [1, 3, 5],
      intervaloSemanas: 1,
    })
  })

  it('entende todo dia, duracao e a cada N semanas', () =>
  {
    expect(parseBlocoFala('remédio todo dia às 8h por 15 min')).toMatchObject({ titulo: 'Remédio', horaMinutos: 480, duracaoMinutos: 15, repete: 'diario' })
    expect(parseBlocoFala('inglês toda terça às 19h30 por 1h a cada 2 semanas')).toMatchObject({
      titulo: 'Inglês',
      horaMinutos: 1170,
      duracaoMinutos: 60,
      diasSemana: [2],
      intervaloSemanas: 2,
    })
    expect(parseBlocoFala('yoga fim de semana 9h')).toMatchObject({ titulo: 'Yoga', diasSemana: [6, 0], horaMinutos: 540 })
    expect(parseBlocoFala('trabalho dias úteis 9h por 8h')).toMatchObject({ titulo: 'Trabalho', diasSemana: [1, 2, 3, 4, 5], horaMinutos: 540, duracaoMinutos: 480 })
    expect(parseBlocoFala('trabalho de segunda a sexta 9h por 8h')).toMatchObject({ titulo: 'Trabalho', diasSemana: [1, 2, 3, 4, 5], duracaoMinutos: 480 })
  })

  it('sem repeticao continua sendo tarefa', () =>
  {
    expect(parseBlocoFala('ligar para a mãe amanhã 18h')).toBeNull()
    expect(parseBlocoFala('dentista quinta 15h')).toBeNull()
    expect(parseBlocoFala('inglês às terças 19h')).toMatchObject({ titulo: 'Inglês', repete: 'semanal', diasSemana: [2], horaMinutos: 1140 })
  })
})

describe('encaixe e resumo', () =>
{
  it('encaixa o flexivel depois do fixo e conta conflitos', () =>
  {
    const fixo = bloco({ id: 'f', dataInicio: '2026-11-04', horaMinutos: 8 * 60 })
    const estudar = bloco({ id: 'e', titulo: 'Estudar', tipo: 'flexivel', dataInicio: '2026-11-04', horaMinutos: null })
    const occ = expandBlocos([fixo, estudar], [], '2026-11-04', '2026-11-04')
    expect(fitFlexiveis('2026-11-04', occ, [])).toEqual([{ blocoId: 'e', horaMinutos: 9 * 60 }])
    const outro = bloco({ id: 'o', titulo: 'Reunião', dataInicio: '2026-11-04', horaMinutos: 8 * 60 + 30 })
    const r = resumoDia('2026-11-04', expandBlocos([fixo, outro, estudar], [], '2026-11-04', '2026-11-04'), [])
    expect(r.total).toBe(3)
    expect(r.conflitos).toBe(1)
    expect(r.livre).toEqual({ inicio: 9 * 60 + 30, fim: 21 * 60 })
  })
})
