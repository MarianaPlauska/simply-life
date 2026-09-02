/** Feedback tátil discreto — no-op se a Vibration API não existir */
export function hapticTap(ms = 12): void
{
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function')
  {
    return
  }
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('reduce-motion'))
  {
    return
  }
  try
  {
    navigator.vibrate(ms)
  }
  catch
  {
    /* Safari desktop / permissão */
  }
}
