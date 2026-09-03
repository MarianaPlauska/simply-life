import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text, PrimaryButton, Card } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import { supabaseConfigured } from '../../lib/supabase'
import { loadRememberedEmail, saveRememberedEmail } from '../../lib/rememberEmail'
import { AuthField } from './AuthField'
import { ForgotPasswordSheet } from './ForgotPasswordSheet'

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
    else if (mode === 'register' && password.length < 6) next.password = 'Mínimo de 6 caracteres'
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
    mode === 'login' ? 'Use seu email e senha.' : 'Crie sua conta para sincronizar.'

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
                  borderColor: colors.ink,
                  backgroundColor: remember ? colors.ink : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {remember ? (
                  <Ionicons name="checkmark" size={14} color={colors.canvas} />
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

        <PrimaryButton
          label="Continuar como convidado"
          variant="ghost"
          onPress={enterGuest}
          style={{ width: '100%', borderRadius: isWave ? 14 : 999 }}
        />

        {supabaseConfigured && mode === 'login' ? (
          <PrimaryButton
            label="Continuar com Google"
            variant="secondary"
            loading={googleLoading}
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
            style={{ width: '100%', borderRadius: isWave ? 14 : 999 }}
          />
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

      <ForgotPasswordSheet
        visible={forgotOpen}
        initialEmail={email}
        onClose={() => setForgotOpen(false)}
      />
    </View>
  )
}
