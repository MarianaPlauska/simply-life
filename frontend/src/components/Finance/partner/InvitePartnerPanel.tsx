import { useCallback, useEffect, useState } from 'react'
import { Copy, HeartHandshake, Link2, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import {
  createPartnerInvite,
  fetchPartnerWorkspace,
  leavePartnerWorkspace,
  type PartnerWorkspaceState,
} from '../../../lib/partnerWorkspace'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_BTN_PRIMARY,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../../constants/axelSurfaces'

/** Convite e status do workspace financeiro de casal */
export function InvitePartnerPanel()
{
  const [state, setState] = useState<PartnerWorkspaceState | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () =>
  {
    setLoading(true)
    const ws = await fetchPartnerWorkspace()
    setState(ws)
    setLoading(false)
  }, [])

  useEffect(() =>
  {
    void reload()
  }, [reload])

  const generate = async () =>
  {
    if (busy) return
    setBusy(true)
    const result = await createPartnerInvite()
    setBusy(false)
    if (!result)
    {
      toast.error(
        state?.partnerUserId
          ? 'Vocês já estão conectados'
          : 'Não foi possível gerar o convite. Confira se a migration 053 foi aplicada.',
      )
      return
    }
    setInviteUrl(result.url)
    toast.success('Link do parceiro pronto - válido por 7 dias')
    await reload()
  }

  const copy = async () =>
  {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    toast.success('Link copiado')
  }

  const leave = async () =>
  {
    if (busy) return
    setBusy(true)
    const result = await leavePartnerWorkspace()
    setBusy(false)
    toast[result.ok ? 'success' : 'error'](result.message)
    setInviteUrl(null)
    await reload()
  }

  return (
    <section className={AXEL_BORDERLESS_PANEL}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-sl border border-line bg-chrome/40 flex items-center justify-center">
          <HeartHandshake className="w-4 h-4 text-finance" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[14px] font-medium ${AXEL_TEXT_PRIMARY}`}>
            Parceiro financeiro
          </p>
          <p className={`text-[12px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
            Convite dedicado (não é o Círculo social). Sem Open Finance: vocês
            marcam o que é compartilhado no lançamento.
          </p>
        </div>
      </div>

      {loading ? (
        <p className={`mt-3 text-[12px] ${AXEL_TEXT_SECONDARY}`}>Carregando…</p>
      ) : state?.partnerUserId ? (
        <div className="mt-3 space-y-2">
          <p className={`text-[13px] ${AXEL_TEXT_PRIMARY}`}>
            Conectado com{' '}
            <span className="font-medium">{state.partnerDisplayName}</span>
          </p>
          <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>
            No lançamento, escolha Pessoal ou Casal. Gasto pessoal pago na conta do casal
            fica marcado sem misturar os totais.
          </p>
          <button
            type="button"
            onClick={() => void leave()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 min-h-11 px-3 rounded-sl border border-line text-[12px] text-ink-muted hover:text-urgente"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair do workspace
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {state && (
            <p className={`text-[12px] ${AXEL_TEXT_SECONDARY}`}>
              Workspace criado. Envie o link para o parceiro aceitar.
            </p>
          )}
          {!inviteUrl ? (
            <button
              type="button"
              onClick={() => void generate()}
              disabled={busy}
              className={`w-full min-h-11 inline-flex items-center justify-center gap-2 ${AXEL_BTN_PRIMARY}`}
            >
              <Link2 className="w-4 h-4" />
              {busy ? 'Gerando…' : 'Gerar convite de parceiro'}
            </button>
          ) : (
            <div className="space-y-2">
              <input
                readOnly
                value={inviteUrl}
                className="w-full rounded-sl border border-line bg-chrome/40 px-3 py-2 text-[12px] font-mono text-ink"
              />
              <button
                type="button"
                onClick={() => void copy()}
                className="w-full min-h-11 inline-flex items-center justify-center gap-2 rounded-sl border border-line text-[12px] font-medium"
              >
                <Copy className="w-4 h-4" />
                Copiar link
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
