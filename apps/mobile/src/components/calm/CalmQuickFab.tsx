import { useState, useEffect } from 'react'
import { Modal, Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CALM_EXERCISES } from '@simply-life/shared'
import { TAB_BAR_CONTENT_HEIGHT } from '@simply-life/ui-tokens'
import { Card, Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useCaptureStore } from '../../store/captureStore'
import { useTaskEvolveStore } from '../../store/taskEvolveStore'
import { useCalmFabSuppressStore } from '../../store/calmFabSuppressStore'
import { hapticLight } from '../../lib/haptics'

/** FAB global de acalmar: canto direito, acima da tab bar, sem competir com Captura. */
export function CalmQuickFab()
{
  const { colors, space, elevation } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const captureOpen = useCaptureStore((s) => s.open)
  const evolveOpen = useTaskEvolveStore((s) => Boolean(s.taskId))
  const fabSuppressed = useCalmFabSuppressStore((s) => s.count > 0)
  const [sheet, setSheet] = useState(false)

  useEffect(() =>
  {
    if (captureOpen || evolveOpen) setSheet(false)
  }, [captureOpen, evolveOpen])

  if (captureOpen || evolveOpen || fabSuppressed) return null

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
          borderColor: colors.health,
          zIndex: 20,
          ...elevation.fab,
        }}
      >
        <Ionicons name="leaf-outline" size={20} color={colors.health} />
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
                gap: space.sm,
                borderRadius: 20,
                padding: space.md,
              }}
            >
              <Text variant="section">Acalmar agora</Text>
              <Text variant="caption" muted>
                Escolha um guia curto. Não substitui o CVV 188.
              </Text>
              {CALM_EXERCISES.map((ex) => (
                <PressableScale
                  key={ex.id}
                  onPress={() =>
                  {
                    setSheet(false)
                    router.push(ex.route as '/calm/box-breathing' | '/calm/grounding')
                  }}
                  style={{
                    minHeight: 52,
                    padding: space.md,
                    borderRadius: 18,
                    backgroundColor: colors.axelMuted,
                    gap: 4,
                  }}
                >
                  <Text variant="bodyStrong">{ex.title}</Text>
                  <Text variant="caption" muted>
                    {ex.subtitle}
                  </Text>
                  <Text variant="caption" color={colors.axel}>
                    Cerca de {ex.durationMin} min
                  </Text>
                </PressableScale>
              ))}
              <PressableScale
                onPress={() => setSheet(false)}
                style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text variant="caption" muted>Fechar</Text>
              </PressableScale>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}
