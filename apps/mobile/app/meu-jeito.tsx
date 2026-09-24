import { useEffect } from 'react'
import { Platform, View } from 'react-native'
import { useRouter } from 'expo-router'
import { NEURO_TRAITS, describeLearning, formatMinutesPt, type NeuroTrait } from '@simply-life/shared'
import { useTimeLearning } from '../src/lib/timeLearning'
import { useFocusLogStore } from '../src/store/focusLogStore'
import { Screen, Text, Card, PrimaryButton } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { SelectChip } from '../src/components/CaptureTaskForm'
import { SettingsToggleRow } from '../src/components/settings/SettingsToggleRow'
import { useTheme } from '../src/theme/ThemeProvider'
import { useNeuroStore } from '../src/store/neuroStore'
import { safeBack } from '../src/lib/safeBack'

const GUARD_OPTIONS: (number | null)[] = [null, 25, 50, 90]
const FACTOR_OPTIONS = [1, 1.25, 1.5]
const VISIBLE_OPTIONS = [1, 3, 5, 7]
const WARNING_OPTIONS: { label: string; value: number[] }[] = [
  { label: 'Sem aviso', value: [] },
  { label: '5 min antes', value: [5] },
  { label: '10 e 5 min', value: [10, 5] },
  { label: '15 e 5 min', value: [15, 5] },
]

/** "Meu jeito de funcionar": o app se ajusta à pessoa (TDAH, autismo, ansiedade, depressão). */
export default function MeuJeitoScreen()
{
  const { space } = useTheme()
  const router = useRouter()
  const s = useNeuroStore()
  const { hydrate, setTraits, patch } = s
  const learning = useTimeLearning()
  const sessions = useFocusLogStore((x) => x.sessions)
  const hydrateLog = useFocusLogStore((x) => x.hydrate)

  useEffect(() =>
  {
    void hydrate()
    void hydrateLog()
  }, [hydrate, hydrateLog])

  const toggleTrait = (t: NeuroTrait) =>
  {
    const next = s.traits.includes(t) ? s.traits.filter((x) => x !== t) : [...s.traits, t]
    setTraits(next)
  }
  const sameWarnings = (a: number[]) => a.length === s.transitionWarningsMin.length && a.every((v, i) => v === s.transitionWarningsMin[i])

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title="Meu jeito de funcionar" subtitle="O Axel se ajusta a você, não o contrário" />
      <View style={{ gap: space.md }}>
        <Card tone="elevated" style={{ gap: space.sm }}>
          <Text variant="section">O que combina com você?</Text>
          <Text variant="caption" muted>
            Pode escolher mais de um. Não é diagnóstico e não precisa de laudo: serve só para o app começar do jeito certo.
            Tudo abaixo pode ser ajustado depois.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {NEURO_TRAITS.map((t) => (
              <SelectChip key={t.id} label={t.label} active={s.traits.includes(t.id)} onPress={() => toggleTrait(t.id)} />
            ))}
          </View>
          {NEURO_TRAITS.filter((t) => s.traits.includes(t.id)).map((t) => (
            <Text key={t.id} variant="caption" muted>· {t.label}: {t.hint}</Text>
          ))}
        </Card>

        <Card tone="elevated" style={{ gap: space.sm }}>
          <Text variant="section">Tempo e foco</Text>
          <SettingsToggleRow
            icon="time-outline"
            title="Avisos de tempo no foco"
            subtitle="Na metade, faltando 5 min e no fim. Ajuda quando o tempo “some”."
            value={s.timeAlerts}
            onValueChange={(v) => patch({ timeAlerts: v })}
          />
          <Text variant="caption" muted>Lembrar de pausar depois de</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {GUARD_OPTIONS.map((g) => (
              <SelectChip
                key={String(g)}
                label={g == null ? 'Não lembrar' : `${g} min`}
                active={s.hyperfocusGuardMin === g}
                onPress={() => patch({ hyperfocusGuardMin: g })}
              />
            ))}
          </View>
          <Text variant="caption" muted>
            Folga nas estimativas{learning?.overall ? ' (só vale onde o Axel ainda não aprendeu seu tempo)' : ' (se as coisas costumam demorar mais que o planejado)'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {FACTOR_OPTIONS.map((f) => (
              <SelectChip
                key={f}
                label={f === 1 ? 'Sem folga' : `+${Math.round((f - 1) * 100)}%`}
                active={s.estimateFactor === f}
                onPress={() => patch({ estimateFactor: f })}
              />
            ))}
          </View>
          <Text variant="caption" muted>Quantas próximas atividades mostrar de uma vez</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {VISIBLE_OPTIONS.map((n) => (
              <SelectChip key={n} label={String(n)} active={s.maxVisibleTasks === n} onPress={() => patch({ maxVisibleTasks: n })} />
            ))}
          </View>
        </Card>

        <Card tone="elevated" style={{ gap: space.sm }}>
          <Text variant="section">O que o Axel aprendeu sobre seu tempo</Text>
          <Text variant="caption" muted>
            Vem do timer de foco: tempo real × o que foi estimado. {sessions.length
              ? `${sessions.length} ${sessions.length === 1 ? 'sessão registrada' : 'sessões registradas'}, ${formatMinutesPt(sessions.reduce((a, b) => a + b.minutes, 0))} de foco.`
              : 'Nenhuma sessão ainda.'}
          </Text>
          {describeLearning(learning ?? { overall: null, byKind: {}, totalFocusMinutes: 0, sessions: sessions.length }).map((line) => (
            <Text key={line} variant="body" style={{ fontSize: 14 }}>· {line}</Text>
          ))}
          <SettingsToggleRow
            icon="analytics-outline"
            title="Planejar com o meu tempo real"
            subtitle="Quando houver dados, o Axel usa quanto você realmente leva, por tipo de tarefa."
            value={s.useLearnedTimes}
            onValueChange={(v) => patch({ useLearnedTimes: v })}
          />
        </Card>

        <Card tone="elevated" style={{ gap: space.sm }}>
          <Text variant="section">Previsibilidade</Text>
          <SettingsToggleRow
            icon="shield-checkmark-outline"
            title="Modo previsível"
            subtitle="O Axel não muda seu dia sozinho: ele sugere e espera seu ok."
            value={s.predictableMode}
            onValueChange={(v) => patch({ predictableMode: v })}
          />
          <Text variant="caption" muted>Avisar antes de cada mudança de atividade</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {WARNING_OPTIONS.map((w) => (
              <SelectChip
                key={w.label}
                label={w.label}
                active={sameWarnings(w.value)}
                onPress={() => patch({ transitionWarningsMin: w.value })}
              />
            ))}
          </View>
          {Platform.OS === 'web' ? (
            <Text variant="micro" muted>No navegador os avisos não chegam como notificação; aparecem no “Agora e depois”.</Text>
          ) : null}
        </Card>

        <Card tone="elevated" style={{ gap: space.sm }}>
          <Text variant="section">Menos estímulo</Text>
          <SettingsToggleRow
            icon="pause-circle-outline"
            title="Menos animação"
            subtitle="Tira movimentos e efeitos da tela."
            value={s.reduceMotion}
            onValueChange={(v) => patch({ reduceMotion: v })}
          />
          <SettingsToggleRow
            icon="volume-mute-outline"
            title="Comemoração discreta"
            subtitle="Sem pop-up de conquista. O progresso continua sendo contado."
            value={s.quietCelebrations}
            onValueChange={(v) => patch({ quietCelebrations: v })}
          />
        </Card>

        {Platform.OS === 'android' ? (
          <Card tone="elevated" style={{ gap: space.sm }}>
            <Text variant="section">Plano na barra de notificações</Text>
            <SettingsToggleRow
              icon="notifications-outline"
              title="“Agora e depois” fixo"
              subtitle="Fica na barra de notificações e atualiza sozinho. Funciona como um widget."
              value={s.stickyPlan}
              onValueChange={(v) => patch({ stickyPlan: v })}
            />
          </Card>
        ) : null}

        <PrimaryButton label="Conectar minha agenda" variant="secondary" onPress={() => router.push('/agenda')} />
        <PrimaryButton label="Voltar" variant="ghost" onPress={() => safeBack(router, '/(tabs)')} />
      </View>
    </Screen>
  )
}
