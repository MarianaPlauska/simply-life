import { create } from 'zustand'
import { Pressable, View } from 'react-native'
import { Modal } from '../../ui/Modal'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TAB_BAR_CONTENT_HEIGHT } from '@simply-life/ui-tokens'
import { Card, Text, CloseButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { CalmExerciseList } from './CalmExerciseList'

/** Abre o "Acalmar agora" de qualquer lugar (o atalho fica no + da captura, sem botão flutuante). */
export const useCalmSheetStore = create<{ open: boolean; setOpen: (open: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}))

/** Ficha "Acalmar agora": guias curtos de respiração e chão. */
export function CalmQuickFab()
{
  const { colors, space } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const sheet = useCalmSheetStore((s) => s.open)
  const setSheet = useCalmSheetStore((s) => s.setOpen)
  const bottom = TAB_BAR_CONTENT_HEIGHT + Math.max(insets.bottom, 8) + 8

  return (
    <>
      <Modal visible={sheet} transparent animationType="fade" onRequestClose={() => setSheet(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}
          onPress={() => setSheet(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Card
              tone="elevated"
              style={{
                marginHorizontal: 12,
                marginBottom: bottom,
                gap: space.md,
                borderRadius: 20,
                padding: space.md,
              }}
            >
              {/* título com fechar no canto: fechar vira um botão de verdade, não um texto solto */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="section">Acalmar agora</Text>
                  <Text variant="caption" muted>
                    Escolha um guia curto. Não substitui o CVV 188.
                  </Text>
                </View>
                <CloseButton onPress={() => setSheet(false)} />
              </View>
              <CalmExerciseList
                onPick={(route) =>
                {
                  setSheet(false)
                  router.push(route as '/calm/box-breathing' | '/calm/grounding' | '/sobrecarga')
                }}
              />
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}
