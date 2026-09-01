import { useState } from 'react'
import {
  View,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native'
import { Redirect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BREAKPOINT } from '@simply-life/ui-tokens'
import { Screen, Text, Card, PrimaryButton, Field, PressableScale } from '../src/ui'
import { AuthHeader } from '../src/components/auth/AuthHeader'
import { LoginBrandPanel } from '../src/components/auth/LoginBrandPanel'
import { LoginWhySimply } from '../src/components/auth/LoginWhySimply'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { supabaseConfigured } from '../src/lib/supabase'

type Step = 'welcome' | 'form'

const SHELL_MAX = 440
const PAD_X = 24

export default function LoginScreen()
{
  const { colors, space, elevation } = useTheme()
  const insets = useSafeAreaInsets()
  const { width: vw, height: winH } = useWindowDimensions()
  const isDesktop = vw >= BREAKPOINT.desktop
  const userId = useAuthStore((s) => s.userId)
  const signIn = useAuthStore((s) => s.signIn)
  const enterGuest = useAuthStore((s) => s.enterGuest)
  const [step, setStep] = useState<Step>('welcome')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)

  if (userId) return <Redirect href="/(tabs)" />

  const onSubmit = async () =>
  {
    const next: typeof fieldError = {}
    if (!email.trim()) next.email = 'Informe o email'
    if (!password) next.password = 'Informe a senha'
    setFieldError(next)
    if (next.email || next.password) return

    setLoading(true)
    setError('')
    const res = await signIn(email, password)
    if (res.error) setError(res.error)
    setLoading(false)
  }

  const shellMax = Math.min(isDesktop ? 480 : vw, SHELL_MAX)
  const contentPad = !isDesktop && vw > SHELL_MAX ? Math.max((vw - SHELL_MAX) / 2, 0) : 0
  const minH = Math.max(winH - insets.top, 640)
  const pillBtn = { width: '100%' as const, borderRadius: 999 }

  const welcomeCard = (
    <Card
      tone="elevated"
      style={{
        gap: space.lg,
        paddingVertical: space.xl,
        marginTop: isDesktop ? 0 : -space.sm,
        ...elevation.card,
      }}
    >
      {!isDesktop ? (
        <Text variant="body" muted style={{ textAlign: 'center' }}>
          Humor, água, tarefas e finanças — com o AXEL ao seu lado.
        </Text>
      ) : null}
      <View style={{ gap: space.md, width: '100%' }}>
        <PrimaryButton label="Entrar" onPress={() => setStep('form')} style={pillBtn} />
        <PrimaryButton
          label="Continuar como convidado"
          variant={isDesktop ? 'link' : 'ghost'}
          onPress={enterGuest}
          style={isDesktop ? undefined : pillBtn}
        />
      </View>
    </Card>
  )

  const formBlock = (
    <View style={{ gap: space.lg, marginTop: isDesktop ? 0 : -space.sm, width: '100%', maxWidth: 480 }}>
      <PressableScale
        onPress={() => setStep('welcome')}
        style={{ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' }}
      >
        <Text variant="label" color={colors.axel}>
          ← Voltar
        </Text>
      </PressableScale>

      <Card tone="elevated" style={{ gap: space.md, paddingVertical: space.lg, ...elevation.card }}>
        <Text variant="section">Bem-vindo de volta</Text>
        {!supabaseConfigured ? (
          <Text variant="caption" muted>
            Modo offline — use convidado ou qualquer email.
          </Text>
        ) : null}
        <Field
          label="Email"
          placeholder="voce@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={(t) =>
          {
            setEmail(t)
            if (fieldError.email) setFieldError((e) => ({ ...e, email: undefined }))
          }}
          error={fieldError.email}
        />
        <Field
          label="Senha"
          placeholder="••••••••"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={(t) =>
          {
            setPassword(t)
            if (fieldError.password) setFieldError((e) => ({ ...e, password: undefined }))
          }}
          error={fieldError.password}
        />
        {error ? (
          <Text variant="caption" color={colors.danger}>
            {error}
          </Text>
        ) : null}
        <PrimaryButton
          label="Entrar"
          loading={loading}
          onPress={() => void onSubmit()}
          style={pillBtn}
        />
      </Card>

      <PrimaryButton
        label="Continuar como convidado"
        variant="link"
        onPress={enterGuest}
      />
    </View>
  )

  if (isDesktop)
  {
    return (
      <View style={{ flex: 1, flexDirection: 'row', minHeight: minH, backgroundColor: colors.canvas }}>
        <View style={{ flex: 0.46, minWidth: 360 }}>
          <LoginBrandPanel />
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{
            flex: 0.54,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: space.xxl,
            paddingVertical: Math.max(insets.top, space.xl),
            paddingBottom: Math.max(insets.bottom, space.xl),
          }}
        >
          <View style={{ width: '100%', maxWidth: 480, gap: space.xl }}>
            <View style={{ gap: space.lg }}>
              <View style={{ gap: space.xs }}>
                <Text variant="hero" style={{ letterSpacing: -0.5 }}>
                  {step === 'welcome' ? 'Bem-vindo' : 'Entrar'}
                </Text>
                <Text variant="body" muted>
                  {step === 'welcome'
                    ? 'O essencial, no seu ritmo.'
                    : 'Use seu email e senha.'}
                </Text>
              </View>
              {step === 'welcome' ? welcomeCard : formBlock}
            </View>
            {step === 'welcome' ? <LoginWhySimply /> : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    )
  }

  return (
    <Screen scroll tabBarInset={false} padded={false} style={{ flexGrow: 1, minHeight: minH }}>
      <View
        style={{
          flexGrow: 1,
          width: '100%',
          maxWidth: SHELL_MAX,
          alignSelf: 'center',
          overflow: 'hidden',
          marginHorizontal: contentPad > 0 ? 0 : undefined,
        }}
      >
        <AuthHeader
          title={step === 'welcome' ? 'Bem-vindo' : 'Entrar'}
          subtitle={
            step === 'welcome'
              ? 'O essencial, no seu ritmo.'
              : 'Use seu email e senha.'
          }
          compact={step === 'form'}
          width={shellMax}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{
            flexGrow: 1,
            paddingHorizontal: PAD_X,
            paddingBottom: Math.max(insets.bottom, space.lg),
          }}
        >
          {step === 'welcome' ? welcomeCard : formBlock}
        </KeyboardAvoidingView>
      </View>
    </Screen>
  )
}
