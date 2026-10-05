import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Icon } from '../../ui/Icon'
import { Text, PrimaryButton, Card } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import { supabaseConfigured } from '../../lib/supabase'
import { loadRememberedEmail, saveRememberedEmail } from '../../lib/rememberEmail'
import { AuthField } from './AuthField'
import { ForgotPasswordSheet } from './ForgotPasswordSheet'
import Svg, { Path } from 'react-native-svg'

/** Logo do Google nas cores oficiais (exigência da marca no botão de login). */
function GoogleG({ size = 18 }: { size?: number })
{
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4" />
      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
      <Path d="M5.84 14.09A6.97 6.97 0 0 1 5.47 12c0-.72.13-1.43.37-2.09V7.07H2.18A11.96 11.96 0 0 0 .96 12c0 1.94.46 3.77 1.22 5.33l2.66-3.24Z" fill="#FBBC05" />
      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.99 14.97.96 12 .96 7.7.96 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335" />
    </Svg>
  )
}

export type AuthMode = 'login' | 'register'

type Props = {
  mode: AuthMode
  onModeChange: (mode: AuthMode) => void
  /** Exibe título/subtítulo dentro do formulário */
  showHeading?: boolean
  /** wave = form flat no sheet branco (login mobile ref) */
  variant?: 'card' | 'wave'
}

type FieldErrors = {
  nome?: string
  email?: string
  password?: string
  confirm?: string
}

/** Formulário de login/cadastro - estrutura rotulada (referência split-screen) */
export function LoginForm({ mode, onModeChange, showHeading = true, variant = 'card' }: Props)
{
  const { colors, space, elevation } = useTheme()
  const isWave = variant === 'wave'
  const signIn = useAuthStore((s) => s.signIn)
  const signUp = useAuthStore((s) => s.signUp)
  const enterGuest = useAuthStore((s) => s.enterGuest)
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle)
  const verifyMfa = useAuthStore((s) => s.verifyMfa)
  const mfaPendingFactorId = useAuthStore((s) => s.mfaPendingFactorId)

  const [nome, setNome] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [remember, setRemember] = useState(false)
  const [fieldError, setFieldError] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)

  useEffect(() =>
  {
    void loadRememberedEmail().then((saved) =>
    {
      if (saved)
      {
        setEmail(saved)
        setRemember(true)
      }
    })
  }, [])

  const clearField = (key: keyof FieldErrors) =>
  {
    setFieldError((prev) =>
    {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const validate = (): boolean =>
  {
    const next: FieldErrors = {}
    if (mode === 'register' && !nome.trim()) next.nome = 'Informe seu nome'
    if (!email.trim()) next.email = 'Informe o email'
    if (!password) next.password = 'Informe a senha'
    else if (mode === 'register' && password.length < 8) next.password = 'Mínimo de 8 caracteres'
    if (mode === 'register')
    {
      if (!confirm) next.confirm = 'Confirme a senha'
      else if (confirm !== password) next.confirm = 'As senhas não coincidem'
    }
    setFieldError(next)
    return !next.nome && !next.email && !next.password && !next.confirm
  }

  const onSubmit = async () =>
  {
    if (!validate()) return
    setLoading(true)
    setError('')
    setInfo('')

    if (mode === 'login')
    {
      await saveRememberedEmail(remember ? email : null)
      const res = await signIn(email, password)
      if (res.error) setError(res.error)
      if (res.needsMfa) setMfaCode('')
      setLoading(false)
      return
    }

    const res = await signUp(email, password, nome)
    if (res.error) setError(res.error)
    else if (res.needsConfirm)
    {
      setInfo('Conta criada. Confirme o email antes de entrar.')
      onModeChange('login')
    }
    setLoading(false)
  }

  const passwordToggle = (
    show: boolean,
    setShow: (v: boolean) => void,
  ) => (
    <Pressable
      onPress={() => setShow(!show)}
      accessibilityRole="button"
      accessibilityLabel={show ? 'Ocultar senha' : 'Mostrar senha'}
      hitSlop={8}
      style={{
        minHeight: 44,
        minWidth: 72,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant="label" color={colors.inkMuted}>
        {show ? 'Ocultar' : 'Mostrar'}
      </Text>
    </Pressable>
  )

  const title = mode === 'login' ? 'Entrar' : 'Criar conta'
  const subtitle =
    mode === 'login'
      ? 'Que bom ter você de volta.'
      : 'Leva menos de um minuto e funciona em todos os seus aparelhos.'

  const fields = (
    <View style={{ gap: space.md }}>
        {!supabaseConfigured ? (
          <Text variant="caption" muted>
            Modo offline: use convidado ou qualquer email.
          </Text>
        ) : null}

        {mfaPendingFactorId ? (
          <View style={{ gap: space.sm }}>
            <Text variant="body" muted>
              Digite o código de 6 dígitos do autenticador.
            </Text>
            <AuthField
              label="Código 2FA"
              leadingIcon="shield-checkmark-outline"
              placeholder="000000"
              keyboardType="number-pad"
              autoComplete="one-time-code"
              value={mfaCode}
              onChangeText={(t) => setMfaCode(t.replace(/\D/g, '').slice(0, 6))}
            />
            {error ? (
              <Text variant="caption" color={colors.danger}>
                {error}
              </Text>
            ) : null}
            <PrimaryButton
              label="Confirmar 2FA"
              loading={loading}
              onPress={() =>
              {
                void (async () =>
                {
                  setLoading(true)
                  setError('')
                  const res = await verifyMfa(mfaCode)
                  if (res.error) setError(res.error)
                  setLoading(false)
                })()
              }}
              style={{ width: '100%', borderRadius: isWave ? 14 : 999 }}
            />
          </View>
        ) : null}

        {!mfaPendingFactorId && mode === 'register' ? (
          <AuthField
            label="Nome"
            leadingIcon="person-outline"
            placeholder="Seu nome"
            autoCapitalize="words"
            autoComplete="name"
            value={nome}
            onChangeText={(t) =>
            {
              setNome(t)
              clearField('nome')
            }}
            error={fieldError.nome}
          />
        ) : null}

        {!mfaPendingFactorId ? (
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
            clearField('email')
          }}
          error={fieldError.email}
        />

        <AuthField
          label="Senha"
          leadingIcon="lock-closed-outline"
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          autoComplete={mode === 'login' ? 'password' : 'new-password'}
          value={password}
          onChangeText={(t) =>
          {
            setPassword(t)
            clearField('password')
          }}
          error={fieldError.password}
          trailing={passwordToggle(showPassword, setShowPassword)}
        />

        {mode === 'register' ? (
          <AuthField
            label="Confirmar senha"
            leadingIcon="lock-closed-outline"
            placeholder="••••••••"
            secureTextEntry={!showConfirm}
            autoComplete="new-password"
            value={confirm}
            onChangeText={(t) =>
            {
              setConfirm(t)
              clearField('confirm')
            }}
            error={fieldError.confirm}
            trailing={passwordToggle(showConfirm, setShowConfirm)}
          />
        ) : null}

        {mode === 'login' ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: space.sm,
              minHeight: 44,
            }}
          >
            <Pressable
              onPress={() => setRemember((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: remember }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                minHeight: 44,
                flexShrink: 1,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: remember ? 0 : 1.5,
                  borderColor: colors.inkMuted,
                  backgroundColor: remember ? colors.axelFill : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {remember ? (
                  <Icon name="checkmark" size={14} color={colors.axelOnFill} />
                ) : null}
              </View>
              <Text variant="caption" color={colors.ink}>
                Lembrar de mim
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setForgotOpen(true)}
              accessibilityRole="link"
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Text variant="label" color={colors.inkMuted}>
                Esqueceu a senha?
              </Text>
            </Pressable>
          </View>
        ) : null}

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

        <PrimaryButton
          label={mode === 'login' ? 'Entrar' : 'Criar conta'}
          loading={loading}
          onPress={() => void onSubmit()}
          style={{ width: '100%', borderRadius: isWave ? 14 : 999, marginTop: space.sm }}
        />

        {supabaseConfigured && mode === 'login' ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.hairline }} />
              <Text variant="caption" muted>
                ou
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.hairline }} />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continuar com Google"
              disabled={googleLoading}
              onPress={() =>
              {
                void (async () =>
                {
                  setGoogleLoading(true)
                  setError('')
                  const res = await signInWithGoogle()
                  if (res.error) setError(res.error)
                  setGoogleLoading(false)
                })()
              }}
              style={({ pressed }) => ({
                minHeight: 48,
                borderRadius: isWave ? 14 : 999,
                borderWidth: 1,
                borderColor: colors.hairlineStrong,
                backgroundColor: pressed ? colors.elevated : 'transparent',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                opacity: googleLoading ? 0.6 : 1,
              })}
            >
              <GoogleG size={18} />
              <Text variant="bodyStrong">{googleLoading ? 'Abrindo o Google...' : 'Continuar com Google'}</Text>
            </Pressable>
          </>
        ) : null}
          </>
        ) : null}
    </View>
  )

  return (
    <View style={{ gap: space.lg, width: '100%', maxWidth: 480 }}>
      {showHeading ? (
        <View style={{ gap: space.xs, marginBottom: space.xs }}>
          <Text
            variant="hero"
            style={{ letterSpacing: -0.5, fontSize: isWave ? 28 : undefined }}
          >
            {title}
          </Text>
          <Text variant="body" muted>
            {subtitle}
          </Text>
        </View>
      ) : null}

      {isWave ? (
        fields
      ) : (
        <Card
          tone="elevated"
          style={{ gap: space.md, paddingVertical: space.lg, ...elevation.card }}
        >
          {fields}
        </Card>
      )}

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 6,
          minHeight: 44,
        }}
      >
        <Text variant="body" muted>
          {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}
        </Text>
        <Pressable
          onPress={() =>
          {
            setError('')
            setInfo('')
            setFieldError({})
            onModeChange(mode === 'login' ? 'register' : 'login')
          }}
          accessibilityRole="link"
          style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }}
        >
          <Text variant="bodyStrong" color={isWave ? colors.axel : colors.ink}>
            {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
          </Text>
        </Pressable>
      </View>

      {mode === 'login' && !mfaPendingFactorId ? (
        <Pressable
          onPress={enterGuest}
          accessibilityRole="button"
          accessibilityLabel="Explorar sem conta"
          style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text variant="label" color={colors.inkMuted}>
            Só quero explorar, sem conta
          </Text>
        </Pressable>
      ) : null}

      <ForgotPasswordSheet
        visible={forgotOpen}
        initialEmail={email}
        onClose={() => setForgotOpen(false)}
      />
    </View>
  )
}
