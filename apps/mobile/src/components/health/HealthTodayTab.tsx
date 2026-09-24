import { useEffect, useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  findHabit,
  habitPct,
  medsTakenCount,
  formatSleepHours,
  moodLabel,
  isSoftMoodDay,
} from '@simply-life/shared'
import { Text, PressableScale, IconBadge, StatusPill } from '../../ui'
import { MoodFaceRow } from '../MoodFace'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useAuthStore } from '../../store/authStore'
import type { CuidadosTab } from './healthNav'
import { HealthSoftModeView } from './HealthSoftModeView'
import { HealthScreenSection } from './HealthScreenSection'
import { HealthAxelStrip } from './HealthAxelStrip'
import { useCalmFabSuppressStore } from '../../store/calmFabSuppressStore'

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

/** Aba Hoje: entrada calma, layout integrado na tela (sem painéis com borda). */
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

  useEffect(() =>
  {
    const { acquire, release } = useCalmFabSuppressStore.getState()
    acquire()
    return () => release()
  }, [])

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

  const moodHeadline = humorHoje ? moodLabel(humorHoje.humor) : 'Como você está?'

  return (
    <View style={{ gap: space.md }}>
      <HealthAxelStrip
        message={lastAxelCare || 'Sem pressa. Um passo de cada vez já conta.'}
      />

      <HealthScreenSection dividerTop>
        <View style={{ gap: 2 }}>
          <Text variant="caption" muted>
            {humorHoje ? 'Humor de hoje' : 'Check-in rápido'}
          </Text>
          <Text variant="hero" style={{ fontSize: 28, letterSpacing: -0.8 }}>
            {moodHeadline}
          </Text>
          {!humorHoje ? (
            <Text variant="caption" muted>
              Toque se quiser registrar
            </Text>
          ) : null}
        </View>
        <MoodFaceRow
          value={humorHoje?.humor}
          onChange={(m) => void addHumor(m, undefined, isGuest)}
        />
        <PressableScale onPress={onGoDiario} accessibilityRole="button">
          <Text variant="caption" color={colors.axel} style={{ fontWeight: '600' }}>
            Abrir diário completo
          </Text>
        </PressableScale>
      </HealthScreenSection>

      {pendingTiles.length > 0 ? (
        <HealthScreenSection
          dividerTop
          title="Se quiser registrar"
          subtitle="Só o que fizer sentido agora"
        >
          {pendingTiles.slice(0, 2).map((tile, index, arr) =>
          {
            const { pillLabel, done } = tileDetail(tile)
            const last = index === arr.length - 1
            return (
              <PressableScale key={tile.id} onPress={() => onGoCuidados(tile.id)}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: space.md,
                    paddingVertical: 12,
                    borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
                    borderBottomColor: colors.hairline,
                  }}
                >
                  <IconBadge
                    name={tile.icon}
                    color={colors.health}
                    size={40}
                    iconSize={20}
                  />
                  <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
                    <Text variant="bodyStrong">{tile.label}</Text>
                    <StatusPill
                      label={pillLabel}
                      color={done ? colors.health : colors.axel}
                    />
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
                </View>
              </PressableScale>
            )
          })}
        </HealthScreenSection>
      ) : (
        <HealthScreenSection dividerTop>
          <Text variant="bodyStrong">Você já registrou o essencial hoje</Text>
          <Text variant="caption" muted>
            Pode descansar ou revisar no diário quando quiser.
          </Text>
        </HealthScreenSection>
      )}

      <HealthScreenSection dividerTop>
        <PressableScale
          onPress={() => onGoCuidados('hidratacao')}
          accessibilityRole="button"
          style={{
            minHeight: 48,
            paddingHorizontal: space.md,
            borderRadius: 999,
            borderWidth: 1.5,
            borderColor: colors.health,
            backgroundColor: 'transparent',
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
      </HealthScreenSection>
    </View>
  )
}
