import { useEffect, useState } from 'react'
import { Modal, Pressable, View } from 'react-native'
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

/** Modal leve para recuperação de senha */
export function ForgotPasswordSheet({ visible, initialEmail, onClose }: Props)
{
  const { space, elevation } = useTheme()
  const resetPassword = useAuthStore((s) => s.resetPassword)
  const [email, setEmail] = useState(initialEmail)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() =>
  {
    if (visible)
    {
      setEmail(initialEmail)
      setError('')
      setSent(false)
      setLoading(false)
    }
  }, [visible, initialEmail])

  const onSubmit = async () =>
  {
    if (!email.trim())
    {
      setError('Informe o email')
      return
    }
    setLoading(true)
    setError('')
    const res = await resetPassword(email)
    setLoading(false)
    if (res.error)
    {
      setError(res.error)
      return
    }
    setSent(true)
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(26, 24, 22, 0.72)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: space.lg,
        }}
      >
        <Pressable onPress={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400 }}>
          <Card
            tone="elevated"
            style={{ gap: space.md, paddingVertical: space.lg, ...elevation.card }}
          >
            <Text variant="section">Recuperar senha</Text>
            <Text variant="body" muted>
              {sent
                ? 'Se existir uma conta com este email, enviamos um link de redefinição.'
                : 'Digite seu email e enviaremos um link para redefinir a senha.'}
            </Text>
            {!supabaseConfigured ? (
              <Text variant="caption" muted>
                Modo offline — recuperação indisponível. Use convidado ou qualquer email para entrar.
              </Text>
            ) : null}
            {!sent ? (
              <>
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
                    onPress={() => void onSubmit()}
                    style={{ flex: 1 }}
                  />
                </View>
              </>
            ) : (
              <PrimaryButton label="Fechar" onPress={onClose} />
            )}
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
