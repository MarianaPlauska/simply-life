import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { moodColor, moodLabel } from '@simply-life/shared'
import { COLOR_DARK } from '@simply-life/ui-tokens'
import { Text, PressableScale } from '../ui'
import { useTheme } from '../theme/ThemeProvider'
import { hapticLight } from '../lib/haptics'

const ICONS: Record<number, keyof typeof Ionicons.glyphMap> = {
  1: 'sad',
  2: 'sad-outline',
  3: 'remove-outline',
  4: 'happy-outline',
  5: 'happy',
}

/** Face geométrica Ionicons - sem emoji Unicode */
export function MoodFace({
  mood,
  selected,
  onPress,
  size = 28,
  showLabel = true,
  onWidget,
}: {
  mood: number
  selected?: boolean
  onPress?: () => void
  size?: number
  showLabel?: boolean
  onWidget?: boolean
})
{
  const { colors } = useTheme()
  const m = Math.min(5, Math.max(1, Math.round(mood)))
  const icon = ICONS[m] ?? 'ellipse-outline'
  const tint = selected ? moodColor(m) : onWidget ? colors.widgetMuted : colors.inkMuted
  const bg = selected
    ? moodColor(m)
    : onWidget
      ? colors.hairline
      : colors.elevated
  const iconColor = selected ? COLOR_DARK.canvas : tint

  const body = (
    <View style={{ alignItems: 'center', gap: 6, flex: 1 }}>
      <View
        style={{
          width: size + 28,
          height: size + 28,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bg,
          borderWidth: selected ? 0 : 1,
          borderColor: colors.hairline,
        }}
      >
        <Ionicons name={icon} size={size} color={iconColor} />
      </View>
      {showLabel ? (
        <Text
          variant="micro"
          color={
            onWidget
              ? selected
                ? colors.widgetInk
                : colors.widgetMuted
              : selected
                ? colors.ink
                : colors.inkMuted
          }
          numberOfLines={1}
        >
          {moodLabel(m)}
        </Text>
      ) : null}
    </View>
  )

  if (!onPress) return body

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={moodLabel(m)}
      accessibilityState={{ selected: !!selected }}
      onPress={() =>
      {
        hapticLight()
        onPress()
      }}
      style={{ flex: 1 }}
    >
      {body}
    </PressableScale>
  )
}

export function MoodFaceRow({
  value,
  onChange,
  onWidget,
}: {
  value?: number | null
  onChange: (mood: number) => void
  onWidget?: boolean
})
{
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 4, width: '100%' }}>
      {([1, 2, 3, 4, 5] as const).map((m) => (
        <MoodFace
          key={m}
          mood={m}
          selected={value === m}
          onWidget={onWidget}
          onPress={() => onChange(m)}
        />
      ))}
    </View>
  )
}
