import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from '../theme/ThemeProvider'
import { useWorkspace } from '../layout/useWorkspace'

/** Degradê de clima: névoa petróleo discreta no topo, sem coral (o coral é só para ações). */
export function AtmosphereWash()
{
  const { mode, colors } = useTheme()
  const { showRail } = useWorkspace()

  if (mode !== 'dark')
  {
    return (
      <>
        <LinearGradient
          pointerEvents="none"
          colors={[colors.brandMuted, colors.canvas, colors.surface]}
          locations={[0, 0.38, 1]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(31, 58, 61, 0.08)', 'rgba(31, 58, 61, 0.02)', 'transparent']}
          locations={[0, 0.3, 1]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.2, y: 0.75 }}
          style={styles.accent}
        />
      </>
    )
  }

  return (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={[colors.canvas, colors.surface, colors.surface]}
        locations={showRail ? [0, 0.5, 1] : [0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(31, 58, 61, 0.55)', 'rgba(31, 58, 61, 0.12)', 'transparent']}
        locations={[0, 0.35, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.1, y: 0.65 }}
        style={styles.accent}
      />
    </>
  )
}

const styles = StyleSheet.create({
  accent: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    height: '70%',
  },
})
