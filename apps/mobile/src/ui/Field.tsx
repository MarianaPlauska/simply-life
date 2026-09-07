import { useState } from 'react'
import { TextInput, View, type TextInputProps } from 'react-native'
import { Text } from './Text'
import { useTheme } from '../theme/ThemeProvider'

type Props = TextInputProps & {
  label: string
  error?: string
  /** sand = campo no papel do studio (não branco) */
  tone?: 'default' | 'sand'
}

/** Campo com label - focus ring AXEL */
export function Field({ label, error, tone = 'default', style, onFocus, onBlur, ...rest }: Props)
{
  const { colors, radius } = useTheme()
  const [focused, setFocused] = useState(false)
  const fill = tone === 'sand' ? colors.hairline : colors.elevated

  return (
    <View style={{ gap: 6 }}>
      <Text variant="label" color={focused ? colors.axel : colors.inkMuted}>
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
            color: colors.ink,
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
