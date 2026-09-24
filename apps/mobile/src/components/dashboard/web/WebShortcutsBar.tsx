import { useMemo } from 'react'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { findHabit, formatBRL, monthExpenseTotal, moodLabel, AGUA_META_COPOS } from '@simply-life/shared'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useAuthStore } from '../../../store/authStore'
import { useCaptureStore } from '../../../store/captureStore'
import { useDataStore } from '../../../store/dataStore'
import { usePrefsStore } from '../../../store/prefsStore'
import { normalizeHomeMetrics, HOME_METRIC_CATALOG, type HomeMetricId } from '../../../lib/homeMetrics'
import { WebHoverable } from './WebHoverable'
import { webStyle } from './webStyle'
import { WEB_CARD_BORDER, WEB_ROW_DIVIDER } from './webPalette'

function iconFor(id: HomeMetricId): keyof typeof Ionicons.glyphMap
{
  if (id === 'humor') return 'happy-outline'
  if (id === 'water') return 'water-outline'
  if (id === 'protein') return 'restaurant-outline'
  if (id === 'tasks') return 'checkbox-outline'
  if (id === 'finance') return 'wallet-outline'
  if (id === 'stats') return 'stats-chart-outline'
  return 'flag-outline'
}

/** Mesmos atalhos de HomeMetricShortcuts, como lista de linhas — não grade de ícones de app. */
export function WebShortcutsBar()
{
  const { colors } = useTheme()
  const router = useRouter()
  const isGuest = useAuthStore((s) => s.isGuest)
  const openCapture = useCaptureStore((s) => s.openCapture)
  const prefs = usePrefsStore((s) => s.prefs)
  const ids = useMemo(() => normalizeHomeMetrics(prefs.home_metric_cards), [prefs.home_metric_cards])
  const humor = useDataStore((s) => s.humor) ?? []
  const habits = useDataStore((s) => s.habits) ?? []
  const tasks = useDataStore((s) => s.tasks) ?? []
  const finance = useDataStore((s) => s.finance) ?? []
  const addWaterCup = useDataStore((s) => s.addWaterCup)

  const todayIso = new Date().toISOString().slice(0, 10)
  const agua = findHabit(habits, 'agua')
  const proteina = findHabit(habits, 'proteina')
  const humorHoje = humor.find((h) => (h.data || '').slice(0, 10) === todayIso)?.humor
  const openTasks = tasks.filter((t) => t.status !== 'done').length
  const gastosMes = monthExpenseTotal(finance) ?? 0

  const rows = ids.map((id) =>
  {
    const meta = HOME_METRIC_CATALOG.find((c) => c.id === id)
    const value =
      id === 'humor'
        ? humorHoje
          ? moodLabel(humorHoje)
          : '—'
        : id === 'water'
          ? agua
            ? `${agua.progressoAtual}/${agua.metaDiaria ?? AGUA_META_COPOS}`
            : '—'
          : id === 'protein'
            ? proteina
              ? `${proteina.progressoAtual}g`
              : '—'
            : id === 'tasks'
              ? String(openTasks)
              : id === 'finance'
                ? formatBRL(gastosMes)
                : '—'
    const onPress =
      id === 'water'
        ? () => void addWaterCup(isGuest)
        : id === 'finance'
          ? () => router.push('/(tabs)/financeiro')
          : id === 'tasks'
            ? () => openCapture('dump')
            : () => router.push('/(tabs)/saude')
    return { id, label: meta?.label ?? id, icon: iconFor(id), value, onPress }
  })

  if (rows.length === 0) return null

  return (
    <View style={{ gap: 10 }}>
      <Text variant="section" style={{ fontSize: 16 }}>
        Atalhos
      </Text>
      <View style={{ borderRadius: 14, backgroundColor: colors.elevated, borderWidth: 1, borderColor: WEB_CARD_BORDER, overflow: 'hidden' }}>
        {rows.map((row, i) => (
          <WebHoverable
            key={row.id}
            onPress={row.onPress}
            accessibilityLabel={`${row.label}: ${row.value}`}
            style={(hovered) => webStyle({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingHorizontal: 18,
              paddingVertical: 11,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: WEB_ROW_DIVIDER,
              backgroundColor: hovered ? colors.surface : 'transparent',
              cursor: 'pointer',
            })}
          >
            <Ionicons name={row.icon} size={15} color={colors.axel} style={{ width: 20 }} />
            <Text variant="body" style={{ flex: 1, fontSize: 13 }}>
              {row.label}
            </Text>
            <Text variant="bodyStrong" style={{ fontSize: 13 }}>
              {row.value}
            </Text>
          </WebHoverable>
        ))}
      </View>
    </View>
  )
}
