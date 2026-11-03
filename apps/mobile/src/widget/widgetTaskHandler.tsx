import type { WidgetTaskHandlerProps } from 'react-native-android-widget'
import { AGUA_META_COPOS, findHabit, humorDoDia, priorityTodayTasks } from '@simply-life/shared'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { SunFyWidget, type SunFyWidgetData } from './SunFyWidget'

export const WIDGET_NAME = 'SunFyHoje'

async function resolveGuest(): Promise<boolean | null>
{
  if (useAuthStore.getState().isGuest) return true
  const { data } = await supabase.auth.getSession()
  return data.session ? false : null
}

export function readWidgetData(): SunFyWidgetData
{
  const { habits, humor, tasks } = useDataStore.getState()
  const agua = findHabit(habits ?? [], 'agua')
  const next = priorityTodayTasks(tasks, new Date(), 1)[0]?.task
  return {
    waterDone: agua?.progressoAtual ?? 0,
    waterGoal: agua?.metaDiaria ?? AGUA_META_COPOS,
    moodToday: humorDoDia(humor ?? [])?.humor ?? null,
    task: next ? { id: next.id, titulo: next.titulo } : null,
  }
}

const signedOut = (
  <SunFyWidget data={{ waterDone: 0, waterGoal: AGUA_META_COPOS, moodToday: null, task: null, signedOut: true }} />
)

/** Roda em segundo plano (app fechado): carrega os dados, aplica o toque e redesenha. */
export async function widgetTaskHandler({ widgetAction, clickAction, clickActionData, renderWidget }: WidgetTaskHandlerProps)
{
  if (widgetAction === 'WIDGET_DELETED') return

  try
  {
    const isGuest = await resolveGuest()
    if (isGuest === null)
    {
      renderWidget(signedOut)
      return
    }

    const store = useDataStore.getState()
    if (store.source === 'idle') await store.refreshAll({ isGuest })

    if (widgetAction === 'WIDGET_CLICK')
    {
      const s = useDataStore.getState()
      if (clickAction === 'WATER') await s.addWaterCup(isGuest)
      if (clickAction === 'MOOD' && typeof clickActionData?.value === 'number') await s.addHumor(clickActionData.value, undefined, isGuest)
      if (clickAction === 'TASK_DONE' && typeof clickActionData?.id === 'string')
      {
        const task = s.tasks.find((t) => t.id === clickActionData.id)
        if (task && task.status !== 'done') await s.toggleTaskDone(task.id, isGuest)
      }
    }

    renderWidget(<SunFyWidget data={readWidgetData()} />)
  }
  catch
  {
    // Sem este desenho o Android deixa o retângulo vazio e só aparece o wallpaper.
    renderWidget(signedOut)
  }
}
