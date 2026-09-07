/** Preferência de teto de push guardada em user_workspace_prefs.prefs */

const BATCH_HOURS = [9, 15, 21]
const ONCE_HOUR = 11
const QUIET_START = 22
const QUIET_END = 8

export function prefsNotifyCadence(prefs)
{
  const value = prefs?.notify_cadence
  if (value === 'off' || value === 'once' || value === 'batch3')
  {
    return value
  }
  return 'once'
}

function isQuietNotifyHour(hour)
{
  return hour >= QUIET_START || hour < QUIET_END
}

function isBatchWindowHour(hour)
{
  return BATCH_HOURS.some((h) => Math.abs(hour - h) <= 1)
}

function isOnceWindowHour(hour)
{
  return hour >= ONCE_HOUR - 1 && hour <= ONCE_HOUR + 1
}

/** 22h–8h: sem humor nem boleto. Medicamento continua. */
export function isQuietPushHour(now = new Date())
{
  return isQuietNotifyHour(now.getHours())
}

export function canPushWellbeing(prefs, now = new Date())
{
  const cadence = prefsNotifyCadence(prefs)
  const hour = now.getHours()
  if (cadence === 'off' || isQuietNotifyHour(hour)) return false
  if (cadence === 'batch3') return isBatchWindowHour(hour)
  if (cadence === 'once') return isOnceWindowHour(hour)
  return false
}

export function canPushFinance(prefs, now = new Date())
{
  return canPushWellbeing(prefs, now)
}
