import { Platform } from 'react-native'

/** Haptic leve - expo-haptics no nativo; no-op no web */
export function hapticLight(): void
{
  if (Platform.OS === 'web') return
  try
  {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Haptics = require('expo-haptics') as typeof import('expo-haptics')
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }
  catch
  {
    try
    {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Vibration } = require('react-native') as typeof import('react-native')
      Vibration.vibrate(10)
    }
    catch
    {
      /* ignore */
    }
  }
}
