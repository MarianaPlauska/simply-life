import { Pressable, ScrollView, View } from 'react-native'
import { useWebDesk } from '../components/dashboard/web/webBox'
import { useRipple } from './ripple'
import { Text } from './Text'
import { PressableScale } from './PressableScale'
import { useTheme } from '../theme/ThemeProvider'
import { hapticSelect } from '../lib/haptics'

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
  const ripple = useRipple()
  const accentColor =
    accent === 'finance' ? colors.finance : accent === 'axel' ? colors.axel : colors.health
  const desk = useWebDesk()

  // celular com poucas abas: abas fixas de largura igual (Material 3, "primary tabs")
  if (!desk && tabs.length <= 4)
  {
    return (
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
        {tabs.map((tab) =>
        {
          const active = tab.id === value
          return (
            <Pressable
              key={tab.id}
              onPress={() =>
              {
                hapticSelect()
                onChange(tab.id)
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              android_ripple={ripple}
              style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'flex-end' }}
            >
              <Text
                variant="label"
                numberOfLines={1}
                color={active ? colors.ink : colors.inkMuted}
                style={{ fontWeight: active ? '600' : '500', paddingBottom: 12 }}
              >
                {typeof tab.count === 'number' ? `${tab.label} · ${tab.count}` : tab.label}
              </Text>
              <View
                style={{
                  height: 3,
                  width: '60%',
                  borderTopLeftRadius: 3,
                  borderTopRightRadius: 3,
                  backgroundColor: active ? accentColor : 'transparent',
                }}
              />
            </Pressable>
          )
        })}
      </View>
    )
  }

  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
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
                onPress={() =>
                {
                  hapticSelect()
                  onChange(tab.id)
                }}
                style={{
                  minHeight: 48,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  justifyContent: 'center',
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
