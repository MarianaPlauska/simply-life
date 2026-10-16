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
  const { colors, mode } = useTheme()
  // foco na tinta da marca: petróleo (confiança, calma) é o complementar do coral das ações
  const focusInk = mode === 'dark' ? colors.brandInk : colors.brand
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
        ? focusInk
        : colors.featureMuted
      : focused
        ? focusInk
        : colors.inkMuted
  const textColor = tone === 'widget' ? colors.featureInk : colors.ink

  return (
    <View style={{ gap: 6 }}>
      <Text variant="label" color={labelColor}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={colors.inkFaint}
        // cores da marca no lugar das do sistema (o Android usa a cor de destaque do aparelho)
        underlineColorAndroid="transparent"
        cursorColor={focusInk}
        selectionColor={`${colors.axelFill}55`}
        selectionHandleColor={colors.axelFill}
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
            minHeight: rest.multiline ? 112 : 52,
            // várias linhas: caixa mais alta e o texto com respiro, sem colar no topo
            ...(rest.multiline
              ? { paddingTop: 14, paddingBottom: 14, textAlignVertical: 'top' as const, lineHeight: 24 }
              : null),
            // caixa de texto um pouco mais reta que botões e pílulas
            borderRadius: 10,
            paddingHorizontal: 16,
            fontSize: 16,
            fontFamily: 'Lexend_400Regular',
            color: textColor,
            backgroundColor: fill,
            // borda sempre de 1px (transparente sem foco) para o texto não pular ao focar
            borderWidth: 1,
            borderColor: error
              ? colors.danger
              : focused
                ? focusInk
                : 'transparent',
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
