import { useState } from 'react'
import { TextInput, View, type TextInputProps } from 'react-native'
import { Text } from './Text'
import { useTheme } from '../theme/ThemeProvider'

type Props = TextInputProps & {
  label: string
  error?: string
  /** sand = campo no papel do studio · widget = painel escuro da Saúde/Home */
  tone?: 'default' | 'sand' | 'widget'
}

/** Campo com label - focus ring AXEL */
export function Field({ label, error, tone = 'default', style, onFocus, onBlur, ...rest }: Props)
{
  const { colors, radius } = useTheme()
  const [focused, setFocused] = useState(false)
  const fill =
    tone === 'widget'
      ? colors.canvas
      : tone === 'sand'
        ? colors.hairline
        : colors.elevated
  const labelColor =
    tone === 'widget'
      ? focused
        ? colors.health
        : colors.widgetMuted
      : focused
        ? colors.axel
        : colors.inkMuted
  const textColor = tone === 'widget' ? colors.widgetInk : colors.ink

  return (
    <View style={{ gap: 6 }}>
      <Text variant="label" color={labelColor}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={colors.inkFaint}
        onFocus={(e) =>
        {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) =>
        {
          setFocused(false)
          onBlur?.(e)
        }}
        style={[
          {
            minHeight: 52,
            borderRadius: radius.control,
            paddingHorizontal: 16,
            fontSize: 16,
            fontFamily: 'Manrope_400Regular',
            color: textColor,
            backgroundColor: fill,
            borderWidth: 0,
            borderColor: error
              ? colors.danger
              : focused
                ? colors.axel
                : colors.hairline,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" color={colors.danger}>
          {error}
        </Text>
      ) : null}
    </View>
  )
}
