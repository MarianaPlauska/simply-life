import { View } from 'react-native'
import { useRouter } from 'expo-router'
import type { LifePattern } from '@simply-life/shared'
import { Card, Text, Icon, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { AxelSun } from '../AxelSun'

/** Uma descoberta, com o quanto dá para confiar nela. */
export function LifePatternItem({ pattern }: { pattern: LifePattern })
{
  const { colors } = useTheme()
  const strong = pattern.strength === 'forte'
  return (
    <View style={{ gap: 6 }}>
      <Text variant="bodyStrong">{pattern.text}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 999,
            backgroundColor: strong ? colors.healthMuted : colors.attentionMuted,
          }}
        >
          <Text variant="micro" color={strong ? colors.health : colors.attention} style={{ fontWeight: '700' }}>
            {strong ? 'Padrão forte' : 'Padrão inicial'}
          </Text>
        </View>
        <Text variant="caption" muted>{pattern.basis}</Text>
      </View>
    </View>
  )
}

/** Home: a descoberta mais forte da vez. Some enquanto não há nenhuma. */
export function LifePatternCard({ patterns }: { patterns: LifePattern[] })
{
  const { colors } = useTheme()
  const router = useRouter()
  const top = patterns[0]
  if (!top) return null
  return (
    <PressableScale onPress={() => router.push('/padroes')} accessibilityRole="button" accessibilityLabel="Ver o que mexe com você">
      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <AxelSun size={32} mood="happy" />
          <Text variant="label" muted style={{ flex: 1 }}>O AXEL percebeu</Text>
          <Icon name="chevron-forward" size={16} color={colors.inkFaint} />
        </View>
        <LifePatternItem pattern={top} />
        {patterns.length > 1 ? (
          <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
            {patterns.length - 1 === 1 ? 'Mais 1 descoberta' : `Mais ${patterns.length - 1} descobertas`}
          </Text>
        ) : null}
      </Card>
    </PressableScale>
  )
}
