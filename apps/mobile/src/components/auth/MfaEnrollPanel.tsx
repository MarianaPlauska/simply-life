import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { listVerifiedTotpFactors, type TotpFactor } from '@simply-life/shared'
import { Card, Text, PrimaryButton, Field } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { supabase, supabaseConfigured } from '../../lib/supabase'

/** Enroll TOTP no Perfil */
export function MfaEnrollPanel()
{
  const { space, colors } = useTheme()
  const [loading, setLoading] = useState(true)
  const [factors, setFactors] = useState<TotpFactor[]>([])
  const [secret, setSecret] = useState('')
  const [factorId, setFactorId] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () =>
  {
    if (!supabaseConfigured)
    {
      setLoading(false)
      return
    }
    setLoading(true)
    const list = await listVerifiedTotpFactors(supabase as never)
    setFactors(list)
    setLoading(false)
  }, [])

  useEffect(() =>
  {
    void load()
  }, [load])

  const startEnroll = async () =>
  {
    setBusy(true)
    setError('')
    const { data, error: err } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Simply-Life',
    })
    setBusy(false)
    if (err || !data)
    {
      setError(err?.message ?? 'MFA indisponível. Ative TOTP no Supabase (Auth → MFA).')
      return
    }
    setFactorId(data.id)
    setSecret(data.totp?.secret ?? '')
  }

  const verifyEnroll = async () =>
  {
    if (!factorId || code.trim().length < 6) return
    setBusy(true)
    setError('')
    const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({
      factorId,
    })
    if (chErr || !challenge)
    {
      setBusy(false)
      setError(chErr?.message ?? 'Falha ao iniciar verificação')
      return
    }
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    })
    setBusy(false)
    if (vErr)
    {
      setError('Código inválido. Tente de novo.')
      return
    }
    setSecret('')
    setCode('')
    setFactorId('')
    setInfo('2FA ativado')
    void load()
  }

  const unenroll = async (id: string) =>
  {
    setBusy(true)
    const { error: err } = await supabase.auth.mfa.unenroll({ factorId: id })
    setBusy(false)
    if (err)
    {
      setError(err.message)
      return
    }
    setInfo('Fator removido')
    void load()
  }

  if (!supabaseConfigured)
  {
    return (
      <Text variant="caption" muted>
        2FA disponível apenas com conta sincronizada.
      </Text>
    )
  }

  return (
    <Card tone="elevated" style={{ gap: space.md }}>
      <Text variant="section">Autenticação em dois fatores</Text>
      <Text variant="caption" muted>
        Opcional. Use Google Authenticator, Authy ou 1Password.
      </Text>
      {loading ? (
        <Text variant="caption" muted>
          Carregando…
        </Text>
      ) : factors.length > 0 ? (
        factors.map((f) => (
          <View key={f.id} style={{ gap: space.sm }}>
            <Text variant="bodyStrong">{f.friendly_name || 'Authenticator'}</Text>
            <PrimaryButton
              label="Remover 2FA"
              variant="ghost"
              loading={busy}
              onPress={() => void unenroll(f.id)}
            />
          </View>
        ))
      ) : secret ? (
        <View style={{ gap: space.sm }}>
          <Text variant="caption" muted>
            Adicione a chave no app autenticador e confirme o código.
          </Text>
          <Text variant="caption" style={{ fontFamily: 'Manrope_600SemiBold' }}>
            {secret}
          </Text>
          <Field
            label="Código de 6 dígitos"
            keyboardType="number-pad"
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
          />
          <PrimaryButton
            label="Confirmar 2FA"
            loading={busy}
            onPress={() => void verifyEnroll()}
          />
        </View>
      ) : (
        <PrimaryButton
          label="Ativar 2FA"
          loading={busy}
          onPress={() => void startEnroll()}
        />
      )}
      {error ? (
        <Text variant="caption" color={colors.danger}>
          {error}
        </Text>
      ) : null}
      {info ? (
        <Text variant="caption" color={colors.axel}>
          {info}
        </Text>
      ) : null}
    </Card>
  )
}
