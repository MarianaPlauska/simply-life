import { useState } from 'react'
import { Bell, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { sendPushTest } from '../../lib/pushSubscription'
import { SETTINGS as S } from './settingsTheme'

/** Disparo ponta a ponta: permissão → subscribe → POST /api/push-test */
export function PushTestSection()
{
  const [busy, setBusy] = useState(false)

  const handleTest = async () =>
  {
    setBusy(true)
    try
    {
      const { sent } = await sendPushTest()
      toast.success(sent > 0
        ? `Notificação enviada (${sent} dispositivo${sent === 1 ? '' : 's'})`
        : 'Pedido enviado - se nada aparecer, instale o app e permita alertas')
    }
    catch (err)
    {
      toast.error(err instanceof Error ? err.message : 'Falha no push de teste')
    }
    finally
    {
      setBusy(false)
    }
  }

  return (
    <div className={`mt-6 ${S.card} p-6 space-y-3`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-sl bg-accent/15 flex items-center justify-center">
          <Bell size={16} className="text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-semibold text-ink">Notificações no dispositivo</h3>
          <p className="text-[12px] text-ink-muted mt-1 leading-relaxed">
            No Android/Chrome, instale o PWA e permita alertas. As notificações trazem
            botões <strong className="font-medium text-ink">Feito</strong> e{' '}
            <strong className="font-medium text-ink">Adiar</strong> sem abrir o app.
            No iPhone, use Safari 16.4+ após Adicionar à Tela de Início.
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleTest()}
        className={`${S.btnPrimary} min-h-11 inline-flex items-center gap-2 disabled:opacity-50`}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
        Enviar notificação de teste
      </button>
    </div>
  )
}
