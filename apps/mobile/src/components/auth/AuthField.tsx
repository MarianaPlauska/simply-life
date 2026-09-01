import { useState, type ReactNode } from 'react'
import { TextInput, View, type TextInputProps } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = TextInputProps & {
  label: string
  error?: string
  leadingIcon: keyof typeof Ionicons.glyphMap
  trailing?: ReactNode
}

/** Campo de autenticação — label, ícone à esquerda e slot trailing (ex.: Mostrar/Ocultar) */
export function AuthField({
  label,
  error,
  leadingIcon,
  trailing,
  style,
  onFocus,
  onBlur,
  ...rest
}: Props)
{
  const { colors, radius } = useTheme()
  const [focused, setFocused] = useState(false)

  return (
    <View style={{ gap: 6 }}>
      <Text
        variant="label"
        color={focused ? colors.axel : colors.inkMuted}
        style={{ letterSpacing: 0.8, textTransform: 'uppercase', fontSize: 11 }}
      >
        {label}
      </Text>
      <View
        style={{
          minHeight: 52,
          borderRadius: radius.control,
          backgroundColor: colors.elevated,
          borderWidth: 1.5,
          borderColor: error
            ? colors.danger
            : focused
              ? colors.axel
              : colors.hairline,
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 14,
          paddingRight: trailing ? 4 : 14,
          gap: 10,
        }}
      >
        <Ionicons
          name={leadingIcon}
          size={18}
          color={focused ? colors.axel : colors.inkMuted}
        />
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
              flex: 1,
              minHeight: 48,
              fontSize: 16,
              fontFamily: 'Manrope_400Regular',
              color: colors.ink,
              paddingVertical: 0,
            },
            style,
          ]}
          {...rest}
        />
        {trailing}
      </View>
      {error ? (
        <Text variant="caption" color={colors.danger}>
          {error}
        </Text>
      ) : null}
    </View>
  )
}
