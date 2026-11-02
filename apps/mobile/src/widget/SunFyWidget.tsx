import { FlexWidget, TextWidget } from 'react-native-android-widget'

// cores fixas da marca: o widget fica na tela inicial, fora do tema do app
const BG = '#1F3A3D'
const INK = '#EEF2F0'
const MUTED = '#B9CFCA'
const FILL = '#29494C'
const CORAL = '#E8734A'
const ON_CORAL = '#1E1C1A'

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
        style={{ height: 'match_parent', width: 'match_parent', backgroundColor: BG, borderRadius: 24, padding: 16, justifyContent: 'center', alignItems: 'center' }}
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
        backgroundColor: BG,
        borderRadius: 24,
        padding: 14,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <FlexWidget clickAction="OPEN_APP" style={{ flexDirection: 'column' }}>
          <TextWidget text="Água hoje" style={{ fontSize: 12, color: MUTED }} />
          <TextWidget text={`${data.waterDone}/${data.waterGoal} copos`} style={{ fontSize: 18, color: INK, fontWeight: '700' }} />
        </FlexWidget>
        <FlexWidget
          clickAction="WATER"
          style={{ backgroundColor: CORAL, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 }}
        >
          <TextWidget text="+1 copo" style={{ fontSize: 14, color: ON_CORAL, fontWeight: '700' }} />
        </FlexWidget>
      </FlexWidget>

      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextWidget text={data.moodToday ? 'Humor de hoje' : 'Como você está?'} style={{ fontSize: 12, color: MUTED }} />
        <FlexWidget style={{ flexDirection: 'row', flexGap: 4 }}>
          {FACES.map((face, i) => (
            <FlexWidget
              key={face}
              clickAction="MOOD"
              clickActionData={{ value: i + 1 }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: data.moodToday === i + 1 ? CORAL : FILL,
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
          backgroundColor: FILL,
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
          <TextWidget text="Próxima tarefa" style={{ fontSize: 11, color: MUTED }} />
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
            style={{ borderRadius: 999, borderWidth: 1, borderColor: MUTED, paddingHorizontal: 12, paddingVertical: 6 }}
          >
            <TextWidget text="Concluir" style={{ fontSize: 13, color: INK, fontWeight: '600' }} />
          </FlexWidget>
        ) : null}
      </FlexWidget>
    </FlexWidget>
  )
}
