import { ScrollView, View } from 'react-native'
import { Text, PressableScale } from './index'
import { useTheme } from '../theme/ThemeProvider'

export type SubNavTab<T extends string> = {
  id: T
  label: string
  count?: number
}

/** Sub-navegação com divisória fina - padrão web AXEL */
export function SubNavTabs<T extends string>({
  tabs,
  value,
  onChange,
  accent = 'health',
}: {
  tabs: SubNavTab<T>[]
  value: T
  onChange: (id: T) => void
  accent?: 'health' | 'finance' | 'axel'
})
{
  const { colors } = useTheme()
  const accentColor =
    accent === 'finance' ? colors.finance : accent === 'axel' ? colors.axel : colors.health

  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 4 }}>
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
                  minHeight: 40,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderBottomWidth: 2,
                  borderBottomColor: active ? accentColor : 'transparent',
                  marginBottom: -1,
                }}
              >
                <Text
                  variant="label"
                  color={active ? accentColor : colors.inkMuted}
                >
                  {label}
                </Text>
              </PressableScale>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
}
