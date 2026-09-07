import { View } from 'react-native'
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg'
import { Ionicons } from '@expo/vector-icons'
import { Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  remainingSec: number
  durationSec: number
  running: boolean
  onToggle: () => void
  title?: string
}

function mmss(total: number): string
{
  const t = Math.max(0, Math.floor(total))
  const m = Math.floor(t / 60)
  const s = t % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function polar(cx: number, cy: number, r: number, deg: number)
{
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function sectorPath(cx: number, cy: number, r: number, sweepDeg: number): string
{
  if (sweepDeg <= 0) return ''
  const sweep = Math.min(359.9, sweepDeg)
  const end = polar(cx, cy, r, sweep)
  const large = sweep > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y} Z`
}

/** Relógio de executar tarefa — setor laranja suave + pausa em pílula. */
export function ExecuteTimerFace({
  remainingSec,
  durationSec,
  running,
  onToggle,
  title = 'Timer',
}: Props)
{
  const { colors } = useTheme()
  const size = 280
  const cx = size / 2
  const cy = size / 2
  const elapsed = durationSec > 0 ? 1 - remainingSec / durationSec : 0
  const sweep = Math.max(8, elapsed * 360)

  return (
    <View style={{ alignItems: 'center', gap: 28 }}>
      <Text variant="section" style={{ fontSize: 18 }}>
        {title}
      </Text>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Defs>
            <RadialGradient id="timerGlow" cx="50%" cy="38%" r="70%">
              <Stop offset="0%" stopColor={colors.axel} stopOpacity={0.55} />
              <Stop offset="55%" stopColor={colors.axel} stopOpacity={0.18} />
              <Stop offset="100%" stopColor={colors.axel} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Path d={sectorPath(cx, cy, 118, sweep)} fill="url(#timerGlow)" />
          <Path
            d={sectorPath(cx, cy, 92, sweep)}
            fill={colors.axel}
            opacity={0.22}
          />
        </Svg>
        <Text
          variant="hero"
          style={{
            fontSize: 56,
            letterSpacing: -1.5,
            lineHeight: 64,
            fontVariant: ['tabular-nums'],
          }}
        >
          {mmss(remainingSec)}
        </Text>
      </View>
      <PressableScale
        accessibilityLabel={running ? 'Pausar' : 'Continuar'}
        onPress={onToggle}
        style={{
          minHeight: 52,
          paddingHorizontal: 28,
          borderRadius: 999,
          backgroundColor: colors.elevated,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
        }}
      >
        <Ionicons name={running ? 'pause' : 'play'} size={22} color={colors.ink} />
      </PressableScale>
    </View>
  )
}
