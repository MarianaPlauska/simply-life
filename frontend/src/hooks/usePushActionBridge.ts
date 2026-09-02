import { useEffect } from 'react'
import { handlePushActionMessage } from '../lib/pushActionClient'

/** Sincroniza ações de push (Feito / Adiar) com o store quando o app está aberto */
export function usePushActionBridge(): void
{
  useEffect(() =>
  {
    if (!('serviceWorker' in navigator))
    {
      return
    }

    const onMessage = (event: MessageEvent) =>
    {
      const data = event.data
      if (data?.type !== 'push-action')
      {
        return
      }
      void handlePushActionMessage(data)
    }

    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [])
}
