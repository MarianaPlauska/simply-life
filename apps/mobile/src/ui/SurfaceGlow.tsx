import { useId } from 'react'
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg'
import { useTheme } from '../theme/ThemeProvider'

type Props = {
  /** Pico do coral no canto. Hero usa ~0.28; o restante da página, um pouco menos. */
  opacity?: number
}

/**
 * Mancha coral no canto superior direito — o mesmo brilho do progresso de hoje.
 * Cada instância tem id próprio para não misturar os gradientes na tela.
 */
export function SurfaceGlow({ opacity }: Props)
{
  const { colors, mode } = useTheme()
  const raw = useId().replace(/:/g, '')
  const id = `sg-${raw}`
  const peak = opacity ?? (mode === 'dark' ? 0.2 : 0.12)

  return (
    <Svg
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      width="100%"
      height="100%"
    >
      <Defs>
        <RadialGradient id={id} cx="100%" cy="0%" r="70%">
          <Stop offset="0" stopColor={colors.axelFill} stopOpacity={peak} />
          <Stop offset="1" stopColor={colors.axelFill} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  )
}
