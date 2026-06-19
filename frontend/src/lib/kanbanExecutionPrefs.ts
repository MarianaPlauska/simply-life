const PINS_KEY = 'simply-life-kanban-exec-pins'

export function loadExecutionPins(): number[]
{
  try
  {
    const raw = localStorage.getItem(PINS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as number[]
    return Array.isArray(parsed) ? parsed : []
  }
  catch
  {
    return []
  }
}

export function saveExecutionPins(ids: number[]): void
{
  localStorage.setItem(PINS_KEY, JSON.stringify(ids))
}

export function setExecutionPins(ids: number[]): void
{
  saveExecutionPins(ids)
}

export function removeExecutionPin(taskId: number): number[]
{
  const next = loadExecutionPins().filter((id) => id !== taskId)
  saveExecutionPins(next)
  return next
}

export function reorderExecutionPins(taskId: number, direction: 'up' | 'down'): number[]
{
  const pins = loadExecutionPins()
  const idx = pins.indexOf(taskId)
  if (idx < 0) return pins
  const swap = direction === 'up' ? idx - 1 : idx + 1
  if (swap < 0 || swap >= pins.length) return pins
  const next = [...pins]
  ;[next[idx], next[swap]] = [next[swap], next[idx]]
  saveExecutionPins(next)
  return next
}

export function toggleExecutionPin(taskId: number): number[]
{
  const pins = loadExecutionPins()
  const has = pins.includes(taskId)
  const next = has ? pins.filter((id) => id !== taskId) : [taskId, ...pins]
  saveExecutionPins(next)
  return next
}

export function isExecutionPinned(taskId: number): boolean
{
  return loadExecutionPins().includes(taskId)
}
