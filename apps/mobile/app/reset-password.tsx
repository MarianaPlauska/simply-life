import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen, Text, PrimaryButton, Card } from '../src/ui'
import { AuthField } from '../src/components/auth/AuthField'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { supabase, supabaseConfigured } from '../src/lib/supabase'

export default function ResetPasswordScreen()
{
  const { space } = useTheme()
  const router = useRouter()
  const completeSessionFromUrl = useAuthStore((s) => s.completeSessionFromUrl)
  const updatePassword = useAuthStore((s) => s.updatePassword)
  const signOut = useAuthStore((s) => s.signOut)
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() =>
  {
    let cancelled = false
    void (async () =>
    {
      if (typeof window !== 'undefined' && supabaseConfigured)
      {
        const href = window.location.href
        if (href.includes('code=') || href.includes('access_token'))
        {
          const res = await completeSessionFromUrl(href)
          if (cancelled) return
          if (!res.error) setHasSession(true)
        }
        else
        {
          const { data } = await supabase.auth.getSession()
          if (!cancelled) setHasSession(Boolean(data.session))
        }
      }
      if (!cancelled) setChecking(false)
    })()
    return () =>
    {
      cancelled = true
    }
  }, [completeSessionFromUrl])

  const onSubmit = async () =>
  {
    if (senha.length < 6)
    {
      setError('A senha precisa ter no mínimo 6 caracteres')
      return
    }
    if (senha !== confirmar)
    {
      setError('As senhas não coincidem')
      return
    }
    setLoading(true)
    setError('')
    const res = await updatePassword(senha)
    setLoading(false)
    if (res.error)
    {
      setError(res.error)
      return
    }
    setSuccess(true)
    window.setTimeout(() =>
    {
      void signOut().then(() => router.replace('/login'))
    }, 1800)
  }

  if (checking)
  {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator />
        </View>
      </Screen>
    )
  }

  return (
    <Screen scroll>
      <View style={{ gap: space.lg, paddingTop: space.xl, maxWidth: 440, width: '100%', alignSelf: 'center' }}>
        <Text variant="hero">Redefinir senha</Text>
        {success ? (
          <Card tone="elevated" style={{ gap: space.sm }}>
            <Text variant="section">Senha atualizada</Text>
            <Text variant="body" muted>
              Redirecionando para o login…
            </Text>
          </Card>
        ) : (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="body" muted>
              {hasSession
                ? 'Escolha uma nova senha para sua conta.'
                : 'Link inválido ou expirado. Solicite um novo email.'}
            </Text>
            {hasSession ? (
              <>
                <AuthField
                  label="Nova senha"
                  leadingIcon="lock-closed-outline"
                  secureTextEntry
                  value={senha}
                  onChangeText={setSenha}
                />
                <AuthField
                  label="Confirmar senha"
                  leadingIcon="lock-closed-outline"
                  secureTextEntry
                  value={confirmar}
                  onChangeText={setConfirmar}
                />
                {error ? (
                  <Text variant="caption" color="#E24B4A">
                    {error}
                  </Text>
                ) : null}
                <PrimaryButton
                  label="Salvar senha"
                  loading={loading}
                  onPress={() => void onSubmit()}
                />
              </>
            ) : (
              <PrimaryButton label="Voltar ao login" onPress={() => router.replace('/login')} />
            )}
          </Card>
        )}
      </View>
    </Screen>
  )
}
