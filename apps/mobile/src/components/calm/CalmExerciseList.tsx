import { View } from 'react-native'
import { CALM_EXERCISES } from '@simply-life/shared'
import { chartColor } from '@simply-life/ui-tokens'
import { Text, PressableScale, Icon, type IconName } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

const ICONS: Record<string, IconName> = {
  box_breathing: 'pulse',
  grounding_54321: 'leaf-outline',
}

/**
 * Guias de "Acalmar agora". Teal da paleta (o verde fica por último), sem coral:
 * aqui não é ação urgente, é pausa. Usado no painel do botão de folha e em Saúde → Apoio.
 */
export function CalmExerciseList({ onPick }: { onPick: (route: string) => void })
{
  const { colors, space, radius, chart } = useTheme()
  const tint = chartColor(chart, 'teal')

  return (
    <View style={{ gap: space.sm }}>
      {CALM_EXERCISES.map((ex) => (
        <PressableScale
          key={ex.id}
          accessibilityRole="button"
          accessibilityLabel={`${ex.title}, cerca de ${ex.durationMin} minutos`}
          onPress={() => onPick(ex.route)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.md,
            minHeight: 64,
            padding: space.md,
            borderRadius: radius.control,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.hairline,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${tint}1F`,
            }}
          >
            <Icon name={ICONS[ex.id] ?? 'leaf-outline'} size={20} color={tint} weight="duotone" />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Text variant="bodyStrong">{ex.title}</Text>
            <Text variant="caption" muted>
              {ex.subtitle}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="time-outline" size={14} color={colors.inkMuted} />
              <Text variant="micro" muted>
                Cerca de {ex.durationMin} min
              </Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.inkFaint} />
        </PressableScale>
      ))}
    </View>
  )
}
