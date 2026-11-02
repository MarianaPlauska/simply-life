import { useState } from 'react'
import { Modal, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Icon, PressableScale, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { HomeSearchBar } from './HomeSearchBar'

/** Lupa no topo da Home: a busca abre em tela cheia em vez de ocupar espaço fixo. */
export function HomeSearchButton()
{
  const { colors, space } = useTheme()
  const insets = useSafeAreaInsets()
  const tasks = useDataStore((s) => s.tasks) ?? []
  const finance = useDataStore((s) => s.finance) ?? []
  const [open, setOpen] = useState(false)

  return (
    <View>
      <PressableScale
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Buscar tarefas e gastos"
        style={{
          width: 44,
          height: 44,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.elevated,
        }}
      >
        <Icon name="search" size={20} color={colors.ink} />
      </PressableScale>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top + space.sm, paddingHorizontal: space.lg, gap: space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
            <Text variant="section">Buscar</Text>
            <Pressable onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel="Fechar busca" hitSlop={8}>
              <Text variant="bodyStrong" color={colors.axel}>Fechar</Text>
            </Pressable>
          </View>
          <HomeSearchBar tasks={tasks} finance={finance} autoFocus />
        </View>
      </Modal>
    </View>
  )
}
