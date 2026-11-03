import { FlexWidget, TextWidget, type ColorProp } from 'react-native-android-widget'

// Petróleo do logo. O degradê de uma cor só vira um fundo opaco no Android 12+,
// onde backgroundColor sozinho sai transparente e aparece o wallpaper.
const BG = '#1F3A3D'
const INK = '#EEF2F0'
const MUTED = '#A9C2BC'
const FILL = '#2C4C50'
const CORAL = '#E8734A'
const ON_CORAL = '#1E1C1A'

function solid(color: ColorProp)
{
  return {
    backgroundGradient: {
      from: color,
      to: color,
      orientation: 'LEFT_RIGHT' as const,
    },
  }
}

const FACES = ['😫', '😕', '😐', '🙂', '😄']

export type SunFyWidgetData = {
  waterDone: number
  waterGoal: number
  moodToday: number | null
  task: { id: string; titulo: string } | null
  signedOut?: boolean
}

export function SunFyWidget({ data }: { data: SunFyWidgetData })
{
  if (data.signedOut)
  {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        style={{ height: 'match_parent', width: 'match_parent', ...solid(BG), borderRadius: 22, padding: 16, justifyContent: 'center', alignItems: 'center' }}
      >
        <TextWidget text="Entre no SunFy para usar o widget" style={{ fontSize: 14, color: INK }} />
      </FlexWidget>
    )
  }

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        ...solid(BG),
        borderRadius: 22,
        padding: 14,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <FlexWidget clickAction="OPEN_APP" style={{ flexDirection: 'column' }}>
          <TextWidget text="Água hoje" style={{ fontSize: 12, color: MUTED }} />
          <TextWidget text={`${data.waterDone}/${data.waterGoal} copos`} style={{ fontSize: 19, color: INK, fontWeight: '700' }} />
        </FlexWidget>
        <FlexWidget
          clickAction="WATER"
          style={{ ...solid(CORAL), borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 }}
        >
          <TextWidget text="+1 copo" style={{ fontSize: 14, color: ON_CORAL, fontWeight: '700' }} />
        </FlexWidget>
      </FlexWidget>

      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextWidget text={data.moodToday ? 'Humor de hoje' : 'Como você está?'} style={{ fontSize: 12, color: MUTED }} />
        <FlexWidget style={{ flexDirection: 'row' }}>
          {FACES.map((face, i) => (
            <FlexWidget
              key={face}
              clickAction="MOOD"
              clickActionData={{ value: i + 1 }}
              style={{
                width: 34,
                height: 34,
                marginLeft: i === 0 ? 0 : 4,
                borderRadius: 17,
                justifyContent: 'center',
                alignItems: 'center',
                ...solid(data.moodToday === i + 1 ? CORAL : FILL),
              }}
            >
              <TextWidget text={face} style={{ fontSize: 17 }} />
            </FlexWidget>
          ))}
        </FlexWidget>
      </FlexWidget>

      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          alignItems: 'center',
          ...solid(FILL),
          borderRadius: 14,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <FlexWidget
          clickAction="OPEN_URI"
          clickActionData={{ uri: data.task ? `simplylife://task/${data.task.id}` : 'simplylife://kanban' }}
          style={{ flex: 1, flexDirection: 'column' }}
        >
          <TextWidget text="Próxima tarefa" style={{ fontSize: 12, color: MUTED }} />
          <TextWidget
            text={data.task?.titulo ?? 'Nada para hoje'}
            maxLines={1}
            truncate="END"
            style={{ fontSize: 14, color: INK, fontWeight: '600' }}
          />
        </FlexWidget>
        {data.task ? (
          <FlexWidget
            clickAction="TASK_DONE"
            clickActionData={{ id: data.task.id }}
            style={{ ...solid(FILL), borderRadius: 16, borderWidth: 1, borderColor: MUTED, paddingHorizontal: 12, paddingVertical: 6 }}
          >
            <TextWidget text="Concluir" style={{ fontSize: 13, color: INK, fontWeight: '600' }} />
          </FlexWidget>
        ) : null}
      </FlexWidget>
    </FlexWidget>
  )
}
