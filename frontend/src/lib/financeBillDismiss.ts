const DISMISS_KEY = 'axel_fin_dismissed_bills'
const NOTIF_KEY = 'axel_fin_due_notif_sent'

function readSet(key: string): Set<string>
{
  try
  {
    const raw = localStorage.getItem(key)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  }
  catch
  {
    return new Set()
  }
}

function writeSet(key: string, set: Set<string>): void
{
  localStorage.setItem(key, JSON.stringify([...set]))
}

export function monthDismissKey(ref = new Date()): string
{
  return `${ref.getFullYear()}-${ref.getMonth()}`
}

export function billPeriodKey(billId: string, ref = new Date()): string
{
  return `${billId}:${monthDismissKey(ref)}`
}

export function isBillDismissed(billId: string, ref = new Date()): boolean
{
  return readSet(DISMISS_KEY).has(billPeriodKey(billId, ref))
}

export function dismissBill(billId: string, ref = new Date()): void
{
  const set = readSet(DISMISS_KEY)
  set.add(billPeriodKey(billId, ref))
  writeSet(DISMISS_KEY, set)
}

export function wasDueNotifSent(billId: string, ref = new Date()): boolean
{
  return readSet(NOTIF_KEY).has(billPeriodKey(billId, ref))
}

export function markDueNotifSent(billId: string, ref = new Date()): void
{
  const set = readSet(NOTIF_KEY)
  set.add(billPeriodKey(billId, ref))
  writeSet(NOTIF_KEY, set)
}
