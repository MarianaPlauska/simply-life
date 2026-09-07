import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Text, Chip } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useFocusStore } from '../../store/focusStore'
import { usePrefsStore } from '../../store/prefsStore'
import { useActivityStore } from '../../store/activityStore'
import { ExecuteTimerFace } from '../timer/ExecuteTimerFace'

const PRESETS = [10, 15, 25, 30, 45, 60]

/** Timer da tarefa — mesmo rosto do modo foco. */
export function TaskTimerPanel()
{
  const { colors, space } = useTheme()
  const prefsMin = usePrefsStore((s) => s.prefs.pomodoro_focus) || 25
  const remainingSec = useFocusStore((s) => s.remainingSec)
  const durationSec = useFocusStore((s) => s.durationSec)
  const running = useFocusStore((s) => s.running)
  const phase = useFocusStore((s) => s.phase)
  const start = useFocusStore((s) => s.start)
  const pause = useFocusStore((s) => s.pause)
  const resume = useFocusStore((s) => s.resume)
  const tick = useFocusStore((s) => s.tick)
  const reset = useFocusStore((s) => s.reset)
  const markAction = useActivityStore((s) => s.markAction)
  const [goalMin, setGoalMin] = useState(prefsMin)

  useEffect(() =>
  {
    if (!running) return
    const t = setInterval(() => tick(), 1000)
    return () => clearInterval(t)
  }, [running, tick])

  const display =
    phase === 'idle' && remainingSec === 0 ? goalMin * 60 : remainingSec || goalMin * 60

  const onToggle = () =>
  {
    if (running)
    {
      pause()
      return
    }
    if (phase !== 'idle' && remainingSec > 0)
    {
      resume()
      return
    }
    markAction('focus')
    start(goalMin, 'focus')
  }

  return (
    <View style={{ gap: space.md, paddingVertical: space.md }}>
      <ExecuteTimerFace
        remainingSec={display}
        durationSec={durationSec || goalMin * 60}
        running={running}
        onToggle={onToggle}
      />
      <Text variant="caption" muted>
        Tempo
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {PRESETS.map((mins) => (
          <Chip
            key={mins}
            label={`${mins}m`}
            active={goalMin === mins}
            onPress={() =>
            {
              setGoalMin(mins)
              reset(mins)
            }}
          />
        ))}
      </View>
      <Text variant="caption" muted style={{ color: colors.inkMuted }}>
        Pause quando precisar. O dia conta ao iniciar o foco.
      </Text>
    </View>
  )
}
