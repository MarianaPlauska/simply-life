import { View, Pressable, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import {
  buildMoodWeekReport,
  previousWeekRange,
  type HumorRegistro,
} from '@simply-life/shared'
import { Card, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { usePrefsStore } from '../../store/prefsStore'
import { useMoodWeekReportAi } from '../../hooks/useMoodWeekReportAi'

type Props = {
  humor: HumorRegistro[]
}

/** Relatório de humor de domingo — semana anterior (dom–sáb). */
export function MoodWeekReportCard({ humor }: Props)
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const patch = usePrefsStore((s) => s.patch)
  const lifeGoal = usePrefsStore((s) => s.prefs.life_goal)
  const report = buildMoodWeekReport(humor)
  const { ai, loading } = useMoodWeekReportAi(report, humor, lifeGoal)

  if (!report) return null

  const weekLabel = `${formatShort(report.weekStart)} – ${formatShort(report.weekEnd)}`
  const themes = ai?.themes?.length ? ai.themes : report.recurringThemes.map((t) => ({
    label: t.theme,
    count: t.count,
    examples: [t.theme],
  }))

  const dismiss = () =>
  {
    void patch({ mood_report_dismissed_week: report.weekStart })
  }

  return (
    <Card
      tone="elevated"
      style={{
        gap: space.sm,
        borderTopWidth: 1,
        borderTopColor: colors.health,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="caption" style={{ color: colors.health, fontWeight: '700' }}>
            Relatório da semana
          </Text>
          <Text variant="bodyStrong">{weekLabel}</Text>
        </View>
        <Pressable onPress={dismiss} accessibilityLabel="Fechar relatório" hitSlop={8}>
          <Ionicons name="close" size={20} color={colors.inkMuted} />
        </Pressable>
      </View>

      <Text variant="caption" muted>
        {report.daysLogged} dias com registro · {report.totalEntries} check-ins
      </Text>

      <View style={{ gap: 8 }}>
        <Text variant="caption" muted>Humor mais frequente</Text>
        {report.topMoods.map((m) => (
          <View key={m.mood} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="bodyStrong">{m.label}</Text>
              <Text variant="caption" muted>{m.pct}%</Text>
            </View>
            <View
              style={{
                height: 6,
                borderRadius: 999,
                backgroundColor: colors.hairline,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${m.pct}%`,
                  height: '100%',
                  backgroundColor: colors.health,
                }}
              />
            </View>
          </View>
        ))}
      </View>

      <View
        style={{
          gap: 8,
          padding: 12,
          borderRadius: 16,
          backgroundColor: colors.elevated,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text variant="caption" style={{ color: colors.axel, fontWeight: '700' }}>
            Leitura do AXEL
          </Text>
          {loading ? <ActivityIndicator size="small" color={colors.axel} /> : null}
          {ai?.iaDisponivel && !loading ? (
            <Text variant="micro" muted>IA</Text>
          ) : null}
        </View>
        {ai?.summary ? (
          <Text variant="caption">{ai.summary}</Text>
        ) : null}
        {ai?.careNote ? (
          <Text variant="caption" muted>{ai.careNote}</Text>
        ) : null}
      </View>

      {themes.length > 0 ? (
        <View style={{ gap: 6 }}>
          <Text variant="caption" muted>Temas que se repetiram</Text>
          {themes.map((t) => (
            <Text key={`${t.label}-${t.count}`} variant="caption">
              · {t.label} ({t.count}×)
            </Text>
          ))}
        </View>
      ) : null}

      {report.alertLevel !== 'none' && !ai?.careNote?.includes('188') ? (
        <Text variant="caption" style={{ color: colors.axel }}>
          {report.terribleCount} registro(s) como Péssimo ({report.terriblePct}%). Se pesar, converse
          com alguém de confiança ou procure apoio profissional.
        </Text>
      ) : null}

      <Pressable
        onPress={() => router.push('/(tabs)/saude')}
        accessibilityRole="button"
        style={{ minHeight: 44, justifyContent: 'center' }}
      >
        <Text variant="caption" color={colors.health} style={{ fontWeight: '700' }}>
          Abrir diário completo →
        </Text>
      </Pressable>
    </Card>
  )
}

function formatShort(iso: string): string
{
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

/** Só renderiza aos domingos, se ainda não foi dispensado. */
export function MoodWeekReportGate({ humor }: Props)
{
  const dismissed = usePrefsStore((s) => s.prefs.mood_report_dismissed_week)
  const { start } = previousWeekRange()
  const isSunday = new Date().getDay() === 0
  if (!isSunday || dismissed === start) return null
  return <MoodWeekReportCard humor={humor} />
}
