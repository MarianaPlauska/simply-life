import { View } from 'react-native'
import { COLOR_DARK, COLOR_LIGHT } from '@simply-life/ui-tokens'
import { Screen, Text, Card, PressableScale } from '../src/ui'
import { MoodFaceRow } from '../src/components/MoodFace'
import { useTheme } from '../src/theme/ThemeProvider'

const SWATCHES: { key: keyof typeof COLOR_DARK; label: string }[] = [
  { key: 'canvas', label: 'canvas' },
  { key: 'surface', label: 'surface' },
  { key: 'elevated', label: 'elevated' },
  { key: 'axel', label: 'axel' },
  { key: 'health', label: 'health' },
  { key: 'finance', label: 'finance' },
  { key: 'tasks', label: 'tasks' },
]

/** Prova visual Fase A - tokens + MoodFace sem emoji */
export default function TokensPreviewScreen()
{
  const { colors, space, mode, setMode } = useTheme()
  const palette = mode === 'light' ? COLOR_LIGHT : COLOR_DARK

  return (
    <Screen scroll tabBarInset={false}>
      <View style={{ gap: space.lg, paddingTop: space.lg }}>
        <Text variant="hero">Tokens AXEL</Text>
        <Text variant="caption" muted>
          {mode} · canvas / surface / elevated + cores de módulo
        </Text>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Tema claro"
            onPress={() => setMode('light')}
            style={{
              minHeight: 44,
              paddingHorizontal: 16,
              borderRadius: 999,
              justifyContent: 'center',
              backgroundColor: mode === 'light' ? colors.axelMuted : colors.elevated,
            }}
          >
            <Text variant="label" color={mode === 'light' ? colors.axel : colors.inkMuted}>
              Claro
            </Text>
          </PressableScale>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Tema escuro"
            onPress={() => setMode('dark')}
            style={{
              minHeight: 44,
              paddingHorizontal: 16,
              borderRadius: 999,
              justifyContent: 'center',
              backgroundColor: mode === 'dark' ? colors.axelMuted : colors.elevated,
            }}
          >
            <Text variant="label" color={mode === 'dark' ? colors.axel : colors.inkMuted}>
              Escuro
            </Text>
          </PressableScale>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {SWATCHES.map((s) => (
            <View key={s.key} style={{ width: '30%', gap: 6 }}>
              <View
                style={{
                  height: 56,
                  borderRadius: 12,
                  backgroundColor: palette[s.key],
                  borderWidth: 1,
                  borderColor: colors.hairline,
                }}
              />
              <Text variant="micro" muted>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        <Card tone="hero" style={{ gap: space.md }}>
          <Text variant="caption" color={colors.axel}>
            MoodFace
          </Text>
          <MoodFaceRow value={4} onChange={() => undefined} />
        </Card>
      </View>
    </Screen>
  )
}
