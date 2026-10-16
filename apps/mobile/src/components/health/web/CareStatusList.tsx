import { View } from 'react-native'
import { findHabit, formatSleepHours, medsTakenCount } from '@simply-life/shared'
import { Text } from '../../../ui'
import { Icon } from '../../../ui/Icon'
import { useTheme } from '../../../theme/ThemeProvider'
import { useDataStore } from '../../../store/dataStore'
import { useModules } from '../../../hooks/useModules'
import { WebHoverable } from '../../dashboard/web/WebHoverable'
import { webStyle } from '../../dashboard/web/webStyle'
import { CARE_MODULE, type CuidadosTab } from '../healthNav'

type CareItem = {
  id: CuidadosTab
  label: string
  icon: keyof typeof Icon.glyphMap
  value: string
  done: boolean
}

/** Situação de cada cuidado hoje (só os que a pessoa usa). */
export function useCareStatus(): CareItem[]
{
  const modules = useModules()
  const habits = useDataStore((s) => s.habits)
  const medicamentos = useDataStore((s) => s.medicamentos)
  const agua = findHabit(habits, 'agua')
  const proteina = findHabit(habits, 'proteina')
  const sono = findHabit(habits, 'sono')
  const treino = findHabit(habits, 'treino')
  const medsDone = medsTakenCount(medicamentos)

  const all: CareItem[] = [
    {
      id: 'hidratacao',
      label: 'Água',
      icon: 'water-outline',
      value: agua ? `${agua.progressoAtual}/${agua.metaDiaria} copos` : 'Sem registro',
      done: Boolean(agua && agua.progressoAtual >= agua.metaDiaria),
    },
    {
      id: 'alimentacao',
      label: 'Comida',
      icon: 'restaurant-outline',
      value: proteina ? `${proteina.progressoAtual}g de ${proteina.metaDiaria}g` : 'Sem registro',
      done: Boolean(proteina && proteina.progressoAtual >= proteina.metaDiaria),
    },
    {
      id: 'sono',
      label: 'Sono',
      icon: 'moon-outline',
      value: sono && sono.progressoAtual > 0 ? formatSleepHours(sono.progressoAtual) : 'Sem registro',
      done: Boolean(sono && sono.progressoAtual >= 6),
    },
    {
      id: 'academia',
      label: 'Academia',
      icon: 'barbell-outline',
      value: treino?.progressoAtual ? 'Sessão feita' : 'Quando quiser',
      done: Boolean(treino?.progressoAtual),
    },
    {
      id: 'medicamentos',
      label: 'Medicamentos',
      icon: 'medical-outline',
      value: medicamentos.length ? `${medsDone}/${medicamentos.length} doses` : 'Nada cadastrado',
      done: medicamentos.length > 0 && medsDone >= medicamentos.length,
    },
  ]
  return all.filter((c) => modules.on(CARE_MODULE[c.id]))
}

type Props = {
  onPick: (tab: CuidadosTab) => void
  /** 'row': células lado a lado (Hoje); 'list': uma por linha (coluna lateral de Cuidados) */
  layout?: 'row' | 'list'
  /** cuidado aberto agora (destacado na lista) */
  current?: CuidadosTab
}

/** Lista clicável dos cuidados de hoje, para a web no computador. */
export function CareStatusList({ onPick, layout = 'list', current }: Props)
{
  const { colors } = useTheme()
  const items = useCareStatus()
  const row = layout === 'row'

  return (
    <View
      style={row
        ? webStyle({ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, items.length)}, minmax(0, 1fr))`, gap: 8 })
        : { gap: 4, marginHorizontal: -12 }}
    >
      {items.map((c) =>
      {
        const active = c.id === current
        return (
          <WebHoverable
            key={c.id}
            onPress={() => onPick(c.id)}
            accessibilityLabel={`${c.label}: ${c.value}`}
            style={(hovered) => webStyle({
              flexDirection: row ? 'column' : 'row',
              alignItems: row ? 'flex-start' : 'center',
              gap: row ? 8 : 12,
              paddingVertical: row ? 12 : 10,
              paddingHorizontal: 12,
              borderRadius: 10,
              backgroundColor: active ? colors.canvas : hovered ? colors.surface : 'transparent',
              cursor: 'pointer',
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: row ? undefined : 1, minWidth: 0 }}>
              <Icon name={c.icon} size={18} color={colors.health} />
              <Text variant="body" style={{ fontSize: 15 }}>
                {c.label}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text variant="caption" muted>
                {c.value}
              </Text>
              {c.done ? <Icon name="checkmark-circle" size={16} color={colors.health} /> : null}
            </View>
          </WebHoverable>
        )
      })}
    </View>
  )
}
