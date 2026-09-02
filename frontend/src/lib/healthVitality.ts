import { localTodayIso } from './healthDayBoundary'

const STORAGE_KEY = 'sl-health-vitality-display'

interface VitalityDayState
{
  date: string
  percent: number
}

type CareListener = () => void
const careListeners = new Set<CareListener>()

/** Dispara feedback visual imediato (pulso) — não altera o percentual sozinho */
export function emitCareRegistered(): void
{
  for (const listener of careListeners)
  {
    listener()
  }
}

export function onCareRegistered(listener: CareListener): () => void
{
  careListeners.add(listener)
  return () =>
  {
    careListeners.delete(listener)
  }
}

function readState(): VitalityDayState
{
  try
  {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw)
    {
      return { date: localTodayIso(), percent: 0 }
    }
    const parsed = JSON.parse(raw) as VitalityDayState
    if (parsed.date !== localTodayIso())
    {
      return { date: localTodayIso(), percent: 0 }
    }
    return parsed
  }
  catch
  {
    return { date: localTodayIso(), percent: 0 }
  }
}

function writeState(state: VitalityDayState): void
{
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

/** Percentual exibido — só sobe no dia; nunca desce por desfazer ou ausência */
export function mergeVitalityDisplay(livePercent: number): number
{
  const today = localTodayIso()
  const state = readState()
  const floor = state.date === today ? state.percent : 0
  const next = Math.max(floor, Math.min(100, Math.round(livePercent)))
  if (next !== floor || state.date !== today)
  {
    writeState({ date: today, percent: next })
  }
  return next
}

export function vitalityCompanionLine(displayPercent: number, allDone: boolean): string
{
  if (allDone)
  {
    return 'Seu cuidado de hoje está registrado — descanse se puder.'
  }
  if (displayPercent <= 0)
  {
    return 'Quando fizer sentido, um passo de cada vez.'
  }
  if (displayPercent < 40)
  {
    return 'Cada registro conta — sem pressa.'
  }
  if (displayPercent < 80)
  {
    return 'Você está cuidando de si hoje.'
  }
  return 'Quase lá — no seu ritmo.'
}
