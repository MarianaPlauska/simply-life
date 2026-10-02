import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { eloFrase, type MobileTask } from '@simply-life/shared'
import { Text, ProgressRing, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAccents } from '../../theme/useAccents'
import { useElo } from '../../hooks/useElo'

type Props = {
  /** mantido por compatibilidade; o elo vem de useElo (tarefas entram pela conclusão) */
  tasks?: MobileTask[]
}

/** Card de insight — fundo suave, CTA, sem caixa dentro de caixa. */
export function HomeActivityHeatmap(_props: Props)
{
  const { colors } = useTheme()
  const accents = useAccents()
  const router = useRouter()
  const elo = useElo()
  const current = elo.atual
  const record = elo.recorde

  const ringPct = Math.min(100, Math.round((current / 30) * 100))
  const phrase = eloFrase(elo)

  return (
    <View
      style={{
        borderRadius: 20,
        padding: 20,
        gap: 16,
        backgroundColor: colors.elevated,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <ProgressRing
          progress={ringPct}
          size={64}
          strokeWidth={5}
          color={accents.data}
          centerLabel={String(current)}
        />
        <View style={{ flex: 1, gap: 8, minWidth: 0 }}>
          <Text variant="caption" muted>
            Elo
          </Text>
          <Text variant="bodyStrong" style={{ fontSize: 17 }}>
            {current} dia{current === 1 ? '' : 's'} cumprido{current === 1 ? '' : 's'}
          </Text>
          <Text variant="caption" muted style={{ lineHeight: 18 }}>
            {phrase} Recorde: {record} dia{record === 1 ? '' : 's'}.
          </Text>
        </View>
      </View>
      <PressableScale
        accessibilityLabel="Ver elo"
        onPress={() => router.push('/ofensiva')}
        style={{
          alignSelf: 'stretch',
          minHeight: 44,
          borderRadius: 999,
          backgroundColor: colors.axelFill,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text variant="label" style={{ color: colors.axelOnFill, fontWeight: '700' }}>
          Ver elo
        </Text>
      </PressableScale>
    </View>
  )
}
