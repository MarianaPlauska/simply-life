// Regras de quando sugerir check-in — sem culpa, sem modal bloqueante
// Baseado em episodic re-entry (ViviDiary) e check-in ativo de 3s

const SNOOZE_KEY = 'axel-wellbeing-snooze-until'
const PANEL_ONLY_KEY = 'axel-wellbeing-panel-only'
const DISMISS_KEY_PREFIX = 'axel-wellbeing-dismiss-'

export type WellbeingNudgeMode = 'none' | 'gentle' | 'returning'

export interface WellbeingNudgeDecision
{
  mode: WellbeingNudgeMode
  message: string
}

function hojeKey(): string
{
  return new Date().toISOString().slice(0, 10)
}

export function isPanelOnlyMode(): boolean
{
  return localStorage.getItem(PANEL_ONLY_KEY) === '1'
}

export function setPanelOnlyMode(enabled: boolean): void
{
  if (enabled) localStorage.setItem(PANEL_ONLY_KEY, '1')
  else localStorage.removeItem(PANEL_ONLY_KEY)
}

export function snoozeWellbeingNudge(hours: number): void
{
  const until = Date.now() + hours * 60 * 60 * 1000
  localStorage.setItem(SNOOZE_KEY, String(until))
}

export function snoozeWellbeingUntilTomorrow(): void
{
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(8, 0, 0, 0)
  localStorage.setItem(SNOOZE_KEY, String(tomorrow.getTime()))
}

function isSnoozed(): boolean
{
  const raw = localStorage.getItem(SNOOZE_KEY)
  if (!raw) return false
  const until = Number(raw)
  if (Number.isNaN(until) || until <= Date.now())
  {
    localStorage.removeItem(SNOOZE_KEY)
    return false
  }
  return true
}

function wasDismissedToday(): boolean
{
  return sessionStorage.getItem(`${DISMISS_KEY_PREFIX}${hojeKey()}`) === '1'
}

export function dismissWellbeingNudgeToday(): void
{
  sessionStorage.setItem(`${DISMISS_KEY_PREFIX}${hojeKey()}`, '1')
}

/** Horas desde o último registro */
function hoursSinceLastEntry(lastAt: string | null): number
{
  if (!lastAt) return Infinity
  const t = new Date(lastAt).getTime()
  if (Number.isNaN(t)) return Infinity
  return (Date.now() - t) / (60 * 60 * 1000)
}

/** Dias desde último registro (para re-entry sem culpa) */
export function daysSinceLastEntry(lastDate: string | null): number
{
  if (!lastDate) return Infinity
  const last = new Date(`${lastDate}T12:00:00`)
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  return Math.floor((today.getTime() - last.getTime()) / 86400000)
}

export function decideWellbeingNudge(opts: {
  entriesTodayCount: number
  lastEntryAt: string | null
  lastEntryDate: string | null
  onDashboard: boolean
}): WellbeingNudgeDecision
{
  if (!opts.onDashboard) return { mode: 'none', message: '' }
  if (isPanelOnlyMode() || isSnoozed() || wasDismissedToday())
  {
    return { mode: 'none', message: '' }
  }

  const absentDays = daysSinceLastEntry(opts.lastEntryDate)

  // Re-entry após ausência — acolhedor, sem mencionar dias perdidos
  if (absentDays >= 7)
  {
    return {
      mode: 'returning',
      message: 'Bom te ver de volta. Como você está agora?',
    }
  }

  // Já registrou nas últimas 3h — não insistir
  if (opts.entriesTodayCount > 0 && hoursSinceLastEntry(opts.lastEntryAt) < 3)
  {
    return { mode: 'none', message: '' }
  }

  // Sugestão leve: no máximo 2x por dia (manhã e tarde/noite)
  if (opts.entriesTodayCount >= 2)
  {
    return { mode: 'none', message: '' }
  }

  const hour = new Date().getHours()
  const periodLabel = hour < 12 ? 'manhã' : hour < 18 ? 'tarde' : 'noite'

  if (opts.entriesTodayCount === 0)
  {
    return {
      mode: 'gentle',
      message: `Seu humor de ${periodLabel} ainda não foi registrado — um toque ajuda o AXEL a te acolher melhor.`,
    }
  }

  return {
    mode: 'gentle',
    message: 'Quer registrar de novo? Humor muda ao longo do dia.',
  }
}
