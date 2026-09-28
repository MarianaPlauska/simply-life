import {
  DUMP_LOW_CONFIDENCE,
  classifyDump,
  classifyDumpLine,
  mergeDumpAi,
  normalizeAiDumpItem,
  parseWrittenNumberPt,
  splitDumpLines,
  type DumpItem,
} from '../dumpCapture'
import { DUMP_CORPUS, DUMP_REF, HOJE, USER_PHRASES, type DumpCase } from './dumpCorpus'

const ctx = { ref: DUMP_REF }
const DASHES = /[—–−]/

function hhmm(min: number | null): string | null
{
  if (min == null) return null
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
}

function check(c: DumpCase, it: DumpItem): void
{
  const where = `"${c.linha}" => ${JSON.stringify({ kind: it.kind, titulo: it.titulo, valor: it.valor, data: it.data, hora: hhmm(it.horaMinutos), conf: it.confianca, motivo: it.motivo, checklist: it.checklist })}`
  if (c.low) expect(it.confianca, where).toBeLessThan(DUMP_LOW_CONFIDENCE)
  if (c.kind) expect(it.kind, where).toBe(c.kind)
  if (c.kind && !c.low && c.kind !== 'tarefa') expect(it.confianca, where).toBeGreaterThanOrEqual(DUMP_LOW_CONFIDENCE)
  if ('valor' in c) expect(it.valor, where).toBe(c.valor)
  else if (c.kind === 'tarefa' || c.kind === 'lembrete') expect(it.valor, where).toBeNull()
  if ('data' in c) expect(it.data, where).toBe(c.data)
  if ('hora' in c) expect(hhmm(it.horaMinutos), where).toBe(c.hora)
  if (c.titulo) expect(it.titulo, where).toBe(c.titulo)
  if (c.checklist) expect(it.checklist, where).toEqual(c.checklist)
  if ('categoria' in c) expect(it.categoria, where).toBe(c.categoria)
  expect(it.motivo.length, where).toBeGreaterThan(0)
  expect(DASHES.test(it.motivo) || DASHES.test(it.titulo), where).toBe(false)
  expect(it.confianca).toBeGreaterThanOrEqual(0)
  expect(it.confianca).toBeLessThanOrEqual(1)
  expect(it.source).toBe('local')
}

describe('frases reais da usuária', () =>
{
  for (const c of USER_PHRASES)
  {
    it(c.linha, () =>
    {
      const item = classifyDumpLine(c.linha, ctx)
      check(c, item)
      expect(item.confianca).toBeGreaterThanOrEqual(0.8)
    })
  }
})

describe('corpus do Dump', () =>
{
  for (const c of DUMP_CORPUS)
  {
    it(c.linha, () => check(c, classifyDumpLine(c.linha, ctx)))
  }

  it('tem pelo menos 150 linhas', () =>
  {
    expect(DUMP_CORPUS.length).toBeGreaterThanOrEqual(150)
  })
})

describe('utilidades', () =>
{
  it('divide linhas e numera as chaves', () =>
  {
    expect(splitDumpLines('a\n\n b \n')).toEqual(['a', 'b'])
    const items = classifyDump('uber 23\nligar pro joão às 15h', ctx)
    expect(items.map((i) => i.key)).toEqual(['dump-0', 'dump-1'])
    expect(items.map((i) => i.kind)).toEqual(['gasto', 'tarefa'])
  })

  it('é determinístico', () =>
  {
    const a = classifyDumpLine('almoço com a marianna no subway na quarta/feira', ctx)
    const b = classifyDumpLine('almoço com a marianna no subway na quarta/feira', ctx)
    expect(a).toEqual(b)
  })

  it('lê números por extenso', () =>
  {
    expect(parseWrittenNumberPt('vinte e cinco')).toBe(25)
    expect(parseWrittenNumberPt('doze e cinquenta')).toBe(12.5)
    expect(parseWrittenNumberPt('cento e vinte')).toBe(120)
    expect(parseWrittenNumberPt('dois mil e quinhentos')).toBe(2500)
    expect(parseWrittenNumberPt('mil')).toBe(1000)
  })

  it('hora de almoço é sugerida, não dita', () =>
  {
    const a = classifyDumpLine('almoço com a marianna no subway na quarta/feira', ctx)
    expect(a.horaSugerida).toBe(true)
    expect(classifyDumpLine('ligar pro joão às 15h', ctx).horaSugerida).toBeUndefined()
  })
})

describe('normalizeAiDumpItem', () =>
{
  it('aceita um item válido da IA', () =>
  {
    const a = normalizeAiDumpItem(
      { kind: 'gasto', titulo: 'Presente da mãe', valor: '80,00', categoria: 'compras', data: HOJE, hora: null, confianca: 0.9, motivo: 'presente com valor — já comprado' },
      'presente mãe 80',
      ctx,
      3,
    )
    expect(a.source).toBe('ia')
    expect(a.key).toBe('dump-3')
    expect(a.kind).toBe('gasto')
    expect(a.valor).toBe(80)
    expect(a.categoria).toBe('compras')
    expect(DASHES.test(a.motivo)).toBe(false)
  })

  it('limpa campos inválidos e cai na leitura local', () =>
  {
    const a = normalizeAiDumpItem(
      { kind: 'tarefa', titulo: '', valor: 999, categoria: 'x', data: '2099-01-01', hora: '25:99', checklist: ['a', 'Leite', 3], confianca: 7 },
      'comprar leite amanhã',
      ctx,
    )
    expect(a.kind).toBe('tarefa')
    expect(a.titulo).toBe('Comprar leite')
    expect(a.valor).toBeNull()
    expect(a.categoria).toBeNull()
    expect(a.data).toBe('2026-09-29')
    expect(a.horaMinutos).toBeNull()
    expect(a.checklist).toEqual(['Leite'])
    expect(a.confianca).toBe(1)
  })

  it('tipo inválido devolve a leitura local', () =>
  {
    const a = normalizeAiDumpItem({ kind: 'investimento' }, 'uber 23', ctx)
    expect(a.source).toBe('local')
    expect(a.kind).toBe('gasto')
    expect(normalizeAiDumpItem(null, 'uber 23', ctx).source).toBe('local')
  })

  it('mergeDumpAi só troca as linhas de baixa confiança', () =>
  {
    const items = classifyDump('uber 23\nJoão 50', ctx)
    const merged = mergeDumpAi(items, {
      source: 'groq',
      iaDisponivel: true,
      items: [
        { linha: 'uber 23', kind: 'receita', valor: 23, confianca: 0.9 },
        { linha: 'João 50', kind: 'conta', valor: 50, titulo: 'Pagar João', confianca: 0.7, motivo: 'parece dívida' },
      ],
    }, ctx)
    expect(merged[0]).toEqual(items[0])
    expect(merged[1].kind).toBe('conta')
    expect(merged[1].source).toBe('ia')
    expect(merged[1].key).toBe('dump-1')
  })
})
