import { useEffect } from 'react'
import { Modal, Pressable } from 'react-native'
import { Text, PrimaryButton, Card } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useGamificationStore } from '../../store/gamificationStore'
import { useNeuroStore } from '../../store/neuroStore'

export function CelebrationOverlay()
{
  const { space } = useTheme()
  const celebration = useGamificationStore((s) => s.celebration)
  const dismiss = useGamificationStore((s) => s.dismissCelebration)
  const quiet = useNeuroStore((s) => s.quietCelebrations)
  const reduceMotion = useNeuroStore((s) => s.reduceMotion)

  // comemoração discreta (perfil autismo/depressão): a conquista conta, sem pop-up
  useEffect(() =>
  {
    if (quiet && celebration) dismiss()
  }, [quiet, celebration, dismiss])

  if (quiet) return null

  return (
    <Modal visible={Boolean(celebration)} transparent animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={dismiss}>
      <Pressable
        onPress={dismiss}
        style={{
          flex: 1,
          backgroundColor: 'rgba(26, 24, 22, 0.72)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: space.lg,
        }}
      >
        <Pressable onPress={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 360 }}>
          <Card tone="elevated" style={{ gap: space.md, alignItems: 'center' }}>
            <Text variant="section">{celebration?.title}</Text>
            <Text variant="body" muted style={{ textAlign: 'center' }}>
              {celebration?.body}
            </Text>
            <PrimaryButton label="Continuar" onPress={dismiss} style={{ width: '100%' }} />
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
