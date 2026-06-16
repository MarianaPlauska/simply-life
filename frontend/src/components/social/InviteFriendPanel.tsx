import { useState } from 'react'
import { Copy, Link2, QrCode, Users } from 'lucide-react'
import { toast } from 'sonner'
import { createFriendInvite } from '../../lib/friendsCircle'
import { canInviteFriends } from '../../lib/axelPrivileges'
import { useTaskStore } from '../../store/useTaskStore'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_BTN_PRIMARY,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

export function InviteFriendPanel()
{
  const userStats = useTaskStore((s) => s.userStats)
  const level = userStats?.level ?? 1
  const unlocked = canInviteFriends({ level, streakCount: 0 })

  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showQr, setShowQr] = useState(false)

  const generate = async () =>
  {
    if (!unlocked || loading) return
    setLoading(true)
    const result = await createFriendInvite()
    setLoading(false)
    if (!result)
    {
      toast.error('Não foi possível gerar o convite')
      return
    }
    setInviteUrl(result.url)
    toast.success('Link pronto — válido por 7 dias')
  }

  const copy = async () =>
  {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    toast.success('Link copiado')
  }

  if (!unlocked)
  {
    return (
      <section className={AXEL_BORDERLESS_PANEL}>
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-ink-muted shrink-0 mt-0.5" />
          <div>
            <h3 className={`text-sm font-medium ${AXEL_TEXT_PRIMARY}`}>Círculo de amigos</h3>
            <p className={`text-[12px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
              Alcance o nível 5 para convidar até 8 pessoas — streak leve, sem feed infinito.
            </p>
          </div>
        </div>
      </section>
    )
  }

  const qrSrc = inviteUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(inviteUrl)}`
    : null

  return (
    <section className={AXEL_BORDERLESS_PANEL}>
      <div className="flex items-start gap-3 mb-3">
        <Link2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div>
          <h3 className={`text-sm font-medium ${AXEL_TEXT_PRIMARY}`}>Convidar ao Círculo</h3>
          <p className={`text-[12px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
            Link ou QR — cada convite vale para até 8 pessoas (3–8 no círculo ideal).
          </p>
        </div>
      </div>

      {!inviteUrl ? (
        <button
          type="button"
          onClick={() => void generate()}
          disabled={loading}
          className={`w-full py-2.5 rounded-sl ${AXEL_BTN_PRIMARY}`}
        >
          {loading ? 'Gerando…' : 'Gerar link simply.life/join/…'}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              readOnly
              value={inviteUrl}
              className="flex-1 min-w-0 px-3 py-2 rounded-sl border border-line bg-chrome text-[11px] font-mono text-ink-muted"
            />
            <button
              type="button"
              onClick={() => void copy()}
              className="px-3 py-2 rounded-sl border border-line text-ink-muted hover:text-ink"
              aria-label="Copiar link"
            >
              <Copy size={14} />
            </button>
            <button
              type="button"
              onClick={() => setShowQr((v) => !v)}
              className="px-3 py-2 rounded-sl border border-line text-ink-muted hover:text-ink"
              aria-label="Mostrar QR"
            >
              <QrCode size={14} />
            </button>
          </div>
          {showQr && qrSrc && (
            <div className="flex justify-center p-4 rounded-sl bg-white">
              <img src={qrSrc} alt="QR do convite" width={180} height={180} />
            </div>
          )}
        </div>
      )}
    </section>
  )
}
