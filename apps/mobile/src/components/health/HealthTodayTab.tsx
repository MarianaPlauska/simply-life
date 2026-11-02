import { useCallback, useMemo } from 'react'
import { View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Icon } from '../../ui/Icon'
import {
  findHabit,
  habitPct,
  medsTakenCount,
  formatSleepHours,
  moodLabel,
  isSoftMoodDay,
} from '@simply-life/shared'
import { Text, Card, GroupedList, GroupedRow, RowGlyph } from '../../ui'
import { AxelSun } from '../AxelSun'
import { MoodFaceRow } from '../MoodFace'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useAuthStore } from '../../store/authStore'
import type { CuidadosTab } from './healthNav'
import { HealthSoftModeView } from './HealthSoftModeView'
import { useCalmFabSuppressStore } from '../../store/calmFabSuppressStore'
import { useModules } from '../../hooks/useModules'
import { CARE_MODULE, CUIDADOS_SUB_TABS } from './healthNav'
import { useWebDesk } from '../dashboard/web/webBox'
import { HealthTodayDesk } from './web/HealthTodayDesk'

type Props = {
  onGoCuidados: (tab: CuidadosTab) => void
  onGoApoio: () => void
  onGoDiario: () => void
}

const TILES: {
  id: CuidadosTab
  label: string
  icon: keyof typeof Icon.glyphMap
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
  const modules = useModules()
  const anyCare = modules.any('water', 'food', 'sleep', 'gym', 'meds')
  const { colors, space } = useTheme()
  const habits = useDataStore((s) => s.habits)
  const medicamentos = useDataStore((s) => s.medicamentos)
  const humor = useDataStore((s) => s.humor)
  const lastAxelCare = useDataStore((s) => s.lastAxelCare)
  const addHumor = useDataStore((s) => s.addHumor)
  const isGuest = useAuthStore((s) => s.isGuest)
  const desk = useWebDesk()

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

  // Abas do Tabs continuam montadas ao trocar de aba: só suprime o FAB enquanto em foco
  useFocusEffect(
    useCallback(() =>
    {
      const { acquire, release } = useCalmFabSuppressStore.getState()
      acquire()
      return () => release()
    }, []),
  )

  const pendingTiles = useMemo(() =>
  {
    return TILES.filter((tile) =>
    {
      // só cuidados que a pessoa usa
      if (!modules.on(CARE_MODULE[tile.id])) return false
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
  }, [agua, proteina, sono, treino, medicamentos.length, medsDone, modules])

  if (isSoftMoodDay(humor))
  {
    return <HealthSoftModeView onGoApoio={onGoApoio} onGoDiario={onGoDiario} />
  }

  // computador: grade de painéis em vez da pilha do celular
  if (desk)
  {
    return <HealthTodayDesk onGoCuidados={onGoCuidados} onGoApoio={onGoApoio} onGoDiario={onGoDiario} />
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
  const firstCare = CUIDADOS_SUB_TABS.find((t) => modules.on(CARE_MODULE[t.id]))?.id ?? 'hidratacao'

  const tileColor: Record<CuidadosTab, string> = {
    hidratacao: colors.health,
    alimentacao: colors.finance,
    sono: colors.tasks,
    academia: colors.axelFill,
    medicamentos: colors.attention,
  }

  // celular: check-in num cartão e o resto como listas do sistema (resumo estilo Fitbit/Health)
  return (
    <View style={{ gap: space.lg }}>
      {modules.on('mood') ? (
        <Card tone="elevated" style={{ gap: space.md, padding: 16 }}>
          <View style={{ gap: 2 }}>
            <Text variant="caption" muted>
              {humorHoje ? 'Humor de hoje' : 'Check-in rápido'}
            </Text>
            <Text variant="section" style={{ fontSize: 20, lineHeight: 26 }}>
              {moodHeadline}
            </Text>
          </View>
          <MoodFaceRow
            value={humorHoje?.humor}
            onChange={(m) => void addHumor(m, undefined, isGuest)}
          />
        </Card>
      ) : null}

      <View style={{ gap: 8 }}>
        <Text variant="caption" muted style={{ marginLeft: 4 }}>
          {pendingTiles.length > 0 ? 'Se quiser registrar' : 'Hoje'}
        </Text>
        <GroupedList>
          {pendingTiles.length > 0
            ? pendingTiles.slice(0, 2).map((tile) =>
            {
              const { pillLabel } = tileDetail(tile)
              return (
                <GroupedRow
                  key={tile.id}
                  leading={<RowGlyph name={tile.icon} color={tileColor[tile.id]} />}
                  title={tile.label}
                  value={pillLabel}
                  onPress={() => onGoCuidados(tile.id)}
                />
              )
            })
            : (
              <GroupedRow
                leading={<RowGlyph name="checkmark-circle" color={colors.health} />}
                title="Você já registrou o essencial hoje"
                subtitle="Pode descansar ou revisar no diário quando quiser"
              />
            )}
          {anyCare ? (
            <GroupedRow
              leading={<RowGlyph name="leaf" color={colors.health} />}
              title="Ver todos os cuidados"
              onPress={() => onGoCuidados(firstCare)}
            />
          ) : null}
        </GroupedList>
      </View>

      <View style={{ gap: 8 }}>
        <Text variant="caption" muted style={{ marginLeft: 4 }}>Mais</Text>
        <GroupedList>
          <GroupedRow
            leading={<RowGlyph color="transparent"><AxelSun size={30} mood="calm" /></RowGlyph>}
            title="Axel"
            subtitle={lastAxelCare || 'Sem pressa. Um passo de cada vez já conta.'}
            subtitleLines={3}
          />
          {modules.on('mood') ? (
            <GroupedRow
              leading={<RowGlyph name="book" color={colors.finance} />}
              title="Abrir diário completo"
              onPress={onGoDiario}
            />
          ) : null}
          {modules.on('support') ? (
            <GroupedRow
              leading={<RowGlyph name="heart" color={colors.dismiss} />}
              title="Precisa de apoio?"
              subtitle="CVV, TCC e foco"
              onPress={onGoApoio}
            />
          ) : (
            <GroupedRow
              leading={<RowGlyph name="call" color={colors.dismiss} />}
              title="Em sofrimento intenso, ligue 188"
              subtitle="CVV, de graça, 24 horas"
            />
          )}
        </GroupedList>
      </View>
    </View>
  )
}
