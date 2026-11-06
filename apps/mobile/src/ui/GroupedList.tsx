import { Children, type ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from './Text'
import { Icon, type IconName } from './Icon'
import { useInPanel } from './Panel'
import { useInSheet } from './surface'
import { useWebBox } from '../components/dashboard/web/webBox'
import { useRipple } from './ripple'
import { useTheme } from '../theme/ThemeProvider'

/** Grupo de linhas no padrão de lista do Android/iOS: uma superfície, linhas separadas por traço. */
export function GroupedList({ children }: { children: ReactNode })
{
  const { colors, elevation } = useTheme()
  const inPanel = useInPanel()
  const inSheet = useInSheet()
  const webBox = useWebBox()
  const rows = Children.toArray(children).filter(Boolean)
  if (!rows.length) return null
  // celular: as linhas ficam direto no fundo da tela, separadas só por traço (como app de banco)
  const flat = !inPanel && !inSheet && !webBox
  return (
    <View
      style={
        inPanel
          ? { marginHorizontal: -20, marginVertical: -16 }
          : flat
            ? { marginHorizontal: -16 }
            : { borderRadius: 16, backgroundColor: colors.elevated, overflow: 'hidden', ...elevation.card }
      }
    >
      {rows.map((row, i) => (
        <View key={i}>
          {i > 0 ? <View style={{ height: StyleSheet.hairlineWidth, marginLeft: flat ? 62 : 16, backgroundColor: colors.hairline }} /> : null}
          {row}
        </View>
      ))}
    </View>
  )
}

/** Quadradinho colorido com o ícone (a "marca" da linha). */
export function RowGlyph({ name, color, children }: { name?: IconName; color: string; children?: ReactNode })
{
  const { colors } = useTheme()
  return (
    <View
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: children ? 'transparent' : color,
      }}
    >
      {children ?? (name ? <Icon name={name} size={17} color={colors.glyphInk} /> : null)}
    </View>
  )
}

export function GroupedRow({
  leading,
  title,
  subtitle,
  value,
  trailing,
  onPress,
  chevron = Boolean(onPress),
  muted,
  subtitleLines = 1,
  accessibilityLabel,
  children,
}: {
  leading?: ReactNode
  title: string
  subtitle?: string
  value?: string
  trailing?: ReactNode
  onPress?: () => void
  chevron?: boolean
  muted?: boolean
  subtitleLines?: number
  accessibilityLabel?: string
  /** Conteúdo extra abaixo do texto (barra de progresso, etc.) */
  children?: ReactNode
})
{
  const { colors } = useTheme()
  const ripple = useRipple()
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? (value ? `${title}: ${value}` : title)}
      android_ripple={onPress ? ripple : undefined}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: subtitle ? 64 : 56,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: pressed ? colors.fill : 'transparent',
      })}
    >
      {leading}
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text variant="body" numberOfLines={1} muted={muted} style={{ fontSize: 16, textDecorationLine: muted ? 'line-through' : 'none' }}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" muted numberOfLines={subtitleLines}>
            {subtitle}
          </Text>
        ) : null}
        {children}
      </View>
      {value ? (
        <Text variant="body" muted numberOfLines={1} style={{ fontSize: 16, flexShrink: 1, maxWidth: '45%' }}>
          {value}
        </Text>
      ) : null}
      {trailing}
      {chevron ? <Icon name="chevron-forward" size={16} color={colors.inkFaint} /> : null}
    </Pressable>
  )
}
