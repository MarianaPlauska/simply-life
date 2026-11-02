/**
 * "O que mexe com você": cruza sono, água, treino, humor, gastos e tarefas
 * do mesmo dia e mostra onde um muda junto com o outro.
 * Compara a média de um resultado nos dias COM uma condição e nos dias SEM ela.
 * Mostra só diferenças grandes, com dias suficientes dos dois lados.
 * É correlação nos registros da própria pessoa, não prova de causa.
 */

/** Valor por dia, chave 'AAAA-MM-DD' */
export type DaySeries = Record<string, number>

export type LifeSeries = {
  sleep: DaySeries
  water: DaySeries
  workout: DaySeries
  mood: DaySeries
  spend: DaySeries
  tasksDone: DaySeries
}

export type LifePatternOutcome = 'spend' | 'tasksDone' | 'mood'

export type LifePattern = {
  id: string
  text: string
  /** "Com base em 9 dias com e 14 sem" */
  basis: string
  strength: 'forte' | 'inicial'
  outcome: LifePatternOutcome
  /** diferença relativa (gasto, tarefas) ou em pontos (humor), para ordenar */
  effect: number
  daysWith: number
  daysWithout: number
}

type Condition = {
  id: string
  /** começo da frase: "Nos dias com treino" */
  label: string
  test: (s: LifeSeries, day: string) => boolean | null
  outcomes: LifePatternOutcome[]
}

export const LIFE_PATTERN_MIN_DAYS = 4
const STRONG_DAYS = 8
const MIN_RELATIVE = 0.2
const MIN_MOOD_POINTS = 0.5

function has(series: DaySeries, day: string): boolean
{
  return Object.prototype.hasOwnProperty.call(series, day)
}

function quantile(values: number[], q: number): number
{
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]
}

function mean(values: number[]): number
{
  return values.reduce((a, b) => a + b, 0) / values.length
}

function conditions(s: LifeSeries): Condition[]
{
  const spendDays = Object.values(s.spend).filter((v) => v > 0)
  const highSpend = spendDays.length >= LIFE_PATTERN_MIN_DAYS * 2 ? quantile(spendDays, 0.75) : Infinity
  return [
    {
      id: 'sono-curto',
      label: 'Nos dias depois de dormir menos de 6h',
      test: (x, d) => (has(x.sleep, d) && x.sleep[d] > 0 ? x.sleep[d] < 6 : null),
      outcomes: ['spend', 'tasksDone', 'mood'],
    },
    {
      id: 'treino',
      label: 'Nos dias com treino',
      // treino só conta onde a pessoa registra treino em algum dia
      test: (x, d) => (Object.keys(x.workout).length ? (x.workout[d] ?? 0) > 0 : null),
      outcomes: ['tasksDone', 'mood', 'spend'],
    },
    {
      id: 'agua',
      label: 'Nos dias em que você bebe 6 copos de água ou mais',
      test: (x, d) => (has(x.water, d) ? x.water[d] >= 6 : null),
      outcomes: ['mood', 'tasksDone'],
    },
    {
      id: 'gasto-alto',
      label: 'Nos dias de gasto mais alto',
      test: (x, d) => (Number.isFinite(highSpend) && has(x.spend, d) ? x.spend[d] >= highSpend : null),
      outcomes: ['mood'],
    },
  ]
}

function outcomeValue(s: LifeSeries, outcome: LifePatternOutcome, day: string): number | null
{
  if (outcome === 'mood') return has(s.mood, day) ? s.mood[day] : null
  // gasto e tarefas: dia sem registro conta como zero, mas só dentro do período com dados
  if (outcome === 'spend') return s.spend[day] ?? 0
  return s.tasksDone[day] ?? 0
}

function phrase(label: string, outcome: LifePatternOutcome, withAvg: number, withoutAvg: number): { text: string; effect: number } | null
{
  if (outcome === 'mood')
  {
    const diff = withAvg - withoutAvg
    if (Math.abs(diff) < MIN_MOOD_POINTS) return null
    const pts = Math.abs(diff).toFixed(1).replace('.', ',')
    return {
      text: `${label}, seu humor fica ${pts} ponto${Math.abs(diff) >= 1.05 ? 's' : ''} ${diff > 0 ? 'acima' : 'abaixo'} do normal.`,
      effect: Math.abs(diff) / 2,
    }
  }
  if (withoutAvg <= 0) return null
  const rel = withAvg / withoutAvg - 1
  if (Math.abs(rel) < MIN_RELATIVE) return null
  const what = outcome === 'spend' ? 'gasta' : 'conclui'
  const tail = outcome === 'spend' ? '' : ' tarefas'
  if (rel >= 1)
  {
    const x = (withAvg / withoutAvg).toFixed(1).replace('.', ',').replace(',0', '')
    return { text: `${label}, você ${what} ${x} vezes mais${tail}.`, effect: rel }
  }
  const pct = Math.round(Math.abs(rel) * 100)
  return { text: `${label}, você ${what} ${pct}% ${rel > 0 ? 'mais' : 'menos'}${tail}.`, effect: Math.abs(rel) }
}

/** Dias com algum registro, em ordem */
export function lifePatternDays(s: LifeSeries): string[]
{
  const all = new Set<string>()
  for (const series of Object.values(s)) for (const d of Object.keys(series)) all.add(d)
  return [...all].sort()
}

export function findLifePatterns(s: LifeSeries, limit = 6): LifePattern[]
{
  const days = lifePatternDays(s)
  const found: LifePattern[] = []

  for (const c of conditions(s))
  {
    for (const outcome of c.outcomes)
    {
      const withVals: number[] = []
      const withoutVals: number[] = []
      for (const d of days)
      {
        const cond = c.test(s, d)
        if (cond === null) continue
        const v = outcomeValue(s, outcome, d)
        if (v === null) continue
        ;(cond ? withVals : withoutVals).push(v)
      }
      if (withVals.length < LIFE_PATTERN_MIN_DAYS || withoutVals.length < LIFE_PATTERN_MIN_DAYS) continue
      const p = phrase(c.label, outcome, mean(withVals), mean(withoutVals))
      if (!p) continue
      const small = Math.min(withVals.length, withoutVals.length)
      found.push({
        id: `${c.id}:${outcome}`,
        text: p.text,
        basis: `Com base em ${withVals.length} dias com e ${withoutVals.length} sem`,
        strength: small >= STRONG_DAYS ? 'forte' : 'inicial',
        outcome,
        effect: p.effect,
        daysWith: withVals.length,
        daysWithout: withoutVals.length,
      })
    }
  }

  return found
    .sort((a, b) => (a.strength === b.strength ? b.effect - a.effect : a.strength === 'forte' ? -1 : 1))
    .slice(0, limit)
}
