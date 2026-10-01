import { useState, useEffect } from 'react'
import { Modal, Pressable, View } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { Icon } from '../../ui/Icon'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TAB_BAR_CONTENT_HEIGHT, chartColor } from '@simply-life/ui-tokens'
import { Card, Text, PressableScale, CloseButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useCaptureStore } from '../../store/captureStore'
import { useTaskEvolveStore } from '../../store/taskEvolveStore'
import { useCalmFabSuppressStore } from '../../store/calmFabSuppressStore'
import { hapticLight } from '../../lib/haptics'
import { CalmExerciseList } from './CalmExerciseList'

/** FAB global de acalmar: canto direito, acima da tab bar, sem competir com Captura. */
export function CalmQuickFab()
{
  const { colors, space, elevation, chart } = useTheme()
  const calmTint = chartColor(chart, 'teal')
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const pathname = usePathname()
  const captureOpen = useCaptureStore((s) => s.open)
  const evolveOpen = useTaskEvolveStore((s) => Boolean(s.taskId))
  const fabSuppressed = useCalmFabSuppressStore((s) => s.count > 0)
  const [sheet, setSheet] = useState(false)

  useEffect(() =>
  {
    if (captureOpen || evolveOpen) setSheet(false)
  }, [captureOpen, evolveOpen])

  // na Saúde o Apoio já tem os mesmos guias: o atalho some em todas as abas dela
  const onHealth = pathname.includes('saude')
  if (captureOpen || evolveOpen || fabSuppressed || onHealth) return null

  const bottom = TAB_BAR_CONTENT_HEIGHT + Math.max(insets.bottom, 8) + 8

  return (
    <>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Acalmar agora"
        onPress={() =>
        {
          hapticLight()
          setSheet(true)
        }}
        style={{
          position: 'absolute',
          right: 16,
          bottom,
          width: 44,
          height: 44,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.elevated,
          borderWidth: 1.5,
          borderColor: calmTint,
          zIndex: 20,
          ...elevation.fab,
        }}
      >
        <Icon name="leaf-outline" size={20} color={calmTint} weight="duotone" />
      </PressableScale>

      <Modal visible={sheet} transparent animationType="fade" onRequestClose={() => setSheet(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
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
                  router.push(route as '/calm/box-breathing' | '/calm/grounding')
                }}
              />
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}
