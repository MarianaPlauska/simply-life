import {
  blocoConflicts,
  blocoOccursOn,
  expandBlocos,
  fitFlexiveis,
  nextFreeSlot,
  parseBlocoFala,
  resumoDia,
  rotinaDaSugestao,
  rotinaSugestaoTexto,
  sugerirRotinas,
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

describe('sugerirRotinas', () =>
{
  const hoje = '2026-11-06' // sexta
  const solto = (id: string, dia: string, hora = 7 * 60, titulo = 'Academia') =>
    bloco({ id, dataInicio: dia, horaMinutos: hora, titulo, avisoMinutos: 10 })

  it('3 segundas no mesmo horario viram sugestao', () =>
  {
    const bs = [solto('a', '2026-10-19'), solto('b', '2026-10-26', 7 * 60 + 15, 'academia'), solto('c', '2026-11-02'), solto('d', '2026-11-09')]
    const [s] = sugerirRotinas(bs, hoje)
    expect(s.diasSemana).toEqual([1])
    expect(s.horaMinutos).toBe(7 * 60)
    expect(s.vezes).toBe(3)
    expect(s.futuros).toEqual(['d'])
    expect(rotinaSugestaoTexto(s)).toEqual({
      frase: 'Você colocou Academia às 7h nas últimas 3 segundas. Quer que isso se repita?',
      botao: 'Repetir toda segunda',
    })
    const r = rotinaDaSugestao(s, 'novo', hoje)
    expect(r).toMatchObject({ id: 'novo', repete: 'semanal', diasSemana: [1], dataInicio: '2026-11-07', avisoMinutos: 10 })
  })

  it('junta dias diferentes no mesmo horario', () =>
  {
    const dias = ['2026-10-19', '2026-10-26', '2026-11-02', '2026-10-21', '2026-10-28', '2026-11-04', '2026-10-23', '2026-10-30', '2026-11-06']
    const [s, ...resto] = sugerirRotinas(dias.map((d, i) => solto(String(i), d)), hoje)
    expect(resto).toHaveLength(0)
    expect(s.diasSemana).toEqual([1, 3, 5])
    expect(rotinaSugestaoTexto(s).botao).toBe('Repetir seg, qua e sex')
  })

  it('nao sugere com menos de 3, horario longe, ja repetindo ou dispensada', () =>
  {
    expect(sugerirRotinas([solto('a', '2026-10-26'), solto('b', '2026-11-02')], hoje)).toEqual([])
    expect(sugerirRotinas([solto('a', '2026-10-19'), solto('b', '2026-10-26', 9 * 60), solto('c', '2026-11-02')], hoje)).toEqual([])
    const tres = [solto('a', '2026-10-19'), solto('b', '2026-10-26'), solto('c', '2026-11-02')]
    expect(sugerirRotinas([...tres, bloco({ id: 'r', repete: 'semanal', diasSemana: [1], dataInicio: '2026-11-09' })], hoje)).toEqual([])
    expect(sugerirRotinas(tres, hoje, ['academia|420'])).toEqual([])
    expect(sugerirRotinas([solto('x', '2026-09-07'), ...tres.slice(1)], hoje)).toEqual([])
  })

  it('a cada 15 dias vira sugestao quinzenal e comeca na semana certa', () =>
  {
    const bs = [solto('a', '2026-09-28', 19 * 60, 'Terapia'), solto('b', '2026-10-12', 19 * 60, 'Terapia'), solto('c', '2026-10-26', 19 * 60, 'Terapia'), solto('d', '2026-11-09', 19 * 60, 'Terapia'), solto('e', '2026-11-16', 19 * 60, 'Terapia')]
    const [s] = sugerirRotinas(bs, hoje)
    expect(s.intervaloSemanas).toBe(2)
    expect(s.futuros).toEqual(['d'])
    expect(rotinaSugestaoTexto(s)).toEqual({
      frase: 'Você colocou Terapia às 19h a cada 15 dias, na segunda. Quer que isso se repita?',
      botao: 'Repetir a cada 15 dias',
    })
    const r = rotinaDaSugestao(s, 'n', hoje)
    expect(r.dataInicio).toBe('2026-11-09')
    expect(r.intervaloSemanas).toBe(2)
  })

  it('conta tarefas com data e hora', () =>
  {
    const tarefa = (id: string, dia: string) => ({
      id, titulo: 'Inglês', status: 'done' as const, dataVencimento: dia, horaMinutos: 18 * 60,
      estimativaMinutos: 45, progresso: 0, checklist: [], anotacao: '', prioridade: 2 as const,
    })
    const [s] = sugerirRotinas([], hoje, [], [tarefa('1', '2026-10-21'), tarefa('2', '2026-10-28'), tarefa('3', '2026-11-04')])
    expect(s.diasSemana).toEqual([3])
    expect(rotinaDaSugestao(s, 'n', hoje)).toMatchObject({ titulo: 'Inglês', duracaoMinutos: 45, repete: 'semanal' })
  })
})
