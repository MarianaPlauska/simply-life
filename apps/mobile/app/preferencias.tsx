import { useEffect, useState } from 'react'
import { View, TextInput, Platform } from 'react-native'
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router'
import {
  CARE_PACE_OPTIONS,
  GAMIFICATION_MODE_OPTIONS,
  NOTIFY_CADENCE_OPTIONS,
  computeSaldoDisponivel,
  ORCHESTRATOR_STYLES,
  minutesLabel,
  type NotifyCadence,
} from '@simply-life/shared'
import { Screen, Text, SubNavTabs, PrimaryButton, Field, Chip, PaneTitle } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { SettingsToggleRow } from '../src/components/settings/SettingsToggleRow'
import { PomodoroDurationTiles } from '../src/components/settings/PomodoroDurationTiles'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { usePrefsStore } from '../src/store/prefsStore'
import { useDataStore } from '../src/store/dataStore'
import { useSalaryStore } from '../src/store/salaryStore'
import { useOrchestratorPrefsStore } from '../src/store/orchestratorPrefsStore'
import { OnbNumber } from '../src/components/onboarding/OnbNumber'
import { useConfirmStore } from '../src/store/confirmStore'
import {
  DASHBOARD_WIDGET_CATALOG,
  resolveDashboardWidgets,
} from '../src/lib/dashboardWidgets'
import {
  ALL_APP_MODULES,
  APP_MODULES,
  filterWidgets,
  modulesOfGroup,
  type AppModuleGroup,
  type AppModuleId,
} from '../src/lib/appModules'
import { registerExpoPushAsync, unregisterExpoPushAsync } from '../src/lib/pushRegister'
import { ModulePicker } from '../src/components/onboarding/ModulePicker'
import { OnbBlock } from '../src/components/onboarding/OnbStep'
import { OnbChoice } from '../src/components/onboarding/OnbChoice'
import { HealthStartForm } from '../src/components/onboarding/HealthStartForm'
import { FinanceStartForm } from '../src/components/onboarding/FinanceStartForm'
import {
  EMPTY_FINANCE_DRAFT,
  applyFinanceDraft,
  applyHealthDraft,
  healthDraftFrom,
  type FinanceDraft,
  type HealthDraft,
} from '../src/components/onboarding/startDrafts'

type Tab = 'uso' | 'metas' | 'geral' | 'alertas' | 'ia' | 'conta'

const TABS: { id: Tab; label: string }[] = [
  { id: 'uso', label: 'O que eu uso' },
  { id: 'metas', label: 'Metas' },
  { id: 'geral', label: 'Geral' },
  { id: 'alertas', label: 'Alertas' },
  { id: 'ia', label: 'E-mails' },
  { id: 'conta', label: 'Conta' },
]

const TAB_IDS = new Set<string>(TABS.map((t) => t.id))

function money(v: number): string
{
  return v.toFixed(2).replace('.', ',')
}

export default function PreferenciasScreen()
{
  const params = useLocalSearchParams<{ tab?: string }>()
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
  const habits = useDataStore((s) => s.habits)
  const cash = useDataStore((s) => s.cashAccount)
  const txs = useDataStore((s) => s.finance)
  const fixas = useDataStore((s) => s.contasFixas)
  const salary = useSalaryStore((s) => s.salary)
  const hydrateSalary = useSalaryStore((s) => s.hydrate)
  const askConfirm = useConfirmStore((s) => s.ask)
  const orgStyle = useOrchestratorPrefsStore((s) => s.style)
  const capacityMinutes = useOrchestratorPrefsStore((s) => s.capacityMinutes)
  const patchOrg = useOrchestratorPrefsStore((s) => s.patch)
  const hydrateOrg = useOrchestratorPrefsStore((s) => s.hydrate)

  const [tab, setTab] = useState<Tab>(TAB_IDS.has(params.tab ?? '') ? (params.tab as Tab) : 'uso')
  const [kwInput, setKwInput] = useState('')
  const [name, setName] = useState('')
  const [pushMsg, setPushMsg] = useState<string | null>(null)
  const [healthDraft, setHealthDraft] = useState<HealthDraft>(() => healthDraftFrom(habits))
  const [financeDraft, setFinanceDraft] = useState<FinanceDraft>(EMPTY_FINANCE_DRAFT)
  const [goalsMsg, setGoalsMsg] = useState<string | null>(null)
  const [savingGoals, setSavingGoals] = useState(false)

  const enabled = prefs.enabled_modules
  const current = enabled ?? ALL_APP_MODULES

  useEffect(() =>
  {
    void hydrate()
    void hydrateSalary()
    void hydrateOrg()
  }, [hydrate, hydrateSalary, hydrateOrg])

  useEffect(() =>
  {
    setName(prefs.axel_calls_you || prefs.display_name)
  }, [prefs.axel_calls_you, prefs.display_name])

  useEffect(() =>
  {
    setHealthDraft(healthDraftFrom(habits))
  }, [habits])

  // saldo e salário partem do que já está salvo
  useEffect(() =>
  {
    setFinanceDraft((d) => ({
      ...d,
      balance: money(computeSaldoDisponivel(cash, txs, fixas).disponivel),
      salary: salary?.base ? money(salary.base) : '',
      quintoDiaUtil: salary?.quintoDiaUtil ?? true,
      payday: String(salary?.diaRecebimento ?? 5),
    }))
  }, [cash, txs, fixas, salary])

  if (!userId) return <Redirect href="/login" />

  const widgets = filterWidgets(enabled, resolveDashboardWidgets(
    prefs.dashboard_quick_widgets,
    prefs.dashboard_priority,
    prefs.home_module_order,
  ))

  /** Liga ou tira módulos, sempre perguntando antes (a mudança mexe em abas e na Home). */
  const changeModules = (ids: AppModuleId[], turnOn: boolean) =>
  {
    const next = turnOn
      ? [...new Set([...current, ...ids])]
      : current.filter((m) => !ids.includes(m))
    if (next.length === current.length && next.every((m) => current.includes(m))) return
    if (!next.length)
    {
      askConfirm({
        tone: 'neutral',
        icon: 'alert-circle-outline',
        title: 'Deixe pelo menos uma parte',
        message: 'O app precisa de pelo menos uma parte ligada. Ligue outra antes de tirar esta.',
        confirmLabel: 'Entendi',
        onConfirm: () => undefined,
      })
      return
    }
    const names = APP_MODULES.filter((m) => ids.includes(m.id)).map((m) => m.label)
    const what = names.length > 2 ? `${names.slice(0, 2).join(', ')} e mais ${names.length - 2}` : names.join(' e ')
    const icon = APP_MODULES.find((m) => m.id === ids[0])?.icon
    askConfirm({
      tone: 'neutral',
      icon,
      title: turnOn ? `Voltar a usar ${what}?` : `Tirar ${what} do app?`,
      message: turnOn
        ? 'Volta a aparecer nas abas e na Home, com tudo que você já tinha registrado.'
        : 'Some das abas e da Home. Nada é apagado: se voltar a usar, está tudo aqui.',
      confirmLabel: turnOn ? 'Usar' : 'Tirar',
      onConfirm: () => void patch({ enabled_modules: next }),
    })
  }

  const saveGoals = async () =>
  {
    setSavingGoals(true)
    setGoalsMsg(null)
    await applyHealthDraft({ ...healthDraft, meds: [] }, enabled, isGuest)
    const issues = await applyFinanceDraft({ ...financeDraft, fixas: [], goalTitle: '', goalValue: '' }, enabled, isGuest)
    setSavingGoals(false)
    setGoalsMsg(issues.length ? issues.join(' ') : 'Metas salvas.')
  }

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title="Preferências" subtitle="O que aparece no app e como ele fala com você" />
      <View style={{ gap: space.lg, paddingBottom: space.xl }}>
        <SubNavTabs accent="axel" tabs={TABS} value={tab} onChange={setTab} />

        {tab === 'uso' && (
          <View style={{ gap: space.lg }}>
            <PaneTitle
              title="O que eu uso"
              subtitle={`${current.length} de ${ALL_APP_MODULES.length} partes ligadas. O que você tira some das abas e da Home, sem apagar nada.`}
            />
            <ModulePicker
              value={current}
              onToggle={(id) => changeModules([id], !current.includes(id))}
              onGroup={(g: AppModuleGroup, on) => changeModules(modulesOfGroup(g).map((m) => m.id), on)}
            />
          </View>
        )}

        {tab === 'metas' && (
          <View style={{ gap: space.md }}>
            <PaneTitle title="Metas" subtitle="Os mesmos pontos de partida das boas-vindas. Só aparecem os das partes que você usa." />
            <HealthStartForm value={healthDraft} onChange={setHealthDraft} enabled={enabled} showMeds={false} />
            <FinanceStartForm value={financeDraft} onChange={setFinanceDraft} enabled={enabled} compact />
            {goalsMsg ? (
              <Text variant="caption" color={goalsMsg === 'Metas salvas.' ? colors.health : colors.danger}>
                {goalsMsg}
              </Text>
            ) : null}
            <PrimaryButton label="Salvar metas" loading={savingGoals} onPress={() => void saveGoals()} />
            <Text variant="caption" muted>
              Remédios ficam em Saúde → Cuidados. Contas fixas e metas de dinheiro, na Carteira.
            </Text>
          </View>
        )}

        {tab === 'geral' && (
          <View style={{ gap: space.md }}>
            <OnbBlock title="Seu nome" hint="Como o AXEL te chama. Só você vê.">
              <Field
                label="Nome ou apelido"
                value={name}
                onChangeText={setName}
                onBlur={() => void patch({ axel_calls_you: name.trim(), display_name: name.trim() })}
                placeholder="Seu nome"
              />
            </OnbBlock>

            <OnbBlock title="Aparência">
              <OnbChoice kind="radio" icon="sunny" title="Clara" hint="Mais luz durante o dia." selected={mode === 'light'} onPress={() => setMode('light')} />
              <OnbChoice kind="radio" icon="moon" title="Escura" hint="Menos brilho, melhor à noite." selected={mode === 'dark'} onPress={() => setMode('dark')} />
            </OnbBlock>

            <OnbBlock title="Como o AXEL organiza suas tarefas" hint="Vale para toda tarefa que você descreve. Dá para mudar quando quiser.">
              {ORCHESTRATOR_STYLES.map((opt) => (
                <OnbChoice
                  key={opt.id}
                  kind="radio"
                  title={opt.label}
                  hint={opt.hint}
                  selected={orgStyle === opt.id}
                  onPress={() => patchOrg({ style: opt.id })}
                />
              ))}
              <OnbNumber
                label="Tempo para tarefas por dia"
                value={capacityMinutes}
                onChange={(v) => patchOrg({ capacityMinutes: v })}
                step={30}
                min={30}
                max={720}
                format={minutesLabel}
              />
              <Text variant="caption" muted>
                Quanto do seu dia você quer para tarefas. Ao encaixar o que você descreve, o AXEL não passa disso num mesmo dia, nem do que a agenda deixa livre. O que não cabe vai para o dia seguinte.
              </Text>
            </OnbBlock>

            <OnbBlock title="Tom das mensagens">
              {CARE_PACE_OPTIONS.map((opt) => (
                <OnbChoice
                  key={opt.id}
                  kind="radio"
                  title={opt.label}
                  hint={opt.hint}
                  selected={(prefs.care_pace || 'balanced') === opt.id}
                  onPress={() => void patch({ care_pace: opt.id })}
                />
              ))}
            </OnbBlock>

            <OnbBlock title="Foco e TDAH" hint="Não é diagnóstico. Passos menores e linha do dia mais visível.">
              <OnbChoice
                kind="radio"
                title="Quero esse apoio"
                selected={Boolean(prefs.adhd_support)}
                onPress={() => void patch({ adhd_support: true })}
              />
              <OnbChoice
                kind="radio"
                title="Prefiro o modo padrão"
                selected={!prefs.adhd_support}
                onPress={() => void patch({ adhd_support: false, gamification_mode: 'calm' })}
              />
              {prefs.adhd_support
                ? GAMIFICATION_MODE_OPTIONS.map((opt) => (
                    <OnbChoice
                      key={opt.id}
                      kind="radio"
                      title={opt.label}
                      hint={opt.hint}
                      selected={(prefs.gamification_mode || 'calm') === opt.id}
                      onPress={() => void patch({ gamification_mode: opt.id })}
                    />
                  ))
                : null}
            </OnbBlock>

            <OnbBlock title="Início" hint="Atalhos do topo e cartões rápidos.">
              <SettingsToggleRow
                icon="grid-outline"
                title="Personalize seu Início"
                subtitle="Escolha os atalhos do topo da Home"
                onPress={() => router.push('/personalizar-inicio')}
              />
              <Text variant="label" muted>
                Cartões rápidos (até 3)
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                {DASHBOARD_WIDGET_CATALOG.filter((w) => filterWidgets(enabled, [w.id]).length).map((w) => (
                  <Chip key={w.id} label={w.label} active={widgets.includes(w.id)} onPress={() => void toggleWidget(w.id)} />
                ))}
              </View>
            </OnbBlock>

            <OnbBlock title="Pomodoro" hint="Tempo de foco e das pausas.">
              <PomodoroDurationTiles
                focus={prefs.pomodoro_focus}
                shortBreak={prefs.pomodoro_short}
                longBreak={prefs.pomodoro_long}
                onChange={(next) => void patch(next)}
              />
            </OnbBlock>
          </View>
        )}

        {tab === 'alertas' && (
          <View style={{ gap: space.md }}>
            <OnbBlock
              title="Ritmo dos alertas"
              hint="Avisos demais aumentam tensão. Silêncio das 22h às 8h; três leituras por dia: 9h, 15h e 21h."
            >
              {NOTIFY_CADENCE_OPTIONS.map((opt) => (
                <OnbChoice
                  key={opt.id}
                  kind="radio"
                  title={opt.label}
                  hint={opt.hint}
                  selected={(prefs.notify_cadence || 'off') === opt.id}
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
              ))}
              {pushMsg ? <Text variant="caption">{pushMsg}</Text> : null}
            </OnbBlock>
            <Text variant="caption" muted>
              Medicamentos podem lembrar no horário, se você cadastrar. Widget na tela do celular chega com o app instalado.
            </Text>
          </View>
        )}

        {tab === 'ia' && (
          <OnbBlock title="Palavras-chave" hint="Termos que a triagem de e-mails e da inbox trata como prioridade.">
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
                  backgroundColor: colors.elevated,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  fontFamily: 'Lexend_400Regular',
                }}
              />
              <PrimaryButton
                label="Incluir"
                size="sm"
                variant="secondary"
                onPress={() =>
                {
                  void addKeyword(kwInput)
                  setKwInput('')
                }}
              />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {keywords.map((k) => (
                <Chip key={k} label={`${k} ×`} active onPress={() => void removeKeyword(k)} />
              ))}
            </View>
          </OnbBlock>
        )}

        {tab === 'conta' && (
          <OnbBlock title="Conta" hint={isGuest ? 'Modo convidado: seus dados ficam neste aparelho.' : undefined}>
            <Text variant="body">{email ?? 'Convidado'}</Text>
            <PrimaryButton label="Perfil e 2FA" variant="secondary" onPress={() => router.push('/perfil')} />
            <PrimaryButton label="Integrações" variant="secondary" onPress={() => router.push('/configuracoes')} />
            <PrimaryButton label="Sair" variant="ghost" onPress={() => void signOut()} />
          </OnbBlock>
        )}
      </View>
    </Screen>
  )
}
