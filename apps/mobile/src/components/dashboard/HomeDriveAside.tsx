import { View, Pressable } from 'react-native'
import { useMemo, useState } from 'react'
import { useRouter } from 'expo-router'
import {
  findHabit,
  habitPct,
  buildAxelDayBrief,
  type MobileTask,
} from '@simply-life/shared'
import { Text, Card, PrimaryButton, IconBadge } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useWorkspace } from '../../layout/useWorkspace'

/**
 * AXEL compacto - fechado por padrão no mobile (só título + 1 frase + 1 passo).
 */
export function AxelDayBrief()
{
  const { colors, space } = useTheme()
  const { showRail } = useWorkspace()
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const habits = useDataStore((s) => s.habits)
  const tasks = useDataStore((s) => s.tasks) ?? []
  const medicamentos = useDataStore((s) => s.medicamentos) ?? []
  const cash = useDataStore((s) => s.cashAccount)
  const finance = useDataStore((s) => s.finance) ?? []
  const fixas = useDataStore((s) => s.contasFixas) ?? []
  const lastAxelCare = useDataStore((s) => s.lastAxelCare)
  const humor = useDataStore((s) => s.humor) ?? []

  const moodLevel = useMemo(() =>
  {
    const today = new Date().toISOString().slice(0, 10)
    const row = humor.find((h) => (h.data || h.created_at || '').slice(0, 10) === today)
      ?? humor[0]
    return row?.humor ?? null
  }, [humor])

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

  return (
    <Card
      tone="elevated"
      style={{
        gap: space.md,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.hairline,
        padding: space.lg,
      }}
    >
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
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
          {expanded ? 'Menos' : 'Mais'}
        </Text>
      </Pressable>

      <Text variant="voice" style={{ fontSize: 15, lineHeight: 22 }} numberOfLines={expanded ? 8 : 2}>
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

      {expanded ? (
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
    <Card tone="elevated" style={{ gap: space.sm, borderRadius: 22 }}>
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
      <AxelDayBrief />
      <ProgressPanel />
    </View>
  )
}
