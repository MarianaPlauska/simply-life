// Descanso no Modo Academia - wake lock, título da aba e notificação

import { showHealthNotification } from './healthNotifications'

let wakeLock: WakeLockSentinel | null = null
let defaultTitle = ''

export async function acquireAcademyWakeLock(): Promise<boolean>
{
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator))
  {
    return false
  }
  try
  {
    wakeLock = await navigator.wakeLock.request('screen')
    wakeLock.addEventListener('release', () =>
    {
      wakeLock = null
    })
    return true
  }
  catch
  {
    return false
  }
}

export async function releaseAcademyWakeLock(): Promise<void>
{
  try
  {
    await wakeLock?.release()
  }
  catch
  {
    /* já liberado */
  }
  wakeLock = null
}

export function setRestTabTitle(secondsLeft: number, proximoExercicio: string): void
{
  if (typeof document === 'undefined')
  {
    return
  }
  if (!defaultTitle)
  {
    defaultTitle = document.title
  }
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  document.title = `⏱ ${mm}:${ss} · ${proximoExercicio}`
}

export function resetAcademyTabTitle(): void
{
  if (typeof document === 'undefined' || !defaultTitle)
  {
    return
  }
  document.title = defaultTitle
}

export async function notifyRestComplete(proximoExercicio: string): Promise<void>
{
  await showHealthNotification({
    title: 'Descanso concluído',
    body: `Próximo: ${proximoExercicio}`,
    url: '/saude#academia',
    tag: 'academy-rest-done',
  })
}

export async function notifyRestStarted(segundos: number, proximoApos: string): Promise<void>
{
  await showHealthNotification({
    title: `Descanso · ${segundos}s`,
    body: `Depois: ${proximoApos}`,
    url: '/saude#academia',
    tag: 'academy-rest-active',
  })
}
