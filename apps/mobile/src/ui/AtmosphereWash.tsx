import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from '../theme/ThemeProvider'

/** Degradê de clima. Escuro: lavagem curta no preto. Claro: tan na tela. */
export function AtmosphereWash()
{
  const { mode } = useTheme()

  if (mode !== 'dark')
  {
    return (
      <>
        <LinearGradient
          pointerEvents="none"
          colors={['#F4D5BC', '#F6EEE3', '#E8D9C4']}
          locations={[0, 0.38, 1]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(232, 115, 74, 0.16)', 'rgba(232, 115, 74, 0.05)', 'transparent']}
          locations={[0, 0.3, 1]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.2, y: 0.75 }}
          style={styles.accent}
        />
      </>
    )
  }

  return (
    <LinearGradient
      pointerEvents="none"
      colors={['#1A1614', '#0C0B0B', '#000000']}
      locations={[0, 0.42, 1]}
      start={{ x: 0.85, y: 0 }}
      end={{ x: 0.25, y: 1 }}
      style={styles.darkWash}
    />
  )
}

const styles = StyleSheet.create({
  darkWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 420,
  },
  accent: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    height: '70%',
  },
})
