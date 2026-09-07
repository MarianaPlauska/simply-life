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
import { Text, Card, PrimaryButton, IconBadge } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { usePrefsStore } from '../../store/prefsStore'
import { useWorkspace } from '../../layout/useWorkspace'

/**
 * AXEL compacto - fechado por padrão no mobile (só título + 1 frase + 1 passo).
 */
export function AxelDayBrief()
{
  const { colors, space } = useTheme()
  const { showRail } = useWorkspace()
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

  const accent = colors.axel
  const primaryStep = brief.nextSteps[0]
  const open = !collapsed

  const toggleOpen = () =>
  {
    void patchPrefs({ axel_home_collapsed: open })
  }

  return (
    <Card
      tone="elevated"
      style={{
        gap: open ? space.md : space.xs,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.hairline,
        padding: space.lg,
      }}
    >
      <Pressable
        onPress={toggleOpen}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={open ? 'Fechar AXEL' : 'Abrir AXEL'}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}
      >
        <IconBadge name="sparkles" color={accent} size={40} iconSize={20} />
        <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
          <Text variant="caption" color={accent} style={{ fontWeight: '700', fontSize: 11 }}>
            AXEL
          </Text>
          <Text variant="section" style={{ fontSize: 17 }} numberOfLines={2}>
            {brief.headline}
          </Text>
        </View>
        <Text variant="caption" color={accent} style={{ fontWeight: '700' }}>
          {open ? 'Fechar' : 'Abrir'}
        </Text>
      </Pressable>

      {open ? (
        <>
          <Text variant="voice" style={{ fontSize: 15, lineHeight: 22 }} numberOfLines={details ? 8 : 4}>
            {brief.voice}
          </Text>

          {primaryStep ? (
            <View
              style={{
                gap: 4,
                padding: space.md,
                borderRadius: 16,
                backgroundColor: colors.surface,
              }}
            >
              <Text variant="caption" color={colors.health} style={{ fontWeight: '700' }}>
                Um passo
              </Text>
              <Text variant="bodyStrong" style={{ fontSize: 14, lineHeight: 20 }}>
                {primaryStep}
              </Text>
            </View>
          ) : null}

          <Pressable onPress={() => setDetails((v) => !v)} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text variant="caption" color={accent} style={{ fontWeight: '700' }}>
              {details ? 'Menos' : 'Mais'}
            </Text>
          </Pressable>

          {details ? (
            <View style={{ gap: space.md }}>
              {brief.gaps.length > 0 ? (
                <View style={{ gap: 6 }}>
                  <Text variant="caption" color={accent} style={{ fontWeight: '700' }}>
                    Olho nisso
                  </Text>
                  {brief.gaps.map((g) => (
                    <Text key={g} variant="caption" muted>
                      · {g}
                    </Text>
                  ))}
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <PrimaryButton
                  label="Prioridades"
                  variant="secondary"
                  size="sm"
                  onPress={() => router.push('/(tabs)/kanban')}
                  style={{ borderRadius: 999 }}
                />
                <PrimaryButton
                  label="Saúde"
                  variant="ghost"
                  size="sm"
                  onPress={() => router.push('/(tabs)/saude')}
                  style={{ borderRadius: 999 }}
                />
                {showRail ? null : (
                  <PrimaryButton
                    label="Finanças"
                    variant="ghost"
                    size="sm"
                    onPress={() => router.push('/(tabs)/financeiro')}
                    style={{ borderRadius: 999 }}
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
    <Card tone="elevated" style={{ gap: space.sm, borderRadius: 14, padding: 10 }}>
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
