import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  localTodayIso,
  findHabit,
  habitPct,
  AGUA_META_COPOS,
  aguaMlPorCopo,
  currentWeekIsos,
} from '@simply-life/shared'
import { Text, ProgressRing, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useGamificationStore } from '../../store/gamificationStore'
import { minutesSinceSip, useWaterLogStore } from '../../store/waterLogStore'
import { WaterBottleMark } from './WaterBottleMark'
import { WaterGoalEditor } from './WaterGoalEditor'

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function coachLine(pct: number, left: number): string
{
  if (pct >= 100) return 'Meta atingida hoje. Hidratação em dia.'
  if (pct >= 70) return `Faltam ${left} copo${left === 1 ? '' : 's'}. Você está quase na meta.`
  if (pct >= 60) return `${left} copo${left === 1 ? '' : 's'} para a meta.`
  if (pct >= 20) return 'Siga no ritmo. Um copo agora ajuda.'
  return 'Comece com um copo agora.'
}

type Props = {
  compact?: boolean
}

/** Card de hidratação na Home: copos, semana e ações rápidas. */
export function HomeWaterProgressCard({ compact }: Props)
{
  const { colors } = useTheme()
  const isGuest = useAuthStore((s) => s.isGuest)
  const habits = useDataStore((s) => s.habits) ?? []
  const addWaterCup = useDataStore((s) => s.addWaterCup)
  const removeWaterCup = useDataStore((s) => s.removeWaterCup)
  const streak = useGamificationStore((s) => s.streak)
  const lastSipAt = useWaterLogStore((s) => s.lastSipAt)
  const waterWeekDays = useDataStore((s) => s.waterWeekDays)
  const hydrateLog = useWaterLogStore((s) => s.hydrate)
  const [edit, setEdit] = useState(false)

  useEffect(() =>
  {
    hydrateLog()
  }, [hydrateLog])

  const agua = findHabit(habits, 'agua')
  const ml = aguaMlPorCopo(agua)
  const meta = agua?.metaDiaria ?? AGUA_META_COPOS
  const atual = agua?.progressoAtual ?? 0
  const pct = habitPct(agua)
  const mlAtual = atual * ml
  const mlMeta = meta * ml
  const left = Math.max(0, meta - atual)
  const mins = minutesSinceSip(lastSipAt)
  const week = useMemo(() => currentWeekIsos(), [])
  const todayIso = localTodayIso()
  const maxBar = Math.max(meta, 1)

  return (
    <View
      style={{
        borderRadius: 24,
        padding: 20,
        gap: 16,
        backgroundColor: colors.healthMuted,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
          <Text variant="caption" muted>
            Hidratação
          </Text>
          <Text variant="title" style={{ fontSize: 22, letterSpacing: -0.5, lineHeight: 26 }}>
            {atual} de {meta} copos
          </Text>
          <Text variant="caption" muted style={{ fontSize: 13, lineHeight: 18 }}>
            {mlAtual} / {mlMeta} ml · {coachLine(pct, left)}
          </Text>
        </View>
        <View style={{ width: 72, height: 72, alignItems: 'center', justifyContent: 'center' }}>
          <ProgressRing
            progress={pct}
            size={72}
            strokeWidth={6}
            color={colors.health}
            trackColor={colors.hairline}
            showLabel={false}
          />
          <View style={{ position: 'absolute', alignItems: 'center' }}>
            <WaterBottleMark size={24} fillPct={pct} fill={colors.health} stroke={colors.ink} />
          </View>
        </View>
      </View>

      {!compact ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          {(
            [
              { icon: 'flame-outline' as const, label: `${streak}d sequência` },
              { icon: 'checkmark-circle-outline' as const, label: `${atual} tomados` },
              {
                icon: 'time-outline' as const,
                label: mins == null ? 'sem registro' : mins < 60 ? `${mins} min` : `${Math.round(mins / 60)} h`,
              },
            ]
          ).map((row) => (
            <View key={row.label} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name={row.icon} size={13} color={colors.axel} />
              <Text variant="micro" muted style={{ fontSize: 11 }} numberOfLines={1}>
                {row.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {!compact ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 52 }}>
          {week.map((iso) =>
          {
            const isToday = iso === todayIso
            const isFuture = iso > todayIso
            const cups = isFuture ? 0 : (isToday ? atual : (waterWeekDays[iso] ?? 0))
            const h = isFuture ? 4 : Math.max(6, Math.round((cups / maxBar) * 44))
            return (
              <View key={iso} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <View
                  style={{
                    width: '70%',
                    height: 44,
                    borderRadius: 8,
                    backgroundColor: colors.elevated,
                    justifyContent: 'flex-end',
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      height: h,
                      borderRadius: 8,
                      backgroundColor: isToday ? colors.health : colors.healthMuted,
                      opacity: isFuture ? 0.35 : 1,
                    }}
                  />
                </View>
                <Text
                  variant="micro"
                  style={{
                    color: isToday ? colors.health : colors.inkMuted,
                    fontWeight: isToday ? '700' : '500',
                    fontSize: 9,
                  }}
                >
                  {WEEKDAYS[new Date(`${iso}T12:00:00`).getDay()]}
                </Text>
              </View>
            )
          })}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <PressableScale
          accessibilityLabel="Remover copo"
          disabled={atual <= 0}
          onPress={() => void removeWaterCup(isGuest)}
          style={{
            minHeight: 44,
            minWidth: 44,
            paddingHorizontal: 14,
            borderRadius: 999,
            backgroundColor: colors.elevated,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: atual <= 0 ? 0.4 : 1,
          }}
        >
          <Ionicons name="remove" size={20} color={colors.ink} />
        </PressableScale>
        <PressableScale
          accessibilityLabel={`Registrar copo de ${ml} ml`}
          onPress={() => void addWaterCup(isGuest)}
          style={{
            flex: 1,
            minHeight: 44,
            borderRadius: 999,
            backgroundColor: colors.health,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 6,
          }}
        >
          <Ionicons name="water" size={16} color={colors.canvas} />
          <Text variant="label" style={{ color: colors.canvas, fontWeight: '700', fontSize: 13 }}>
            + Copo ({ml} ml)
          </Text>
        </PressableScale>
        <PressableScale
          accessibilityLabel="Editar meta de água"
          onPress={() => setEdit((v) => !v)}
          style={{
            minHeight: 44,
            minWidth: 44,
            paddingHorizontal: 14,
            borderRadius: 999,
            backgroundColor: colors.elevated,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="options-outline" size={18} color={colors.ink} />
        </PressableScale>
      </View>

      {edit ? <WaterGoalEditor /> : null}
    </View>
  )
}
