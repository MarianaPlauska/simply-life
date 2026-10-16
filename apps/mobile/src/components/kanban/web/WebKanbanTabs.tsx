import { type ReactNode } from 'react'
import { View } from 'react-native'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { WebHoverable } from '../../dashboard/web/WebHoverable'
import { webStyle } from '../../dashboard/web/webStyle'
import { LEX } from './kanbanWeb'

export type WebTab<T extends string> = { id: T; label: string; count?: number }

/**
 * Barra de abas do computador: texto de 14px, contagem discreta ao lado,
 * sublinhado na ativa. `right` recebe ações da página, na mesma linha.
 */
export function WebKanbanTabs<T extends string>({
  tabs,
  value,
  onChange,
  right,
  size = 'md',
}: {
  tabs: WebTab<T>[]
  value: T
  onChange: (id: T) => void
  right?: ReactNode
  /** sm: sub-abas (relatórios), um pouco mais baixas */
  size?: 'md' | 'sm'
})
{
  const { colors } = useTheme()
  const h = size === 'sm' ? 40 : 46

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        columnGap: 24,
        borderBottomWidth: 1,
        borderBottomColor: colors.hairline,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 4, flexShrink: 1, flexWrap: 'wrap' }}>
        {tabs.map((tab) =>
        {
          const active = tab.id === value
          return (
            <WebHoverable
              key={tab.id}
              onPress={() => onChange(tab.id)}
              accessibilityLabel={tab.label}
              style={(hovered) => webStyle({
                height: h,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 12,
                marginBottom: -1,
                borderBottomWidth: 2,
                borderBottomColor: active ? colors.axel : hovered ? colors.hairlineStrong : 'transparent',
                cursor: 'pointer',
              })}
            >
              <Text
                style={[
                  active ? LEX.medium : LEX.regular,
                  { fontSize: size === 'sm' ? 14 : 15, lineHeight: 20, color: active ? colors.ink : colors.inkMuted },
                ]}
              >
                {tab.label}
              </Text>
              {typeof tab.count === 'number' && tab.count > 0 ? (
                <View
                  style={{
                    minWidth: 22,
                    paddingHorizontal: 6,
                    height: 20,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.hairline,
                  }}
                >
                  <Text style={[LEX.medium, { fontSize: 13, lineHeight: 16, color: colors.inkMuted }]}>{tab.count}</Text>
                </View>
              ) : null}
            </WebHoverable>
          )
        })}
      </View>
      {right ? (
        <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 20, paddingVertical: 6 }}>
          {right}
        </View>
      ) : null}
    </View>
  )
}
