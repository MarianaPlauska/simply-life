// Preferências aprendidas com drags manuais - Axel sugere, usuário ajusta

const STORAGE_KEY = 'axel-drag-prefs-v1'
const MAX_SAMPLES = 40

interface DragSample
{
  horizon: 'hoje' | 'semana' | 'backlog'
  tag: string
  at: string
}

function loadSamples(): DragSample[]
{
  try
  {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as DragSample[]
  }
  catch
  {
    return []
  }
}

function saveSamples(samples: DragSample[]): void
{
  localStorage.setItem(STORAGE_KEY, JSON.stringify(samples.slice(0, MAX_SAMPLES)))
}

function extractTag(titulo: string): string
{
  const bracket = titulo.match(/\[(SST|FINALLY|HUB|CORE|AXEL)\]/i)
  if (bracket) return bracket[1].toUpperCase()
  const words = titulo.toLowerCase()
  if (words.includes('cliente')) return 'cliente'
  if (words.includes('fyi') || words.includes('alinhamento')) return 'fyi'
  return 'geral'
}

/** Registra quando o usuário move manualmente - padrão para futuras sugestões */
export function recordDragPreference(titulo: string, horizon: DragSample['horizon']): void
{
  const samples = loadSamples()
  samples.unshift({
    horizon,
    tag: extractTag(titulo),
    at: new Date().toISOString(),
  })
  saveSamples(samples)
}

/** Bônus leve se o usuário costuma colocar tarefas similares em Hoje */
export function getDragLearningBoost(titulo: string): number
{
  const tag = extractTag(titulo)
  const samples = loadSamples().filter((s) => s.tag === tag)
  if (samples.length < 3) return 0

  const hojeCount = samples.filter((s) => s.horizon === 'hoje').length
  const ratio = hojeCount / samples.length
  if (ratio >= 0.7) return 6
  if (ratio >= 0.5) return 3
  return 0
}

export function getDragLearningHint(titulo: string): string | null
{
  const tag = extractTag(titulo)
  const samples = loadSamples().filter((s) => s.tag === tag)
  if (samples.length < 3) return null

  const hojeCount = samples.filter((s) => s.horizon === 'hoje').length
  const ratio = hojeCount / samples.length
  if (ratio >= 0.6)
  {
    return `Você costuma colocar demandas [${tag}] em Hoje - AXEL considerou isso.`
  }
  return null
}
