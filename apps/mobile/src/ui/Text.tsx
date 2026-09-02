import { Text as RNText, type TextProps, type TextStyle } from 'react-native'
import { type TypeRole } from '@simply-life/ui-tokens'
import { useTheme } from '../theme/ThemeProvider'

/** Famílias nomeadas — sem fontWeight extra (quebra o face no RN/web) */
const WEIGHT_TO_MANROPE: Record<string, string> = {
  '400': 'Manrope_400Regular',
  '500': 'Manrope_500Medium',
  '600': 'Manrope_600SemiBold',
  '700': 'Manrope_700Bold',
}

type Props = Omit<TextProps, 'role'> & {
  variant?: TypeRole
  muted?: boolean
  color?: string
}

export function Text({ variant = 'body', muted, color, style, ...rest }: Props)
{
  const { colors, type } = useTheme()
  const spec = type[variant]
  const isVoice = variant === 'voice'
  const weightKey = String(spec.weight)

  const base: TextStyle = {
    fontSize: spec.size,
    lineHeight: spec.lineHeight,
    fontFamily: isVoice
      ? 'Fraunces_500Medium'
      : (WEIGHT_TO_MANROPE[weightKey] ?? 'Manrope_400Regular'),
    color: color ?? (muted ? colors.inkMuted : colors.ink),
  }

  return <RNText style={[base, style]} {...rest} />
}
