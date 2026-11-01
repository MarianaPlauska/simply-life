import { View, Pressable } from 'react-native'
import { useMemo, useState } from 'react'
import { useRouter } from 'expo-router'
import {
  findHabit,
  habitPct,
  buildAxelDayBrief,
  humorDoDia,
  type MobileTask,
} from '@simply-life/shared'
import { Text, Card, PrimaryButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { usePrefsStore } from '../../store/prefsStore'
import { useWorkspace } from '../../layout/useWorkspace'
import { AxelSun } from '../AxelSun'
import { useInPanel } from '../../ui/Panel'
import { useWebDesk } from './web/webBox'

/**
 * AXEL compacto - fechado por padrão no mobile (só título + 1 frase + 1 passo).
 */
export function AxelDayBrief()
{
  const { colors, space } = useTheme()
  const { showRail } = useWorkspace()
  const inPanel = useInPanel()
  const desk = useWebDesk()
  const router = useRouter()
  const collapsed = usePrefsStore((s) => s.prefs.axel_home_collapsed) ?? false
  const patchPrefs = usePrefsStore((s) => s.patch)
  const [details, setDetails] = useState(false)
  const habits = useDataStore((s) => s.habits)
  const tasks = useDataStore((s) => s.tasks) ?? []
  const medicamentos = useDataStore((s) => s.medicamentos) ?? []
  const cash = useDataStore((s) => s.cashAccount)
  const finance = useDataStore((s) => s.finance) ?? []
  const fixas = useDataStore((s) => s.contasFixas) ?? []
  const lastAxelCare = useDataStore((s) => s.lastAxelCare)
  const humor = useDataStore((s) => s.humor) ?? []

  const moodLevel = useMemo(() => humorDoDia(humor)?.humor ?? null, [humor])

  const brief = useMemo(
    () =>
      buildAxelDayBrief({
        tasks,
        habits,
        medicamentos,
        finance,
        cash,
        fixas,
        lastAxelCare,
        moodLevel,
      }),
    [tasks, habits, medicamentos, finance, cash, fixas, lastAxelCare, moodLevel],
  )

  const primaryStep = brief.nextSteps[0]
  const open = !collapsed
  const sunMood = moodLevel != null && moodLevel <= 2
    ? 'care'
    : moodLevel != null && moodLevel >= 4
      ? 'happy'
      : 'calm'

  const toggleOpen = () =>
  {
    void patchPrefs({ axel_home_collapsed: open })
  }

  return (
    <Card
      tone="elevated"
      bare={inPanel}
      style={inPanel ? { gap: open ? space.md : 0 } : { gap: open ? space.md : 0, padding: space.lg }}
    >
      <Pressable
        onPress={toggleOpen}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={open ? 'Fechar Axel' : 'Abrir Axel'}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}
      >
        <AxelSun size={40} mood={sunMood} />
        <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
          <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
            Axel
          </Text>
          <Text variant="section" style={{ fontSize: 17 }} numberOfLines={2}>
            {brief.headline}
          </Text>
        </View>
        <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
          {open ? 'Fechar' : 'Abrir'}
        </Text>
      </Pressable>

      {open ? (
        <>
          <Text variant="body" style={{ fontSize: 15, lineHeight: 22 }} numberOfLines={details ? 6 : 3}>
            {brief.voice}
          </Text>

          {primaryStep ? (
            <View
              style={
                desk
                  ? { gap: 4, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: colors.hairline }
                  : { gap: 4, paddingVertical: 4 }
              }
            >
              <Text variant="caption" muted>
                Próximo
              </Text>
              <Text variant="bodyStrong" style={{ fontSize: 15, lineHeight: 22 }}>
                {primaryStep}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={() => setDetails((v) => !v)}
            style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}
          >
            <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
              {details ? 'Menos' : 'Mais'}
            </Text>
          </Pressable>

          {details ? (
            <View style={{ gap: space.md }}>
              {brief.gaps.length > 0 ? (
                <View style={{ gap: 6 }}>
                  {brief.gaps.map((g) => (
                    <Text key={g} variant="caption" muted>
                      {g}
                    </Text>
                  ))}
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                <PrimaryButton
                  label="Tarefas"
                  variant="secondary"
                  size="sm"
                  onPress={() => router.push('/(tabs)/kanban')}
                />
                <PrimaryButton
                  label="Saúde"
                  variant="ghost"
                  size="sm"
                  onPress={() => router.push('/(tabs)/saude')}
                />
                {showRail ? null : (
                  <PrimaryButton
                    label="Carteira"
                    variant="ghost"
                    size="sm"
                    onPress={() => router.push('/(tabs)/financeiro')}
                  />
                )}
              </View>
            </View>
          ) : null}
        </>
      ) : null}
    </Card>
  )
}

export function ProgressPanel()
{
  const { colors, space } = useTheme()
  const habits = useDataStore((s) => s.habits)
  const agua = findHabit(habits, 'agua')
  const pct = habitPct(agua)
  const router = useRouter()

  return (
    <Card tone="elevated" style={{ gap: space.sm, borderRadius: 14, padding: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="section" style={{ fontSize: 15 }}>
          Hidratação
        </Text>
        <PrimaryButton
          label="Abrir"
          variant="link"
          size="sm"
          onPress={() => router.push('/(tabs)/saude')}
        />
      </View>
      <Text variant="title" color={colors.health} style={{ fontSize: 22 }}>
        {agua ? `${agua.progressoAtual}/${agua.metaDiaria}` : '-'} · {pct}%
      </Text>
    </Card>
  )
}

export function HomeDriveAside(_props: { todayTasks: MobileTask[] })
{
  const { space } = useTheme()
  return (
    <View style={{ flex: 1, gap: space.lg }}>
      <ProgressPanel />
    </View>
  )
}
