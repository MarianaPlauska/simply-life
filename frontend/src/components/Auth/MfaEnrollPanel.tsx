import { useCallback, useEffect, useState } from 'react'
import { Fingerprint, Loader2, ShieldCheck, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import {
  AXEL_BTN_PRIMARY,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

interface MfaFactor
{
  id: string
  friendly_name?: string
  factor_type: string
  status: string
}

/** Configuração TOTP (2FA) via Supabase Auth MFA */
export function MfaEnrollPanel()
{
  const [loading, setLoading] = useState(true)
  const [factors, setFactors] = useState<MfaFactor[]>([])
  const [enrolling, setEnrolling] = useState(false)
  const [factorId, setFactorId] = useState('')
  const [qrSvg, setQrSvg] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)

  const loadFactors = useCallback(async () =>
  {
    setLoading(true)
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error)
    {
      toast.error('Não foi possível carregar fatores MFA')
      setLoading(false)
      return
    }

    const verified = (data?.totp ?? []).filter((f) => f.status === 'verified')
    setFactors(verified as MfaFactor[])
    setLoading(false)
  }, [])

  useEffect(() =>
  {
    void loadFactors()
  }, [loadFactors])

  const startEnroll = async () =>
  {
    setEnrolling(true)
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Simply-Life',
    })

    if (error || !data)
    {
      toast.error(error?.message ?? 'MFA indisponível — ative TOTP no Supabase Dashboard (Auth → MFA)')
      setEnrolling(false)
      return
    }

    setFactorId(data.id)
    setQrSvg(data.totp?.qr_code ?? '')
    setSecret(data.totp?.secret ?? '')
    setEnrolling(false)
  }

  const verifyEnroll = async () =>
  {
    if (!factorId || code.trim().length < 6)
    {
      return
    }

    setVerifying(true)
    const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId })
    if (chErr || !challenge)
    {
      toast.error(chErr?.message ?? 'Falha ao iniciar verificação')
      setVerifying(false)
      return
    }

    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    })

    setVerifying(false)
    if (error)
    {
      toast.error('Código inválido — tente novamente')
      return
    }

    toast.success('2FA ativado com sucesso')
    setQrSvg('')
    setSecret('')
    setCode('')
    setFactorId('')
    void loadFactors()
  }

  const unenroll = async (id: string) =>
  {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id })
    if (error)
    {
      toast.error(error.message)
      return
    }
    toast.success('Fator removido')
    void loadFactors()
  }

  const hasVerified = factors.length > 0

  return (
    <div className="space-y-4">
      <p className={`text-[12px] leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
        Proteja a conta admin com TOTP (Google Authenticator, 1Password, etc.).
        No Supabase: Authentication → Providers → habilite MFA (TOTP).
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-ink-muted text-[12px]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando…
        </div>
      ) : hasVerified ? (
        <ul className="space-y-2">
          {factors.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-sl border border-line bg-chrome/30"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className={`text-[13px] truncate ${AXEL_TEXT_PRIMARY}`}>
                  {f.friendly_name || 'Authenticator'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => { void unenroll(f.id) }}
                className="p-2 text-ink-muted hover:text-urgente min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Remover 2FA"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : qrSvg ? (
        <div className="space-y-3 rounded-sl border border-line bg-card p-4">
          <p className={`text-[12px] ${AXEL_TEXT_SECONDARY}`}>
            Escaneie o QR no app autenticador e digite o código de 6 dígitos.
          </p>
          <div
            className="mx-auto w-fit rounded-sl bg-white p-2"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          {secret && (
            <p className={`text-[10px] font-mono break-all ${AXEL_TEXT_SECONDARY}`}>
              Chave manual: {secret}
            </p>
          )}
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full bg-chrome border border-line rounded-sl px-3 py-2.5 text-[14px] text-ink font-mono tracking-widest text-center outline-none focus:border-accent/50"
          />
          <button
            type="button"
            disabled={verifying || code.length < 6}
            onClick={() => { void verifyEnroll() }}
            className={`w-full inline-flex items-center justify-center gap-2 py-2.5 ${AXEL_BTN_PRIMARY} disabled:opacity-50`}
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
            Confirmar 2FA
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => { void startEnroll() }}
          disabled={enrolling}
          className={`inline-flex items-center gap-2 px-4 py-2.5 ${AXEL_BTN_PRIMARY} disabled:opacity-50`}
        >
          {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
          Ativar autenticação em dois fatores
        </button>
      )}
    </div>
  )
}
