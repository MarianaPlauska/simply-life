import { ScrollView, View } from 'react-native'
import { COMPONENT_SPEC } from '@simply-life/ui-tokens'
import { Text } from './Text'
import { PressableScale } from './PressableScale'
import { useTheme } from '../theme/ThemeProvider'

export type PillTab<T extends string> = {
  id: T
  label: string
  count?: number
}

/** Abas em cápsula — uma linha, rolagem horizontal. */
export function PillTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: PillTab<T>[]
  value: T
  onChange: (id: T) => void
})
{
  const { colors, radius } = useTheme()
  const spec = COMPONENT_SPEC.PillTabs

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spec.gap,
        padding: 4,
        minHeight: spec.height + 8,
      }}
      style={{
        alignSelf: 'stretch',
        borderRadius: radius.pill,
        backgroundColor: colors.elevated,
        maxHeight: spec.height + 8,
      }}
    >
      {tabs.map((tab) =>
      {
        const active = tab.id === value
        const label =
          typeof tab.count === 'number'
            ? `${tab.label} · ${tab.count}`
            : tab.label
        return (
          <PressableScale
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={{
              minHeight: spec.height,
              paddingHorizontal: 16,
              borderRadius: radius.pill,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              backgroundColor: active ? colors.surface : 'transparent',
            }}
          >
            <Text
              variant="label"
              color={active ? colors.ink : colors.inkMuted}
            >
              {label}
            </Text>
          </PressableScale>
        )
      })}
    </ScrollView>
  )
}
