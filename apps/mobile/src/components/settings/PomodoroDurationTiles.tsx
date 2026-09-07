import { View } from 'react-native'
import { Text, PressableScale, Chip } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

export const FOCUS_OPTS = [15, 25, 30, 45, 50, 60]
export const SHORT_OPTS = [3, 5, 10, 15]
export const LONG_OPTS = [10, 15, 20, 25, 30]

type Props = {
  focus: number
  shortBreak: number
  longBreak: number
  onChange: (patch: { pomodoro_focus?: number; pomodoro_short?: number; pomodoro_long?: number }) => void
}

function cycle(current: number, opts: number[]): number
{
  const i = opts.indexOf(current)
  return opts[(i + 1) % opts.length] ?? opts[0]
}

/** Três quadrados de duração — Foco / Pausa / Longa. */
export function PomodoroDurationTiles({ focus, shortBreak, longBreak, onChange }: Props)
{
  const { colors, mode } = useTheme()
  const tileBg = mode === 'dark' ? colors.elevated : '#FFFFFF'

  const tiles = [
    {
      key: 'focus',
      label: 'Foco',
      value: focus,
      onPress: () => onChange({ pomodoro_focus: cycle(focus, FOCUS_OPTS) }),
    },
    {
      key: 'short',
      label: 'Pausa',
      value: shortBreak,
      onPress: () => onChange({ pomodoro_short: cycle(shortBreak, SHORT_OPTS) }),
    },
    {
      key: 'long',
      label: 'Longa',
      value: longBreak,
      onPress: () => onChange({ pomodoro_long: cycle(longBreak, LONG_OPTS) }),
    },
  ] as const

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {tiles.map((t) => (
          <View key={t.key} style={{ flex: 1, gap: 8, alignItems: 'center' }}>
            <Text variant="caption" muted>
              {t.label}
            </Text>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`${t.label}: ${t.value} minutos. Toque para mudar.`}
              onPress={t.onPress}
              style={{
                alignSelf: 'stretch',
                minHeight: 88,
                borderRadius: 22,
                backgroundColor: tileBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text variant="hero" style={{ fontSize: 32, lineHeight: 36, letterSpacing: -1 }}>
                {t.value}
              </Text>
            </PressableScale>
          </View>
        ))}
      </View>
      <Text variant="caption" muted>
        Toque no número para ciclar o tempo, em minutos.
      </Text>
      <View style={{ gap: 8 }}>
        <Text variant="label">Foco</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {FOCUS_OPTS.map((n) => (
            <Chip
              key={`f-${n}`}
              label={`${n} min`}
              active={focus === n}
              onPress={() => onChange({ pomodoro_focus: n })}
            />
          ))}
        </View>
        <Text variant="label">Pausa curta</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {SHORT_OPTS.map((n) => (
            <Chip
              key={`s-${n}`}
              label={`${n} min`}
              active={shortBreak === n}
              onPress={() => onChange({ pomodoro_short: n })}
            />
          ))}
        </View>
        <Text variant="label">Pausa longa</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {LONG_OPTS.map((n) => (
            <Chip
              key={`l-${n}`}
              label={`${n} min`}
              active={longBreak === n}
              onPress={() => onChange({ pomodoro_long: n })}
            />
          ))}
        </View>
      </View>
    </View>
  )
}
