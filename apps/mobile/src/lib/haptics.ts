import { Platform } from 'react-native'

function pulseNative(): void
{
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
      Vibration.vibrate(12)
    }
    catch
    {
      /* ignore */
    }
  }
}

/** Haptic leve - expo-haptics no nativo; no-op no web */
export function hapticLight(): void
{
  if (Platform.OS === 'web') return
  pulseNative()
}

/** Pulso nas trocas de fase da respiração. Respeita prefs e reduzir movimento. */
export function hapticBreathPulse(): void
{
  if (Platform.OS === 'web') return
  try
  {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { usePrefsStore } = require('../store/prefsStore') as typeof import('../store/prefsStore')
    const prefs = usePrefsStore.getState().prefs
    if (prefs.a11y_reduce_motion || prefs.calm_haptics_enabled === false) return
  }
  catch
  {
    return
  }
  pulseNative()
}


/** Fim do descanso no treino: aviso de sucesso (mais perceptível que o leve). */
export function hapticRestDone(): void
{
  if (Platform.OS === 'web')
  {
    try
    {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.([30, 60, 30])
    }
    catch
    {
      /* ignore */
    }
    return
  }
  try
  {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Haptics = require('expo-haptics') as typeof import('expo-haptics')
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }
  catch
  {
    pulseNative()
  }
}
