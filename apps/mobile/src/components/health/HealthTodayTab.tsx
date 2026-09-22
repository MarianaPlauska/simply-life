import { useMemo } from 'react'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  findHabit,
  habitPct,
  medsTakenCount,
  formatSleepHours,
  moodLabel,
  isSoftMoodDay,
} from '@simply-life/shared'
import { Card, Text, SectionHeader, PressableScale, IconBadge, StatusPill } from '../../ui'
import { MoodFaceRow } from '../MoodFace'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useAuthStore } from '../../store/authStore'
import type { CuidadosTab } from './healthNav'
import { HealthSoftModeView } from './HealthSoftModeView'

type Props = {
  onGoCuidados: (tab: CuidadosTab) => void
  onGoApoio: () => void
  onGoDiario: () => void
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

/** Aba Hoje: entrada calma, sem pressão de metas nem blocos de crise. */
export function HealthTodayTab({ onGoCuidados, onGoApoio, onGoDiario }: Props)
{
  const { colors, space } = useTheme()
  const habits = useDataStore((s) => s.habits)
  const medicamentos = useDataStore((s) => s.medicamentos)
  const humor = useDataStore((s) => s.humor)
  const lastAxelCare = useDataStore((s) => s.lastAxelCare)
  const addHumor = useDataStore((s) => s.addHumor)
  const isGuest = useAuthStore((s) => s.isGuest)

  const agua = findHabit(habits, 'agua')
  const proteina = findHabit(habits, 'proteina')
  const treino = findHabit(habits, 'treino')
  const sono = findHabit(habits, 'sono')
  const medsDone = medsTakenCount(medicamentos)
  const dia = new Date().toISOString().slice(0, 10)
  const humorHoje = useMemo(
    () => humor.find((h) => (h.data || '').slice(0, 10) === dia) ?? null,
    [humor, dia],
  )

  const pendingTiles = useMemo(() =>
  {
    return TILES.filter((tile) =>
    {
      if (tile.id === 'hidratacao')
      {
        return !agua || agua.progressoAtual < agua.metaDiaria
      }
      if (tile.id === 'alimentacao')
      {
        return !proteina || proteina.progressoAtual < proteina.metaDiaria * 0.5
      }
      if (tile.id === 'sono')
      {
        return !sono || sono.progressoAtual < 6
      }
      if (tile.id === 'academia')
      {
        return !treino?.progressoAtual
      }
      return medicamentos.length === 0 || medsDone < medicamentos.length
    })
  }, [agua, proteina, sono, treino, medicamentos.length, medsDone])

  if (isSoftMoodDay(humor))
  {
    return <HealthSoftModeView onGoApoio={onGoApoio} onGoDiario={onGoDiario} />
  }

  const tileDetail = (tile: typeof TILES[number]): { pillLabel: string; done: boolean } =>
  {
    if (tile.id === 'hidratacao')
    {
      const done = Boolean(agua && agua.progressoAtual >= agua.metaDiaria)
      return {
        pillLabel: agua ? `${agua.progressoAtual}/${agua.metaDiaria} copos` : 'Registrar',
        done,
      }
    }
    if (tile.id === 'alimentacao')
    {
      const done = Boolean(proteina && proteina.progressoAtual >= proteina.metaDiaria)
      return {
        pillLabel: proteina ? `${proteina.progressoAtual}g · ${habitPct(proteina)}%` : 'Registrar',
        done,
      }
    }
    if (tile.id === 'sono')
    {
      const done = Boolean(sono && sono.progressoAtual >= 6)
      return {
        pillLabel: sono && sono.progressoAtual > 0 ? formatSleepHours(sono.progressoAtual) : 'Registrar',
        done,
      }
    }
    if (tile.id === 'academia')
    {
      const done = Boolean(treino?.progressoAtual)
      return { pillLabel: done ? 'Sessão feita' : 'Quando quiser', done }
    }
    const done = medicamentos.length > 0 && medsDone >= medicamentos.length
    return {
      pillLabel: medicamentos.length
        ? `${medsDone}/${medicamentos.length} doses`
        : 'Nada cadastrado',
      done,
    }
  }

  return (
    <View style={{ gap: space.md }}>
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
              || 'Sem pressa. Um passo de cada vez já conta.'}
          </Text>
        </View>
      </Card>

      <Card tone="elevated" style={{ gap: space.md, borderRadius: 18 }}>
        <SectionHeader
          title="Como você está?"
          subtitle={humorHoje ? moodLabel(humorHoje.humor) : 'Toque se quiser registrar'}
        />
        <MoodFaceRow
          value={humorHoje?.humor}
          onChange={(m) => void addHumor(m, undefined, isGuest)}
        />
        <PressableScale onPress={onGoDiario} accessibilityRole="button">
          <Text variant="caption" color={colors.axel} style={{ fontWeight: '600' }}>
            Abrir diário completo
          </Text>
        </PressableScale>
      </Card>

      {pendingTiles.length > 0 ? (
        <View style={{ gap: space.sm }}>
          <SectionHeader
            title="Se quiser registrar"
            subtitle="Só o que fizer sentido agora"
          />
          {pendingTiles.slice(0, 2).map((tile) =>
          {
            const { pillLabel, done } = tileDetail(tile)
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
                    color={colors.health}
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
      ) : (
        <Card tone="elevated" style={{ gap: space.sm, borderRadius: 18 }}>
          <Text variant="bodyStrong">Você já registrou o essencial hoje</Text>
          <Text variant="caption" muted>
            Pode descansar ou revisar no diário quando quiser.
          </Text>
        </Card>
      )}

      <PressableScale
        onPress={() => onGoCuidados('hidratacao')}
        accessibilityRole="button"
        style={{
          minHeight: 48,
          paddingHorizontal: space.md,
          borderRadius: 18,
          borderWidth: 1.5,
          borderColor: colors.health,
          backgroundColor: colors.elevated,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Ionicons name="leaf-outline" size={18} color={colors.health} />
        <Text variant="bodyStrong" color={colors.health}>
          Ver todos os cuidados
        </Text>
      </PressableScale>

      <PressableScale onPress={onGoApoio} accessibilityRole="button">
        <Text variant="caption" muted style={{ textAlign: 'center' }}>
          Precisa de apoio? CVV, TCC e foco estão na aba Apoio.
        </Text>
      </PressableScale>
    </View>
  )
}
