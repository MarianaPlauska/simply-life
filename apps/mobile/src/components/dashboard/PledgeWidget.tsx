import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { localTodayIso, pledgeProgress } from '@simply-life/shared'
import { Card, PrimaryButton, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useLifePledgeStore } from '../../store/lifePledgeStore'

/** Atalho da Home: a meta fixada, com a faixa de dias. */
export function PledgeWidget()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const pledges = useLifePledgeStore((s) => s.pledges)
  const pledge = pledges.find((p) => p.pinned) ?? pledges[0]
  const today = localTodayIso()

  if (!pledge)
  {
    return (
      <Card tone="elevated" style={{ gap: space.sm, width: '100%', alignSelf: 'stretch' }}>
        <Text variant="caption" muted>Meta importante</Text>
        <Text variant="body">Um ano sem beber, se for o seu caso.</Text>
        <Text variant="caption" muted>O dia conta sozinho.</Text>
        <PrimaryButton
          label="Criar"
          variant="link"
          size="sm"
          onPress={() => router.push('/metas-vida' as never)}
        />
      </Card>
    )
  }

  const progress = pledgeProgress(pledge.startedOn, pledge.targetDays, today)
  const line = progress.complete
    ? `${progress.elapsed} dias. A meta de ${progress.target} já chegou.`
    : `${progress.elapsed} de ${progress.target} dias. Faltam ${progress.left}.`

  return (
    <Card tone="elevated" style={{ gap: space.sm, width: '100%', alignSelf: 'stretch' }}>
      <Text variant="caption" muted>Meta importante</Text>
      <Text variant="body">{pledge.title}</Text>
      <View
        style={{
          height: 10,
          borderRadius: 999,
          backgroundColor: colors.hairline,
          overflow: 'hidden',
        }}
      >
        <View style={{ width: `${progress.pct}%`, height: '100%', backgroundColor: colors.health }} />
      </View>
      <Text variant="caption" muted>{line}</Text>
      <PrimaryButton
        label="Ver a meta"
        variant="link"
        size="sm"
        onPress={() => router.push('/metas-vida' as never)}
      />
    </Card>
  )
}
