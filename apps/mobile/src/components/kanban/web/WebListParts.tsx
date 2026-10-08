import { type ReactNode } from 'react'
import { View } from 'react-native'
import { Text } from '../../../ui'
import { Icon, type IconName } from '../../../ui/Icon'
import { useTheme } from '../../../theme/ThemeProvider'
import { WebHoverable } from '../../dashboard/web/WebHoverable'
import { webStyle } from '../../dashboard/web/webStyle'
import { LEX, SECTION_LABEL, useRowHover } from './kanbanWeb'

/** Superfície de lista: a mesma caixa do resto da web, sem recuo (as linhas têm o seu). */
export function ListSurface({ children }: { children: ReactNode })
{
  const { colors } = useTheme()
  return (
    <View
      style={{
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.hairline,
        backgroundColor: colors.elevated,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  )
}

/** Cabeçalho de seção dentro da superfície: título, contagem e um "+" opcional. */
export function SectionHead({
  title,
  count,
  color,
  first,
  onAdd,
  addLabel,
}: {
  title: string
  count?: number
  color?: string
  first?: boolean
  onAdd?: () => void
  addLabel?: string
})
{
  const { colors } = useTheme()
  const hoverBg = useRowHover()
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 20,
        paddingTop: first ? 14 : 18,
        paddingBottom: 8,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: colors.hairline,
      }}
    >
      <Text style={[SECTION_LABEL, { fontSize: 14, lineHeight: 20, color: color ?? colors.ink }]}>{title}</Text>
      {typeof count === 'number' ? (
        <Text style={[LEX.regular, { fontSize: 14, lineHeight: 20, color: colors.inkFaint }]}>{count}</Text>
      ) : null}
      <View style={{ flex: 1 }} />
      {onAdd ? (
        <WebHoverable
          onPress={onAdd}
          accessibilityLabel={addLabel ?? 'Adicionar'}
          style={(hovered) => webStyle({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            height: 28,
            paddingHorizontal: 8,
            borderRadius: 8,
            backgroundColor: hovered ? hoverBg : 'transparent',
            cursor: 'pointer',
          })}
        >
          <Icon name="add" size={15} color={colors.axel} />
          <Text style={[LEX.medium, { fontSize: 13, lineHeight: 18, color: colors.axel }]}>Adicionar</Text>
        </WebHoverable>
      ) : null}
    </View>
  )
}

/** Linha da coluna lateral (listas e próximos dias): ícone, rótulo, contagem. */
export function SideRow({
  icon,
  label,
  count,
  active,
  onPress,
  hint,
}: {
  icon?: IconName
  label: string
  count?: number | string
  active?: boolean
  onPress: () => void
  hint?: string
})
{
  const { colors } = useTheme()
  const hoverBg = useRowHover()
  return (
    <WebHoverable
      onPress={onPress}
      accessibilityLabel={label}
      style={(hovered) => webStyle({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        height: 36,
        paddingHorizontal: 10,
        marginHorizontal: -10,
        borderRadius: 8,
        backgroundColor: active ? colors.axelMuted : hovered ? hoverBg : 'transparent',
        cursor: 'pointer',
      })}
    >
      {icon ? <Icon name={icon} size={17} color={active ? colors.axel : colors.inkMuted} /> : null}
      <Text
        numberOfLines={1}
        style={[active ? LEX.medium : LEX.regular, { flex: 1, fontSize: 14, lineHeight: 20, color: active ? colors.axel : colors.ink }]}
      >
        {label}
      </Text>
      {hint ? (
        <Text style={[LEX.regular, { fontSize: 13, lineHeight: 18, color: colors.inkFaint }]}>{hint}</Text>
      ) : null}
      {count != null ? (
        <Text style={[LEX.regular, { fontSize: 14, lineHeight: 20, color: active ? colors.axel : colors.inkMuted }]}>{count}</Text>
      ) : null}
    </WebHoverable>
  )
}

/** Alternador de modo (ex.: Prazo, Status, Agenda): botões colados, um ativo. Troca as pílulas do celular. */
export function WebSegmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
})
{
  const { colors } = useTheme()
  const hoverBg = useRowHover()
  return (
    <View
      style={{
        flexDirection: 'row',
        alignSelf: 'flex-start',
        padding: 3,
        gap: 2,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.hairline,
        backgroundColor: colors.elevated,
      }}
    >
      {options.map((o) =>
      {
        const active = o.id === value
        return (
          <WebHoverable
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityLabel={o.label}
            style={(hovered) => webStyle({
              height: 30,
              justifyContent: 'center',
              paddingHorizontal: 14,
              borderRadius: 7,
              backgroundColor: active ? colors.axelMuted : hovered ? hoverBg : 'transparent',
              cursor: 'pointer',
            })}
          >
            <Text style={[active ? LEX.medium : LEX.regular, { fontSize: 14, lineHeight: 20, color: active ? colors.axel : colors.inkMuted }]}>
              {o.label}
            </Text>
          </WebHoverable>
        )
      })}
    </View>
  )
}
