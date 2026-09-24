import { useEffect } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { DAY_PLAN_MODE_COPY, addDaysIso, firstTinyStep, localTodayIso } from '@simply-life/shared'
import { Card, Text, PrimaryButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { usePlanLogStore } from '../../store/planLogStore'

const EVENING_HOUR = 18

/**
 * Home: à noite convida para planejar amanhã; de dia mostra o plano de hoje
 * (essenciais + o primeiro passo do próximo). Some quando não tem nada a dizer.
 */
export function DayPlanHomeCard()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const isGuest = useAuthStore((s) => s.isGuest)
  const tasks = useDataStore((s) => s.tasks) ?? []
  const toggleTaskDone = useDataStore((s) => s.toggleTaskDone)
  const hydrate = usePlanLogStore((s) => s.hydrate)
  const plans = usePlanLogStore((s) => s.plans)
  const dismissed = usePlanLogStore((s) => s.eveningDismissed)
  const dismissEvening = usePlanLogStore((s) => s.dismissEvening)

  useEffect(() =>
  {
    void hydrate()
  }, [hydrate])

  const now = new Date()
  const today = localTodayIso(now)
  const tomorrow = addDaysIso(today, 1)
  const evening = now.getHours() >= EVENING_HOUR
  const planToday = plans.find((p) => p.date === today) ?? null
  const planTomorrow = plans.find((p) => p.date === tomorrow) ?? null

  if (evening)
  {
    if (planTomorrow)
    {
      return (
        <Pressable onPress={() => router.push('/planejar-amanha')} accessibilityRole="button">
          <Card tone="elevated" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="moon-outline" size={18} color={colors.axel} />
            <Text variant="body" style={{ flex: 1, fontSize: 14 }}>
              Amanhã já está planejado ({DAY_PLAN_MODE_COPY[planTomorrow.mode].label.toLowerCase()}). Bom descanso.
            </Text>
          </Card>
        </Pressable>
      )
    }
    if (dismissed === today) return null
    return (
      <Card tone="elevated" accentTop="axel" style={{ gap: space.sm }}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Ionicons name="moon-outline" size={20} color={colors.axel} />
          <Text variant="section" style={{ flex: 1 }}>Planejar amanhã</Text>
        </View>
        <Text variant="body" muted>
          Uns 3 minutos. Você conta como está e o que tem; o Axel deixa o amanhã do tamanho certo, com pausas.
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <PrimaryButton label="Agora não" variant="ghost" size="sm" onPress={() => dismissEvening(today)} style={{ flex: 1 }} />
          <PrimaryButton label="Planejar" size="sm" onPress={() => router.push('/planejar-amanha')} style={{ flex: 2 }} />
        </View>
      </Card>
    )
  }

  if (!planToday || planToday.essentialIds.length === 0) return null
  const byId = new Map(tasks.map((t) => [t.id, t]))
  const essentials = planToday.essentialIds.map((id) => byId.get(id)).filter(Boolean) as typeof tasks
  if (!essentials.length) return null
  const next = essentials.find((t) => t.status !== 'done')
  const doneCount = essentials.filter((t) => t.status === 'done').length

  return (
    <Card tone="elevated" accentTop="axel" style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text variant="section" style={{ flex: 1 }}>Seu plano de hoje</Text>
        <Text variant="caption" muted>{DAY_PLAN_MODE_COPY[planToday.mode].label}</Text>
      </View>
      {essentials.map((t) => (
        <Pressable
          key={t.id}
          onPress={() => void toggleTaskDone(t.id, isGuest)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: t.status === 'done' }}
          style={{ flexDirection: 'row', gap: 10, alignItems: 'center', minHeight: 40 }}
        >
          <Ionicons
            name={t.status === 'done' ? 'checkmark-circle' : 'ellipse-outline'}
            size={22}
            color={t.status === 'done' ? colors.axel : colors.inkMuted}
          />
          <Text
            variant="body"
            style={{ flex: 1, fontSize: 15, textDecorationLine: t.status === 'done' ? 'line-through' : 'none' }}
            muted={t.status === 'done'}
          >
            {t.titulo}
          </Text>
        </Pressable>
      ))}
      <Text variant="caption" muted>
        {next
          ? `Próximo passo: ${firstTinyStep(next.titulo, next.checklist).toLowerCase()}.`
          : doneCount === essentials.length
            ? 'Essenciais de hoje feitos. O resto é bônus, e descansar também conta.'
            : ''}
      </Text>
      <Pressable onPress={() => router.push('/ritmo')} accessibilityRole="button" hitSlop={6}>
        <Text variant="caption" color={colors.axel} style={{ fontWeight: '600' }}>Ver meu ritmo</Text>
      </Pressable>
    </Card>
  )
}
