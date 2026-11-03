import { useState, type ReactNode } from 'react'
import { TextInput, View, type TextInputProps } from 'react-native'
import { Icon } from '../../ui/Icon'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = TextInputProps & {
  label: string
  error?: string
  leadingIcon: keyof typeof Icon.glyphMap
  trailing?: ReactNode
  compact?: boolean
}

/** Campo de autenticação - label, ícone à esquerda e slot trailing (ex.: Mostrar/Ocultar) */
export function AuthField({
  label,
  error,
  leadingIcon,
  trailing,
  compact = false,
  style,
  onFocus,
  onBlur,
  ...rest
}: Props)
{
  const { colors, radius } = useTheme()
  const [focused, setFocused] = useState(false)

  return (
    <View style={{ gap: compact ? 4 : 6 }}>
      <Text
        variant="label"
        color={focused ? colors.axel : colors.inkMuted}
        style={{ letterSpacing: 0.8, textTransform: 'uppercase', fontSize: 12 }}
      >
        {label}
      </Text>
      <View
        style={{
          minHeight: compact ? 44 : 52,
          borderRadius: radius.control,
          backgroundColor: colors.fill,
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
        <Icon
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
              minHeight: compact ? 42 : 48,
              fontSize: compact ? 15 : 16,
              fontFamily: 'Lexend_400Regular',
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
