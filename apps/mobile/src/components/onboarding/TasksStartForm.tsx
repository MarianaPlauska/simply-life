import { useState } from 'react'
import { View } from 'react-native'
import { Chip, Field, PrimaryButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { isModuleOn, type AppModuleId } from '../../lib/appModules'
import { OnbBlock } from './OnbStep'
import { ROUTINE_PRESETS, type TasksDraft } from './startDrafts'

type Props = {
  value: TasksDraft
  onChange: (next: TasksDraft) => void
  enabled: AppModuleId[] | undefined
}

/** Três coisas da semana (viram tarefas) e hábitos da rotina. */
export function TasksStartForm({ value, onChange, enabled }: Props)
{
  const { space } = useTheme()
  const [custom, setCustom] = useState('')
  const toggleHabit = (h: string) =>
    onChange({
      ...value,
      habits: value.habits.includes(h) ? value.habits.filter((x) => x !== h) : [...value.habits, h],
    })
  const extras = value.habits.filter((h) => !ROUTINE_PRESETS.includes(h))

  return (
    <View style={{ gap: space.md }}>
      {isModuleOn(enabled, 'tasks') ? (
        <OnbBlock title="Três coisas desta semana" hint="Viram tarefas na sua Lista. Pode deixar em branco.">
          {value.week.map((t, i) => (
            <Field
              key={i}
              label={`${i + 1}ª`}
              value={t}
              placeholder={['Marcar dentista', 'Pagar o IPVA', 'Terminar o relatório'][i]}
              onChangeText={(v) => onChange({ ...value, week: value.week.map((x, j) => (j === i ? v : x)) })}
            />
          ))}
        </OnbBlock>
      ) : null}

      {isModuleOn(enabled, 'routine') ? (
        <OnbBlock title="Hábitos da rotina" hint="Toque nos que você quer acompanhar todo dia.">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {[...ROUTINE_PRESETS, ...extras].map((h) => (
              <Chip key={h} label={h} active={value.habits.includes(h)} onPress={() => toggleHabit(h)} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <Field label="Outro hábito" value={custom} onChangeText={setCustom} placeholder="Tomar sol" />
            </View>
            <PrimaryButton
              label="Incluir"
              variant="secondary"
              size="sm"
              disabled={!custom.trim()}
              onPress={() =>
              {
                const h = custom.trim()
                if (h && !value.habits.includes(h)) onChange({ ...value, habits: [...value.habits, h] })
                setCustom('')
              }}
            />
          </View>
        </OnbBlock>
      ) : null}
    </View>
  )
}
