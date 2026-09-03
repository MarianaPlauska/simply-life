/** Data+hora local em ISO - `data_vencimento` não tem coluna `hora` à parte */

export function localDateTimeIso(dateIso: string, hora: string | null): string
{
  const [y, mo, d] = dateIso.split('-').map((n) => parseInt(n, 10))
  if (!hora)
  {
    return dateIso
  }
  const [hh, mm] = hora.split(':').map((n) => parseInt(n, 10))
  const dt = new Date(y, mo - 1, d, hh || 0, mm || 0, 0)
  return dt.toISOString()
}

export function dateIsoFromDue(dataVencimento: string | null): string | null
{
  if (!dataVencimento) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataVencimento)) return dataVencimento
  const dt = new Date(dataVencimento)
  if (Number.isNaN(dt.getTime())) return null
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const d = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** True se o timestamp guarda relógio (não só o dia) */
export function hasClockTime(dataVencimento: string | null): boolean
{
  if (!dataVencimento || !dataVencimento.includes('T')) return false
  const dt = new Date(dataVencimento)
  if (Number.isNaN(dt.getTime())) return false
  return dt.getHours() !== 0 || dt.getMinutes() !== 0
}

export function clockLabel(dataVencimento: string | null): string
{
  if (!hasClockTime(dataVencimento) || !dataVencimento) return 'o dia'
  const dt = new Date(dataVencimento)
  const hh = String(dt.getHours()).padStart(2, '0')
  const mm = String(dt.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}
