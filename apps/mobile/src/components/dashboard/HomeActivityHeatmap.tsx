import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { eloFrase, type MobileTask } from '@simply-life/shared'
import { Text } from '../../ui'
import { Icon } from '../../ui/Icon'
import { useTheme } from '../../theme/ThemeProvider'
import { useAccents } from '../../theme/useAccents'
import { useElo } from '../../hooks/useElo'

type Props = {
  /** mantido por compatibilidade; o elo vem de useElo (tarefas entram pela conclusão) */
  tasks?: MobileTask[]
}

/** Linha "Seus dias": mostra o que já aconteceu, sem meta nem cobrança. */
export function HomeActivityHeatmap(_props: Props)
{
  const { colors } = useTheme()
  const accents = useAccents()
  const router = useRouter()
  const elo = useElo()
  const semana = elo.cumpridosNaSemana

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ver seus dias"
      onPress={() => router.push('/ofensiva')}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        minHeight: 64,
        paddingVertical: 12,
        backgroundColor: pressed ? colors.fill : 'transparent',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.hairline,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          backgroundColor: `${accents.data}26`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="leaf" size={18} color={accents.data} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text variant="bodyStrong">Seus dias</Text>
        <Text variant="caption" muted numberOfLines={2}>
          {semana > 0
            ? `${semana} dia${semana === 1 ? '' : 's'} com algo seu nesta semana. `
            : ''}
          {eloFrase(elo)}
        </Text>
      </View>
      <Icon name="chevron-forward" size={18} color={colors.inkMuted} />
    </Pressable>
  )
}
