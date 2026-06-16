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
