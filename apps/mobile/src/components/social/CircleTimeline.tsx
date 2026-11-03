import { View } from 'react-native'
import { Text, Icon } from '../../ui'
import type { IconName } from '../../ui/Icon'
import { useTheme } from '../../theme/ThemeProvider'
import type { CircleMoment } from '../../lib/sync/friends'

const ICON: Record<CircleMoment['kind'], IconName> = {
  joined: 'people-outline',
  cheer: 'heart-outline',
  elo: 'flame-outline',
}

function whenLabel(iso: string): string
{
  const d = new Date(iso)
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (days <= 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  if (days < 7) return `Há ${days} dias`
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

/** Linha vertical com um ponto por momento, do mais novo para o mais antigo. */
export function CircleTimeline({ moments }: { moments: CircleMoment[] })
{
  const { colors } = useTheme()
  const tint: Record<CircleMoment['kind'], string> = {
    joined: colors.tasks,
    cheer: colors.axel,
    elo: colors.attention,
  }

  return (
    <View>
      {moments.map((m, i) => (
        <View key={m.id} style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ alignItems: 'center', width: 36 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.fill,
              }}
            >
              <Icon name={ICON[m.kind]} size={18} color={tint[m.kind]} />
            </View>
            {i < moments.length - 1 ? (
              <View style={{ width: 2, flex: 1, minHeight: 16, backgroundColor: colors.hairline }} />
            ) : null}
          </View>
          <View style={{ flex: 1, minWidth: 0, paddingTop: 2, paddingBottom: 18, gap: 2 }}>
            <Text variant="body">{m.title}</Text>
            <Text variant="caption" muted>
              {m.detail ? `${whenLabel(m.at)} · ${m.detail}` : whenLabel(m.at)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  )
}
