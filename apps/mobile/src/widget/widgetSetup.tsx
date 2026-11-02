import { requestWidgetUpdate } from 'react-native-android-widget'
import { useDataStore } from '../store/dataStore'
import { SunFyWidget } from './SunFyWidget'
import { WIDGET_NAME, readWidgetData } from './widgetTaskHandler'

export { widgetTaskHandler } from './widgetTaskHandler'

// app aberto: copo, humor ou tarefa mudou no app -> o widget acompanha
let timer: ReturnType<typeof setTimeout> | null = null
useDataStore.subscribe((s, prev) =>
{
  if (s.habits === prev.habits && s.humor === prev.humor && s.tasks === prev.tasks) return
  if (timer) clearTimeout(timer)
  timer = setTimeout(() =>
  {
    void requestWidgetUpdate({
      widgetName: WIDGET_NAME,
      renderWidget: () => <SunFyWidget data={readWidgetData()} />,
    }).catch(() => undefined)
  }, 800)
})
