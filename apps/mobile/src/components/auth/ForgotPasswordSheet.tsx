import { useEffect, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { Modal } from '../../ui/Modal'
import { Text, PrimaryButton, Card } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { AuthField } from './AuthField'
import { useAuthStore } from '../../store/authStore'
import { supabaseConfigured } from '../../lib/supabase'

type Props = {
  visible: boolean
  initialEmail: string
  onClose: () => void
}

/** Modal para recuperação de senha por link ou colando o endereço/código do e-mail */
export function ForgotPasswordSheet({ visible, initialEmail, onClose }: Props)
{
  const { space, elevation, colors } = useTheme()
  const resetPassword = useAuthStore((s) => s.resetPassword)
  const verifyRecoveryInput = useAuthStore((s) => s.verifyRecoveryInput)
  const updatePassword = useAuthStore((s) => s.updatePassword)
  const applySession = useAuthStore((s) => s.applySession)

  const [email, setEmail] = useState(initialEmail)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [sent, setSent] = useState(false)
  const [done, setDone] = useState(false)
  const [recoveryInput, setRecoveryInput] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() =>
  {
    if (visible)
    {
      setEmail(initialEmail)
      setError('')
      setInfo('')
      setSent(false)
      setDone(false)
      setLoading(false)
      setRecoveryInput('')
      setNewPassword('')
      setConfirmPassword('')
      setShowPassword(false)
    }
  }, [visible, initialEmail])

  const onSendEmail = async () =>
  {
    if (!email.trim())
    {
      setError('Informe o e-mail')
      return
    }
    setLoading(true)
    setError('')
    setInfo('')
    const res = await resetPassword(email)
    setLoading(false)
    if (res.error)
    {
      setError(res.error)
      return
    }
    setSent(true)
    setInfo('E-mail de recuperação enviado! Verifique a caixa de entrada e o spam.')
  }

  const onCompleteInlineReset = async () =>
  {
    if (!recoveryInput.trim())
    {
      setError('Cole o link do botão do e-mail ou o código recebido.')
      return
    }
    if (newPassword.length < 8)
    {
      setError('A nova senha precisa ter no mínimo 8 caracteres.')
      return
    }
    if (newPassword !== confirmPassword)
    {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    setError('')
    setInfo('')

    const verified = await verifyRecoveryInput(email, recoveryInput)
    if (verified.error)
    {
      setLoading(false)
      setError(verified.error)
      return
    }

    const updated = await updatePassword(newPassword)
    if (updated.error)
    {
      setLoading(false)
      setError(updated.error)
      return
    }

    setDone(true)
    setLoading(false)
    void applySession()
  }

  const passwordToggle = (
    <Pressable
      onPress={() => setShowPassword((v) => !v)}
      accessibilityRole="button"
      accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
      hitSlop={8}
      style={{
        minHeight: 40,
        minWidth: 68,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant="label" color={colors.inkMuted}>
        {showPassword ? 'Ocultar' : 'Mostrar'}
      </Text>
    </Pressable>
  )

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'center',
          alignItems: 'center',
          padding: space.md,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{ width: '100%', maxWidth: 440, maxHeight: '92%' }}
        >
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            <Card
              tone="elevated"
              style={{ gap: space.md, paddingVertical: space.lg, ...elevation.card }}
            >
              <Text variant="section">Recuperar senha</Text>

              {done ? (
                <>
                  <Text variant="body" color={colors.axel}>
                    Senha redefinida com sucesso! Conectando sua conta...
                  </Text>
                  <PrimaryButton label="Continuar" onPress={onClose} />
                </>
              ) : !sent ? (
                <>
                  <Text variant="body" muted>
                    Digite seu e-mail para receber o link de redefinição do Supabase.
                  </Text>
                  {!supabaseConfigured ? (
                    <Text variant="caption" muted>
                      Modo offline: recuperação indisponível. Use convidado ou qualquer e-mail para entrar.
                    </Text>
                  ) : null}
                  <AuthField
                    label="E-mail"
                    leadingIcon="mail-outline"
                    placeholder="voce@email.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    value={email}
                    onChangeText={(t) =>
                    {
                      setEmail(t)
                      if (error) setError('')
                    }}
                    error={error || undefined}
                  />
                  <View style={{ flexDirection: 'row', gap: space.sm }}>
                    <PrimaryButton
                      label="Cancelar"
                      variant="ghost"
                      onPress={onClose}
                      style={{ flex: 1 }}
                    />
                    <PrimaryButton
                      label="Enviar link"
                      loading={loading}
                      onPress={() => void onSendEmail()}
                      style={{ flex: 1 }}
                    />
                  </View>
                  {supabaseConfigured ? (
                    <Pressable
                      onPress={() =>
                      {
                        setError('')
                        setSent(true)
                      }}
                      accessibilityRole="button"
                      style={{ minHeight: 38, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text variant="caption" color={colors.axel} style={{ fontWeight: '600' }}>
                        Já recebi o e-mail (colar link ou código)
                      </Text>
                    </Pressable>
                  ) : null}
                </>
              ) : (
                <>
                  {info ? (
                    <Text variant="caption" color={colors.axel} style={{ fontWeight: '600' }}>
                      {info}
                    </Text>
                  ) : null}
                  <Text variant="caption" muted style={{ lineHeight: 18 }}>
                    Dica: se ao clicar no link do e-mail aparecer uma tela com erro JSON (como requested path is invalid), copie o endereço do botão "Reset Password" direto no e-mail e cole abaixo para trocar a senha por aqui:
                  </Text>

                  <AuthField
                    label="Link do e-mail ou código"
                    leadingIcon="link-outline"
                    placeholder="Cole o link do e-mail (https://.../verify?token=...)"
                    autoCapitalize="none"
                    autoCorrect={false}
                    compact
                    value={recoveryInput}
                    onChangeText={(t) =>
                    {
                      setRecoveryInput(t)
                      if (error) setError('')
                    }}
                  />

                  <AuthField
                    label="Nova senha"
                    leadingIcon="lock-closed-outline"
                    placeholder="Mínimo de 8 caracteres"
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    compact
                    value={newPassword}
                    onChangeText={(t) =>
                    {
                      setNewPassword(t)
                      if (error) setError('')
                    }}
                    trailing={passwordToggle}
                  />

                  <AuthField
                    label="Confirmar nova senha"
                    leadingIcon="lock-closed-outline"
                    placeholder="Repita a nova senha"
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    compact
                    value={confirmPassword}
                    onChangeText={(t) =>
                    {
                      setConfirmPassword(t)
                      if (error) setError('')
                    }}
                  />

                  {error ? (
                    <Text variant="caption" color={colors.danger}>
                      {error}
                    </Text>
                  ) : null}

                  <PrimaryButton
                    label="Salvar nova senha"
                    loading={loading}
                    onPress={() => void onCompleteInlineReset()}
                  />

                  <View style={{ flexDirection: 'row', gap: space.sm }}>
                    <PrimaryButton
                      label="Reenviar e-mail"
                      variant="ghost"
                      disabled={loading}
                      onPress={() => void onSendEmail()}
                      style={{ flex: 1 }}
                    />
                    <PrimaryButton
                      label="Fechar"
                      variant="dismiss"
                      onPress={onClose}
                      style={{ flex: 1 }}
                    />
                  </View>
                </>
              )}
            </Card>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
