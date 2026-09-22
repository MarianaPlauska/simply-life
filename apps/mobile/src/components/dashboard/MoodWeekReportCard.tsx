import { useState } from 'react'
import { View, Pressable, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import {
  buildMoodWeekReport,
  previousWeekRange,
  withoutEmDash,
  type HumorRegistro,
} from '@simply-life/shared'
import { Card, Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { usePrefsStore } from '../../store/prefsStore'
import { useMoodWeekReportAi } from '../../hooks/useMoodWeekReportAi'

type Props = {
  humor: HumorRegistro[]
}

/** Relatório de domingo: só resumo; detalhes ao toque. */
export function MoodWeekReportCard({ humor }: Props)
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const patch = usePrefsStore((s) => s.patch)
  const lifeGoal = usePrefsStore((s) => s.prefs.life_goal)
  const report = buildMoodWeekReport(humor)
  const { ai, loading } = useMoodWeekReportAi(report, humor, lifeGoal)
  const [expanded, setExpanded] = useState(false)

  if (!report) return null

  const weekLabel = `${formatShort(report.weekStart)} a ${formatShort(report.weekEnd)}`
  const themes = ai?.themes?.length ? ai.themes : report.recurringThemes.map((t) => ({
    label: t.theme,
    count: t.count,
    examples: [t.theme],
  }))
  const summary = withoutEmDash(ai?.summary || '')
  const careNote = withoutEmDash(ai?.careNote || '')

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
          <Text variant="micro" muted>{weekLabel}</Text>
        </View>
        <Pressable onPress={dismiss} accessibilityLabel="Fechar relatório" hitSlop={8}>
          <Ionicons name="close" size={20} color={colors.inkMuted} />
        </Pressable>
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
        </View>
        {summary ? (
          <Text variant="caption">{summary}</Text>
        ) : loading ? (
          <Text variant="caption" muted>Preparando leitura…</Text>
        ) : null}
        {!expanded && summary ? (
          <PressableScale
            onPress={() => setExpanded(true)}
            accessibilityRole="button"
            style={{ minHeight: 40, justifyContent: 'center' }}
          >
            <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
              Ver detalhes da semana
            </Text>
          </PressableScale>
        ) : null}
      </View>

      {expanded ? (
        <>
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

          {careNote ? (
            <Text variant="caption" muted>{careNote}</Text>
          ) : null}

          {themes.length > 0 ? (
            <View style={{ gap: 6 }}>
              <Text variant="caption" muted>Temas que se repetiram</Text>
              {themes.map((t) => (
                <Text key={`${t.label}-${t.count}`} variant="caption">
                  · {withoutEmDash(t.label)} ({t.count}×)
                </Text>
              ))}
            </View>
          ) : null}

          {report.alertLevel !== 'none' && !careNote.includes('188') ? (
            <Text variant="caption" style={{ color: colors.axel }}>
              {report.terribleCount} registro(s) como Péssimo ({report.terriblePct}%). Se pesar,
              converse com alguém de confiança ou procure apoio profissional.
            </Text>
          ) : null}

          <Pressable
            onPress={() => router.push('/(tabs)/saude')}
            accessibilityRole="button"
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Text variant="caption" color={colors.health} style={{ fontWeight: '700' }}>
              Histórico completo em Saúde
            </Text>
          </Pressable>

          <PressableScale
            onPress={() => setExpanded(false)}
            accessibilityRole="button"
            style={{ minHeight: 40, justifyContent: 'center' }}
          >
            <Text variant="caption" muted>Recolher</Text>
          </PressableScale>
        </>
      ) : null}
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
