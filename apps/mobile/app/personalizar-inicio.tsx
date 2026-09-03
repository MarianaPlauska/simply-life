import { useMemo, useState } from 'react'
import { View, Switch } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { Screen, Text, Card, PrimaryButton } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { usePrefsStore } from '../src/store/prefsStore'
import {
  HOME_METRIC_CATALOG,
  normalizeHomeMetrics,
  toggleHomeMetric,
  type HomeMetricId,
} from '../src/lib/homeMetrics'

export default function PersonalizarInicioScreen()
{
  const userId = useAuthStore((s) => s.userId)
  const { colors, space } = useTheme()
  const router = useRouter()
  const prefs = usePrefsStore((s) => s.prefs)
  const patch = usePrefsStore((s) => s.patch)
  const initial = useMemo(
    () => normalizeHomeMetrics(prefs.home_metric_cards),
    [prefs.home_metric_cards],
  )
  const [selected, setSelected] = useState<HomeMetricId[]>(initial)

  if (!userId)
  {
    return <Redirect href="/login" />
  }

  const onToggle = (id: HomeMetricId) =>
  {
    setSelected((prev) => toggleHomeMetric(prev, id))
  }

  const onSave = async () =>
  {
    await patch({
      home_metric_cards: normalizeHomeMetrics(selected),
      home_metrics_configured_at: new Date().toISOString(),
    })
    router.back()
  }

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader
        title="Personalize seu Início"
        subtitle="Escolha o que aparece na linha de atalhos"
      />
      <View style={{ gap: space.lg, paddingBottom: space.xl }}>
        <Text variant="body" muted>
          Sem cobrança - só o essencial no seu ritmo. Você pode mudar isso depois em Preferências.
        </Text>

        <Card tone="elevated" style={{ gap: 0, borderRadius: 18, overflow: 'hidden' }}>
          {HOME_METRIC_CATALOG.map((item, i) =>
          {
            const on = selected.includes(item.id)
            return (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.md,
                  paddingVertical: 14,
                  paddingHorizontal: space.md,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.hairline,
                }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">{item.label}</Text>
                  <Text variant="caption" muted>
                    {item.hint}
                  </Text>
                </View>
                <Switch
                  value={on}
                  onValueChange={() => onToggle(item.id)}
                  trackColor={{ false: colors.hairline, true: colors.axel }}
                  thumbColor={on ? colors.axelOnFill : '#F5F1EC'}
                  ios_backgroundColor={colors.hairline}
                />
              </View>
            )
          })}
        </Card>

        <PrimaryButton label="Salvar meu Início" onPress={() => void onSave()} />
        <PrimaryButton
          label="Agora não"
          variant="ghost"
          onPress={() =>
          {
            void patch({
              home_metrics_configured_at: new Date().toISOString(),
            }).then(() => router.back())
          }}
        />
      </View>
    </Screen>
  )
}
