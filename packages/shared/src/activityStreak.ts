import { isoDaysAgo, todayIso } from './dates'

export function uniqueIsoDates(values: Array<string | undefined | null>): string[]
{
  const set = new Set<string>()
  for (const v of values)
  {
    if (!v) continue
    const iso = v.slice(0, 10)
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso))
    {
      set.add(iso)
    }
  }
  return [...set].sort()
}

export function consecutiveActivity(
  isoDates: string[],
  ref = new Date(),
  windowDays = 30,
): { current: number; record: number; weekLogged: number }
{
  const set = new Set(isoDates)
  const today = todayIso(ref)
  let cursor = today
  if (!set.has(cursor))
  {
    cursor = isoDaysAgo(1, ref)
  }

  let current = 0
  while (set.has(cursor))
  {
    current += 1
    const d = new Date(`${cursor}T12:00:00`)
    d.setDate(d.getDate() - 1)
    cursor = d.toISOString().slice(0, 10)
  }

  let record = 0
  let run = 0
  for (let i = windowDays - 1; i >= 0; i -= 1)
  {
    const iso = isoDaysAgo(i, ref)
    if (set.has(iso))
    {
      run += 1
      if (run > record)
      {
        record = run
      }
    }
    else
    {
      run = 0
    }
  }

  let weekLogged = 0
  for (let i = 0; i < 7; i += 1)
  {
    if (set.has(isoDaysAgo(i, ref)))
    {
      weekLogged += 1
    }
  }

  return { current, record: Math.max(record, current), weekLogged }
}

export function streakPhrase(current: number, weekLogged: number): string
{
  if (current <= 0)
  {
    return 'Ainda sem sequência. Um registro hoje já começa o ritmo.'
  }
  if (weekLogged >= 7)
  {
    return `Você manteve o ritmo por ${current} dias. Semana completa de registros.`
  }
  if (current === 1)
  {
    return 'Primeiro dia. Um registro por dia essa semana.'
  }
  return `Você manteve o ritmo por ${current} dias. Um registro por dia essa semana.`
}
