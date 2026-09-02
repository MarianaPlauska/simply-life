const KEY = 'axel-task-reward-ledger'

interface Grant
{
  xp: number
  ouro: number
}

function readAll(): Record<string, Grant>
{
  try
  {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Record<string, Grant>
  }
  catch
  {
    return {}
  }
}

export function rememberTaskGrant(taskId: number, grant: Grant): void
{
  const all = readAll()
  all[String(taskId)] = grant
  try
  {
    localStorage.setItem(KEY, JSON.stringify(all))
  }
  catch { /* quota */ }
}

export function takeTaskGrant(taskId: number): Grant | null
{
  const all = readAll()
  const g = all[String(taskId)]
  if (!g) return null
  delete all[String(taskId)]
  try
  {
    localStorage.setItem(KEY, JSON.stringify(all))
  }
  catch { /* quota */ }
  return g
}
