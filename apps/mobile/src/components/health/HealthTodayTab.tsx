import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  findHabit,
  habitPct,
  medsTakenCount,
  formatSleepHours,
} from '@simply-life/shared'
import { Card, Text, SectionHeader, PressableScale, IconBadge, StatusPill } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import type { CuidadosTab } from './healthNav'

import { CrisisSupportCard } from './CrisisSupportCard'

type Props = {
  onGoCuidados: (tab: CuidadosTab) => void
  onGoApoio: () => void
}


const TILES: {
  id: CuidadosTab
  label: string
  icon: keyof typeof Ionicons.glyphMap
}[] = [
  { id: 'hidratacao', label: 'Água', icon: 'water' },
  { id: 'alimentacao', label: 'Comida', icon: 'restaurant' },
  { id: 'sono', label: 'Sono', icon: 'moon' },
  { id: 'academia', label: 'Academia', icon: 'barbell' },
  { id: 'medicamentos', label: 'Medicamentos', icon: 'medical' },
]

export function HealthTodayTab({ onGoCuidados, onGoApoio }: Props)
{
  const { colors, space, radius } = useTheme()
  const habits = useDataStore((s) => s.habits)
  const medicamentos = useDataStore((s) => s.medicamentos)
  const humor = useDataStore((s) => s.humor)
  const lastAxelCare = useDataStore((s) => s.lastAxelCare)

  const agua = findHabit(habits, 'agua')
  const proteina = findHabit(habits, 'proteina')
  const treino = findHabit(habits, 'treino')
  const sono = findHabit(habits, 'sono')
  const medsDone = medsTakenCount(medicamentos)
  const ritualTotal = 5
  const ritualDone =
    (agua && agua.progressoAtual >= agua.metaDiaria ? 1 : 0) +
    (proteina && proteina.progressoAtual >= proteina.metaDiaria * 0.5 ? 1 : 0) +
    (sono && sono.progressoAtual >= 6 ? 1 : 0) +
    (treino && treino.progressoAtual > 0 ? 1 : 0) +
    (humor.length > 0 ? 1 : 0)
  const ritualPct = Math.round((ritualDone / ritualTotal) * 100)

  return (
    <View style={{ gap: space.md }}>
      <CrisisSupportCard compact />

      <PressableScale
        onPress={onGoApoio}
        accessibilityRole="button"
        style={{
          minHeight: 56,
          padding: space.md,
          borderRadius: radius.lg,
          gap: 4,
          backgroundColor: colors.elevated,
          borderWidth: 1,
          borderColor: colors.hairline,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <IconBadge name="heart" color={colors.health} size={44} iconSize={22} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">Apoio · foco e TCC</Text>
          <Text variant="caption" muted>
            TDAH, modo aventura e exercícios de pensamento
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />
      </PressableScale>

      {/* Acento AXEL - cobre (1-2× por tela) */}
      <Card
        tone="elevated"
        style={{
          gap: space.sm,
          borderRadius: 18,
          borderTopWidth: 1,
          borderTopColor: colors.axel,
          flexDirection: 'row',
          alignItems: 'flex-start',
        }}
      >
        <IconBadge name="sparkles" color={colors.axel} size={44} iconSize={22} />
        <View style={{ flex: 1, gap: 6 }}>
          <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
            AXEL
          </Text>
          <Text variant="voice">
            {lastAxelCare
              || 'Um cuidado de cada vez. Água, comida e movimento no seu ritmo.'}
          </Text>
        </View>
      </Card>

      <Card tone="elevated" style={{ gap: space.md, borderRadius: 18 }}>
        <SectionHeader
          title="Cuidado de hoje"
          subtitle={`${ritualDone} de ${ritualTotal} registrados`}
        />
        <View
          style={{
            height: 8,
            borderRadius: radius.pill,
            backgroundColor: colors.hairline,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${ritualPct}%`,
              height: '100%',
              backgroundColor: colors.health,
            }}
          />
        </View>
        <StatusPill
          label={ritualPct >= 100 ? 'Ritual completo' : `${ritualDone}/${ritualTotal} cuidados`}
          color={ritualPct >= 100 ? colors.health : colors.axel}
        />
      </Card>

      <View style={{ gap: space.sm }}>
        {TILES.map((tile) =>
        {
          let value = '-'
          let done = false
          let pillLabel = 'Pendente'
          if (tile.id === 'hidratacao')
          {
            value = agua ? `${agua.progressoAtual}/${agua.metaDiaria} copos` : '-'
            done = Boolean(agua && agua.progressoAtual >= agua.metaDiaria)
            pillLabel = done ? 'Meta ok' : value
          }
          else if (tile.id === 'alimentacao')
          {
            value = proteina ? `${proteina.progressoAtual}g · ${habitPct(proteina)}%` : '-'
            done = Boolean(proteina && proteina.progressoAtual >= proteina.metaDiaria)
            pillLabel = done ? 'Meta ok' : value
          }
          else if (tile.id === 'sono')
          {
            value = sono && sono.progressoAtual > 0 ? formatSleepHours(sono.progressoAtual) : 'Sem registro'
            done = Boolean(sono && sono.progressoAtual >= 6)
            pillLabel = done ? 'Noite ok' : value
          }
          else if (tile.id === 'academia')
          {
            value = treino?.progressoAtual ? 'Sessão feita' : 'Pendente'
            done = Boolean(treino?.progressoAtual)
            pillLabel = done ? 'Feito' : 'Pendente'
          }
          else
          {
            value = medicamentos.length
              ? `${medsDone}/${medicamentos.length} doses`
              : 'Nada cadastrado'
            done = medicamentos.length > 0 && medsDone >= medicamentos.length
            pillLabel = medicamentos.length
              ? `${medsDone}/${medicamentos.length} doses`
              : 'Pendente'
          }

          return (
            <PressableScale key={tile.id} onPress={() => onGoCuidados(tile.id)}>
              <Card
                tone="elevated"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.md,
                  borderRadius: 18,
                }}
              >
                <IconBadge
                  name={tile.icon}
                  color={done ? colors.health : colors.health}
                  size={40}
                  iconSize={20}
                />
                <View style={{ flex: 1, gap: 6 }}>
                  <Text variant="bodyStrong">{tile.label}</Text>
                  <StatusPill
                    label={pillLabel}
                    color={done ? colors.health : colors.axel}
                  />
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
              </Card>
            </PressableScale>
          )
        })}
      </View>
    </View>
  )
}
