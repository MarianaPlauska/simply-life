import { Text as RNText, type TextProps, type TextStyle } from 'react-native'
import { type TypeRole } from '@simply-life/ui-tokens'
import { useTheme } from '../theme/ThemeProvider'

/** Famílias nomeadas - sem fontWeight extra (quebra o face no RN/web) */
const WEIGHT_TO_LEXEND: Record<string, string> = {
  '400': 'Lexend_400Regular',
  '500': 'Lexend_500Medium',
  '600': 'Lexend_600SemiBold',
  '700': 'Lexend_700Bold',
}

const WEIGHT_TO_FRAUNCES: Record<string, string> = {
  '400': 'Fraunces_500Medium',
  '500': 'Fraunces_500Medium',
  '600': 'Fraunces_600SemiBold',
  '700': 'Fraunces_600SemiBold',
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
  const isVoice = spec.family === 'voice'
  const weightKey = String(spec.weight)

  const base: TextStyle = {
    fontSize: spec.size,
    lineHeight: spec.lineHeight,
    fontFamily: isVoice
      ? (WEIGHT_TO_FRAUNCES[weightKey] ?? 'Fraunces_500Medium')
      : (WEIGHT_TO_LEXEND[weightKey] ?? 'Lexend_400Regular'),
    ...(spec.letterSpacing != null ? { letterSpacing: spec.letterSpacing } : null),
    color: color ?? (muted ? colors.inkMuted : colors.ink),
  }

  return <RNText style={[base, style]} {...rest} />
}
