import { Platform, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from '../theme/ThemeProvider'
import { useWorkspace } from '../layout/useWorkspace'

/** Degradê de clima: névoa petróleo discreta no topo, sem coral (o coral é só para ações). */
export function AtmosphereWash()
{
  const { mode, colors } = useTheme()
  const { showRail } = useWorkspace()

  // computador: fundo liso; a névoa no monitor vira uma mancha que cansa a vista
  if (Platform.OS === 'web' && showRail) return null

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
          end={{ x: 0.2, y: 0.52 }}
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
        end={{ x: 0.1, y: 0.45 }}
        style={styles.accent}
      />
    </>
  )
}

const styles = StyleSheet.create({
  // tela toda, com o degradê sumindo em ~45%: antes a caixa parava em 70% e,
  // na tela larga, deixava uma borda reta no meio da página
  accent: StyleSheet.absoluteFillObject,
})
