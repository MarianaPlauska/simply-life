import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  findHabit,
  habitPct,
  medsTakenCount,
} from '@simply-life/shared'
import { Card, Text, SectionHeader, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import type { CuidadosTab } from './healthNav'

type Props = {
  onGoCuidados: (tab: CuidadosTab) => void
}

const TILES: { id: CuidadosTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'hidratacao', label: 'Água', icon: 'water' },
  { id: 'alimentacao', label: 'Comida', icon: 'restaurant' },
  { id: 'academia', label: 'Academia', icon: 'barbell' },
  { id: 'medicamentos', label: 'Medicamentos', icon: 'medical' },
]

export function HealthTodayTab({ onGoCuidados }: Props)
{
  const { colors, space, radius } = useTheme()
  const habits = useDataStore((s) => s.habits)
  const medicamentos = useDataStore((s) => s.medicamentos)
  const humor = useDataStore((s) => s.humor)
  const lastAxelCare = useDataStore((s) => s.lastAxelCare)

  const agua = findHabit(habits, 'agua')
  const proteina = findHabit(habits, 'proteina')
  const treino = findHabit(habits, 'treino')
  const medsDone = medsTakenCount(medicamentos)
  const ritualTotal = 4
  const ritualDone =
    (agua && agua.progressoAtual >= agua.metaDiaria ? 1 : 0) +
    (proteina && proteina.progressoAtual >= proteina.metaDiaria * 0.5 ? 1 : 0) +
    (treino && treino.progressoAtual > 0 ? 1 : 0) +
    (humor.length > 0 ? 1 : 0)
  const ritualPct = Math.round((ritualDone / ritualTotal) * 100)

  return (
    <View style={{ gap: space.lg }}>
      {lastAxelCare ? (
        <Card tone="hero" style={{ gap: space.sm }}>
          <Text variant="caption" color={colors.axel}>
            AXEL
          </Text>
          <Text variant="voice">{lastAxelCare}</Text>
        </Card>
      ) : null}

      <Card tone="elevated" style={{ gap: space.md }}>
        <SectionHeader title="Cuidado de hoje" subtitle={`${ritualDone} de ${ritualTotal} registrados`} />
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
        <Text variant="caption" muted>
          {ritualPct >= 100 ? 'Ritual completo — parabéns!' : 'Toque em um cuidado para registrar'}
        </Text>
      </Card>

      <View style={{ gap: space.sm }}>
        {TILES.map((tile) =>
        {
          let value = '—'
          let done = false
          if (tile.id === 'hidratacao')
          {
            value = agua ? `${agua.progressoAtual}/${agua.metaDiaria} copos` : '—'
            done = Boolean(agua && agua.progressoAtual >= agua.metaDiaria)
          }
          else if (tile.id === 'alimentacao')
          {
            value = proteina ? `${proteina.progressoAtual}g · ${habitPct(proteina)}%` : '—'
            done = Boolean(proteina && proteina.progressoAtual >= proteina.metaDiaria)
          }
          else if (tile.id === 'academia')
          {
            value = treino?.progressoAtual ? 'Sessão feita' : 'Pendente'
            done = Boolean(treino?.progressoAtual)
          }
          else
          {
            value = medicamentos.length
              ? `${medsDone}/${medicamentos.length} doses`
              : 'Nada cadastrado'
            done = medicamentos.length > 0 && medsDone >= medicamentos.length
          }

          return (
            <PressableScale key={tile.id} onPress={() => onGoCuidados(tile.id)}>
              <Card
                tone="elevated"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.md,
                  borderColor: done ? colors.healthMuted : colors.hairline,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: done ? colors.healthMuted : colors.elevated,
                  }}
                >
                  <Ionicons
                    name={tile.icon}
                    size={20}
                    color={done ? colors.health : colors.inkMuted}
                  />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">{tile.label}</Text>
                  <Text variant="caption" muted>
                    {value}
                  </Text>
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
