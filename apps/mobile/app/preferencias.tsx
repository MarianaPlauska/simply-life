import { useEffect, useState } from 'react'
import { View, TextInput, Platform } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { Screen, Text, Card, PillTabs, PrimaryButton, Field, Chip } from '../src/ui'
import { SettingsHero } from '../src/components/settings/SettingsHero'
import { SettingsToggleRow } from '../src/components/settings/SettingsToggleRow'
import { PomodoroDurationTiles } from '../src/components/settings/PomodoroDurationTiles'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { usePrefsStore } from '../src/store/prefsStore'
import {
  DASHBOARD_WIDGET_CATALOG,
  resolveDashboardWidgets,
} from '../src/lib/dashboardWidgets'
import { registerExpoPushAsync, unregisterExpoPushAsync } from '../src/lib/pushRegister'
import { NOTIFY_CADENCE_OPTIONS, type NotifyCadence } from '@simply-life/shared'

type Tab = 'geral' | 'ia' | 'aparencia' | 'notificacoes' | 'seguranca'

const TABS: { id: Tab; label: string }[] = [
  { id: 'geral', label: 'Geral' },
  { id: 'ia', label: 'IA' },
  { id: 'aparencia', label: 'Aparência' },
  { id: 'notificacoes', label: 'Alertas' },
  { id: 'seguranca', label: 'Segurança' },
]

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

  const widgets = resolveDashboardWidgets(
    prefs.dashboard_quick_widgets,
    prefs.dashboard_priority,
    prefs.home_module_order,
  )

  return (
    <Screen scroll tabBarInset={false}>
      <SettingsHero title="Preferências" />
      <View style={{ gap: space.lg }}>
        <PillTabs tabs={TABS} value={tab} onChange={setTab} />

        {tab === 'geral' && (
          <View style={{ gap: space.md }}>
            <PomodoroDurationTiles
              focus={prefs.pomodoro_focus}
              shortBreak={prefs.pomodoro_short}
              longBreak={prefs.pomodoro_long}
              onChange={(next) => void patch(next)}
            />
            <Field
              label="Como o AXEL te chama"
              value={name}
              onChangeText={setName}
              onBlur={() => void patch({ axel_calls_you: name.trim(), display_name: name.trim() })}
              placeholder="Seu nome"
            />
            <SettingsToggleRow
              icon="grid-outline"
              title="Personalize seu Início"
              subtitle="Humor, água, proteína, tarefas, gastos e metas"
              onPress={() => router.push('/personalizar-inicio')}
            />
            <SettingsToggleRow
              icon="heart-outline"
              title="Foco, TDAH e TCC"
              subtitle="Apoio emocional, neurodivergência e exercícios — em Saúde → Apoio"
              onPress={() => router.push('/(tabs)/saude?section=apoio')}
            />
            <Card tone="elevated" style={{ gap: space.sm, borderRadius: 22 }}>
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
          <View style={{ gap: space.sm }}>
            <SettingsToggleRow
              icon="moon-outline"
              title="Modo escuro"
              subtitle="Só claro ou escuro da conta — a paleta AXEL permanece"
              value={mode === 'dark'}
              onValueChange={(v) => setMode(v ? 'dark' : 'light')}
            />
          </View>
        )}

        {tab === 'notificacoes' && (
          <View style={{ gap: space.md }}>
            <Card tone="elevated" style={{ gap: space.sm }}>
              <Text variant="section">Ritmo dos alertas</Text>
              <Text variant="caption" muted>
                Avisos demais aumentam tensão. O padrão mais calmo é ficar só no aplicativo.
                Horário silencioso: 22h às 8h. Três leituras: 9h, 15h e 21h (estudo Duke, 2019).
                Medicamentos podem lembrar se você cadastrar horários.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {NOTIFY_CADENCE_OPTIONS.map((opt) =>
              {
                const active = (prefs.notify_cadence || 'off') === opt.id
                return (
                  <Chip
                    key={opt.id}
                    label={opt.label}
                    active={active}
                    onPress={() =>
                    {
                      const next = opt.id as NotifyCadence
                      void patch({ notify_cadence: next }).then(() =>
                      {
                        if (Platform.OS === 'web')
                        {
                          setPushMsg('No celular, o ritmo passa a valer depois de abrir o app instalado.')
                          return
                        }
                        if (next === 'off')
                        {
                          void unregisterExpoPushAsync().then(() => setPushMsg('Alertas no celular desligados.'))
                          return
                        }
                        void registerExpoPushAsync().then((res) =>
                        {
                          setPushMsg(res.ok
                            ? 'Ritmo salvo. O sistema pode pedir permissão uma vez.'
                            : (res.error || 'Autorize as notificações nas configurações do sistema.'))
                        })
                      })
                    }}
                  />
                )
              })}
              </View>
              <Text variant="caption" muted>
                {NOTIFY_CADENCE_OPTIONS.find((o) => o.id === (prefs.notify_cadence || 'off'))?.hint}
              </Text>
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
