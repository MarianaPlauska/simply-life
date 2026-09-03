const KEY_PREFIX = 'simply-life-finance-hide-values'

function storageKey(uid: string | null): string
{
  return uid ? `${KEY_PREFIX}:${uid}` : `${KEY_PREFIX}:anonymous`
}

/** Preferência local - ocultar valores monetários na tela de Finanças */
export function readFinanceHideValues(uid: string | null): boolean
{
  try
  {
    return localStorage.getItem(storageKey(uid)) === '1'
  }
  catch
  {
    return false
  }
}

export function writeFinanceHideValues(uid: string | null, hidden: boolean): void
{
  try
  {
    localStorage.setItem(storageKey(uid), hidden ? '1' : '0')
  }
  catch
  {
    /* quota / modo privado */
  }
}

export function maskFinanceValue(hidden: boolean, formatted: string): string
{
  return hidden ? '•••••' : formatted
}
