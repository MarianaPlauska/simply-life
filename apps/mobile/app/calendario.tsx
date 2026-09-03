import { Redirect } from 'expo-router'
import { Screen } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { PlansCalendar } from '../src/components/calendar/PlansCalendar'
import { useAuthStore } from '../src/store/authStore'
import { useDataStore } from '../src/store/dataStore'

export default function CalendarioScreen()
{
  const userId = useAuthStore((s) => s.userId)
  const tasks = useDataStore((s) => s.tasks) ?? []

  if (!userId) return <Redirect href="/login" />

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title="Calendário" subtitle="Planos e progresso do mês" />
      <PlansCalendar tasks={tasks} />
    </Screen>
  )
}
