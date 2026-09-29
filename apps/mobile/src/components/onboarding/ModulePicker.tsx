import { View } from 'react-native'
import { Text, PrimaryButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import {
  APP_MODULE_GROUPS,
  modulesOfGroup,
  type AppModuleGroup,
  type AppModuleId,
} from '../../lib/appModules'
import { OnbChoice } from './OnbChoice'

type Props = {
  value: AppModuleId[]
  onToggle: (id: AppModuleId) => void
  /** Liga ou desliga o grupo inteiro de uma vez */
  onGroup?: (group: AppModuleGroup, on: boolean) => void
}

/** Escolha do que usar, por grupo (Tarefas, Saúde, Carteira). */
export function ModulePicker({ value, onToggle, onGroup }: Props)
{
  const { space } = useTheme()

  return (
    <View style={{ gap: space.lg }}>
      {APP_MODULE_GROUPS.map((g) =>
      {
        const items = modulesOfGroup(g.id)
        const allOn = items.every((m) => value.includes(m.id))
        return (
          <View key={g.id} style={{ gap: space.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="section">{g.label}</Text>
                <Text variant="caption" muted>
                  {g.hint}
                </Text>
              </View>
              {onGroup ? (
                <PrimaryButton
                  label={allOn ? 'Tirar tudo' : 'Usar tudo'}
                  variant="link"
                  size="sm"
                  onPress={() => onGroup(g.id, !allOn)}
                />
              ) : null}
            </View>
            <View style={{ gap: space.sm }}>
              {items.map((m) => (
                <OnbChoice
                  key={m.id}
                  title={m.label}
                  hint={m.hint}
                  icon={m.icon}
                  selected={value.includes(m.id)}
                  onPress={() => onToggle(m.id)}
                />
              ))}
            </View>
          </View>
        )
      })}
    </View>
  )
}
