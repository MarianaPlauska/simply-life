import { useEffect, useState } from 'react'
import { View, Switch, TextInput, Platform } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { Screen, Text, Card, PillTabs, PrimaryButton, Field, Chip } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { usePrefsStore } from '../src/store/prefsStore'
import {
  DASHBOARD_WIDGET_CATALOG,
  resolveDashboardWidgets,
} from '../src/lib/dashboardWidgets'
import { registerExpoPushAsync } from '../src/lib/pushRegister'

type Tab = 'geral' | 'ia' | 'aparencia' | 'notificacoes' | 'seguranca'

const TABS: { id: Tab; label: string }[] = [
  { id: 'geral', label: 'Geral' },
  { id: 'ia', label: 'IA' },
  { id: 'aparencia', label: 'Aparência' },
  { id: 'notificacoes', label: 'Alertas' },
  { id: 'seguranca', label: 'Segurança' },
]

const FOCUS_OPTS = [15, 25, 30, 45, 50, 60]
const BREAK_OPTS = [3, 5, 10, 15]

export default function PreferenciasScreen()
{
  const userId = useAuthStore((s) => s.userId)
  const email = useAuthStore((s) => s.sessionEmail)
  const isGuest = useAuthStore((s) => s.isGuest)
  const signOut = useAuthStore((s) => s.signOut)
  const router = useRouter()
  const { colors, space, mode, setMode } = useTheme()
  const prefs = usePrefsStore((s) => s.prefs)
  const keywords = usePrefsStore((s) => s.keywords)
  const patch = usePrefsStore((s) => s.patch)
  const toggleWidget = usePrefsStore((s) => s.toggleWidget)
  const addKeyword = usePrefsStore((s) => s.addKeyword)
  const removeKeyword = usePrefsStore((s) => s.removeKeyword)
  const hydrate = usePrefsStore((s) => s.hydrate)
  const [tab, setTab] = useState<Tab>('geral')
  const [kwInput, setKwInput] = useState('')
  const [name, setName] = useState('')
  const [pushMsg, setPushMsg] = useState<string | null>(null)

  useEffect(() =>
  {
    void hydrate()
  }, [hydrate])

  useEffect(() =>
  {
    setName(prefs.axel_calls_you || prefs.display_name)
  }, [prefs.axel_calls_you, prefs.display_name])

  if (!userId) return <Redirect href="/login" />

  const widgets = resolveDashboardWidgets(prefs.dashboard_quick_widgets, prefs.dashboard_priority)

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title="Preferências" subtitle="Atalhos, IA, tema e alertas" />
      <View style={{ gap: space.lg }}>
        <PillTabs tabs={TABS} value={tab} onChange={setTab} />

        {tab === 'geral' && (
          <View style={{ gap: space.md }}>
            <Field
              label="Como o AXEL te chama"
              value={name}
              onChangeText={setName}
              onBlur={() => void patch({ axel_calls_you: name.trim(), display_name: name.trim() })}
              placeholder="Seu nome"
            />
            <Card tone="elevated" style={{ gap: space.sm }}>
              <Text variant="section">Personalize seu Início</Text>
              <Text variant="caption" muted>
                Humor, Água, Proteína, Tarefas, Gastos e Metas - na linha de cards da Home.
              </Text>
              <PrimaryButton
                label="Abrir personalização"
                variant="secondary"
                onPress={() => router.push('/personalizar-inicio')}
              />
            </Card>
            <Card tone="elevated" style={{ gap: space.sm }}>
              <Text variant="section">Widgets extras</Text>
              <Text variant="caption" muted>
                Até 3 widgets legados do setup.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                {DASHBOARD_WIDGET_CATALOG.map((w) => (
                  <Chip
                    key={w.id}
                    label={w.label}
                    active={widgets.includes(w.id)}
                    onPress={() => void toggleWidget(w.id)}
                  />
                ))}
              </View>
            </Card>
            <Card tone="elevated" style={{ gap: space.sm }}>
              <Text variant="section">Pomodoro</Text>
              <Text variant="caption" muted>
                Usado no Modo foco - ligado ao mesmo store.
              </Text>
              <Text variant="label">Foco</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {FOCUS_OPTS.map((n) => (
                  <Chip
                    key={n}
                    label={`${n} min`}
                    active={prefs.pomodoro_focus === n}
                    onPress={() => void patch({ pomodoro_focus: n })}
                  />
                ))}
              </View>
              <Text variant="label">Pausa curta</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {BREAK_OPTS.map((n) => (
                  <Chip
                    key={n}
                    label={`${n} min`}
                    active={prefs.pomodoro_short === n}
                    onPress={() => void patch({ pomodoro_short: n })}
                  />
                ))}
              </View>
            </Card>
          </View>
        )}

        {tab === 'ia' && (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="section">Palavras-chave</Text>
            <Text variant="caption" muted>
              Termos que a triagem prioriza em e-mails e inbox.
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TextInput
                value={kwInput}
                onChangeText={setKwInput}
                placeholder="urgente, boleto…"
                placeholderTextColor={colors.inkFaint}
                onSubmitEditing={() =>
                {
                  void addKeyword(kwInput)
                  setKwInput('')
                }}
                style={{
                  flex: 1,
                  minHeight: 44,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  color: colors.ink,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                }}
              />
              <PrimaryButton
                label="Add"
                size="sm"
                onPress={() =>
                {
                  void addKeyword(kwInput)
                  setKwInput('')
                }}
              />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {keywords.map((k) => (
                <Chip
                  key={k}
                  label={`${k} ×`}
                  active
                  onPress={() => void removeKeyword(k)}
                />
              ))}
            </View>
          </Card>
        )}

        {tab === 'aparencia' && (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="section">Tema</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="body">Modo escuro</Text>
              <Switch
                value={mode === 'dark'}
                onValueChange={(v) =>
                {
                  const next = v ? 'dark' : 'light'
                  setMode(next)
                  void patch({ color_scheme: next })
                }}
                trackColor={{ true: colors.axel, false: colors.hairlineStrong }}
              />
            </View>
            <Text variant="caption" muted>
              Paleta e navbar não mudam aqui - só claro/escuro da conta.
            </Text>
          </Card>
        )}

        {tab === 'notificacoes' && (
          <View style={{ gap: space.md }}>
            <Card tone="elevated" style={{ gap: space.sm }}>
              <Text variant="section">Push no celular</Text>
              <Text variant="caption" muted>
                Com o app instalado (Expo), o token vai para a API e as notificações chegam no aparelho.
              </Text>
              {Platform.OS === 'web' ? (
                <Text variant="body" muted>
                  Preview web não registra token nativo. Abra o app no Android/iOS.
                </Text>
              ) : (
                <PrimaryButton
                  label="Ativar notificações"
                  onPress={() =>
                  {
                    void registerExpoPushAsync().then((res) =>
                    {
                      setPushMsg(res.ok
                        ? 'Token registrado.'
                        : (res.error || 'Não foi possível registrar. Autorize nas configurações do sistema.'))
                    })
                  }}
                />
              )}
              {pushMsg ? <Text variant="caption">{pushMsg}</Text> : null}
            </Card>
            <Card tone="elevated" style={{ gap: space.sm }}>
              <Text variant="section">Widget da tela inicial</Text>
              <Text variant="caption" muted>
                Hoje os atalhos vivem dentro do app (Início). Widget nativo iOS/Android (WidgetKit) entra no build nativo - ainda não neste preview.
              </Text>
            </Card>
          </View>
        )}

        {tab === 'seguranca' && (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="section">Conta</Text>
            <Text variant="body">{email ?? '-'}</Text>
            {isGuest ? (
              <Text variant="caption" muted>
                Modo convidado: dados ficam neste aparelho.
              </Text>
            ) : null}
            <PrimaryButton
              label="Perfil e 2FA"
              variant="secondary"
              onPress={() => router.push('/perfil')}
            />
            <PrimaryButton
              label="Integrações"
              variant="secondary"
              onPress={() => router.push('/configuracoes')}
            />
            <PrimaryButton
              label="Sair"
              variant="ghost"
              onPress={() => void signOut()}
            />
          </Card>
        )}
      </View>
    </Screen>
  )
}
