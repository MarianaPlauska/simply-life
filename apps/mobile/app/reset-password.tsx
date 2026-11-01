import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen, Text, PrimaryButton, Card } from '../src/ui'
import { AuthField } from '../src/components/auth/AuthField'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { supabase, supabaseConfigured } from '../src/lib/supabase'

export default function ResetPasswordScreen()
{
  const { space, colors } = useTheme()
  const router = useRouter()
  const completeSessionFromUrl = useAuthStore((s) => s.completeSessionFromUrl)
  const verifyRecoveryInput = useAuthStore((s) => s.verifyRecoveryInput)
  const updatePassword = useAuthStore((s) => s.updatePassword)
  const signOut = useAuthStore((s) => s.signOut)
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [recoveryInput, setRecoveryInput] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() =>
  {
    let cancelled = false

    const { data: authSub } = supabase.auth.onAuthStateChange((event, session) =>
    {
      if (cancelled) return
      if (event === 'PASSWORD_RECOVERY' || Boolean(session))
      {
        setHasSession(true)
        setChecking(false)
      }
    })

    void (async () =>
    {
      if (typeof window !== 'undefined' && supabaseConfigured)
      {
        const href = window.location.href
        if (
          href.includes('code=') ||
          href.includes('access_token') ||
          href.includes('token_hash=') ||
          href.includes('token=')
        )
        {
          const res = await completeSessionFromUrl(href)
          if (cancelled) return
          if (!res.error)
          {
            setHasSession(true)
            setChecking(false)
            return
          }
        }
        const { data } = await supabase.auth.getSession()
        if (!cancelled) setHasSession(Boolean(data.session))
      }
      if (!cancelled) setChecking(false)
    })()

    return () =>
    {
      cancelled = true
      authSub.subscription.unsubscribe()
    }
  }, [completeSessionFromUrl])

  const onSubmit = async () =>
  {
    if (!hasSession && !recoveryInput.trim())
    {
      setError('Cole o link do e-mail de recuperação para validar sua sessão.')
      return
    }
    if (senha.length < 8)
    {
      setError('A senha precisa ter no mínimo 8 caracteres.')
      return
    }
    if (senha !== confirmar)
    {
      setError('As senhas não coincidem.')
      return
    }
    setLoading(true)
    setError('')

    if (!hasSession && recoveryInput.trim())
    {
      const verified = await verifyRecoveryInput('', recoveryInput)
      if (verified.error)
      {
        setLoading(false)
        setError(verified.error)
        return
      }
      setHasSession(true)
    }

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
                : 'Se o link do e-mail abriu com erro, cole abaixo o endereço do link "Reset Password" do e-mail e defina sua nova senha.'}
            </Text>

            {!hasSession ? (
              <AuthField
                label="Link do e-mail ou código"
                leadingIcon="link-outline"
                placeholder="Cole o link do e-mail (https://.../verify?token=...)"
                autoCapitalize="none"
                autoCorrect={false}
                value={recoveryInput}
                onChangeText={(t) =>
                {
                  setRecoveryInput(t)
                  if (error) setError('')
                }}
              />
            ) : null}

            <AuthField
              label="Nova senha"
              leadingIcon="lock-closed-outline"
              placeholder="Mínimo de 8 caracteres"
              secureTextEntry={!showPassword}
              value={senha}
              onChangeText={(t) =>
              {
                setSenha(t)
                if (error) setError('')
              }}
              trailing={passwordToggle}
            />
            <AuthField
              label="Confirmar senha"
              leadingIcon="lock-closed-outline"
              placeholder="Repita a nova senha"
              secureTextEntry={!showPassword}
              value={confirmar}
              onChangeText={(t) =>
              {
                setConfirmar(t)
                if (error) setError('')
              }}
            />
            {error ? (
              <Text variant="caption" color={colors.danger}>
                {error}
              </Text>
            ) : null}
            <PrimaryButton
              label="Salvar senha"
              loading={loading}
              onPress={() => void onSubmit()}
            />
            <PrimaryButton
              label="Voltar ao login"
              variant="ghost"
              onPress={() => router.replace('/login')}
            />
          </Card>
        )}
      </View>
    </Screen>
  )
}
