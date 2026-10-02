import { useEffect } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Card, Icon, PrimaryButton, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import { useFoodLogStore } from '../../store/foodLogStore'

/**
 * Meta "Açúcar no limite": cada um usa o próprio limite, escolhido em Comida.
 * Sem limite (ou com os nutrientes escondidos) a pessoa não contribui; este aviso
 * aparece só para ela, com calma e sem cobrança.
 */
export function useSugarLimitReady(): { ready: boolean; loaded: boolean }
{
  const userId = useAuthStore((s) => s.userId)
  const isGuest = useAuthStore((s) => s.isGuest)
  const loaded = useFoodLogStore((s) => s.loaded)
  const owner = useFoodLogStore((s) => s.owner)
  const metaAcucar = useFoodLogStore((s) => s.prefs.metaAcucar)
  const nutrientes = useFoodLogStore((s) => s.prefs.mostrarCalorias)
  const expected = isGuest || !userId ? 'guest' : userId

  useEffect(() =>
  {
    if (!loaded || owner !== expected) void useFoodLogStore.getState().hydrate({ userId, isGuest }).catch(() => undefined)
  }, [loaded, owner, expected, userId, isGuest])

  const ok = loaded && owner === expected
  return { ready: ok && metaAcucar != null && nutrientes, loaded: ok }
}

export function SugarLimitNote()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const { ready, loaded } = useSugarLimitReady()
  if (!loaded || ready) return null
  return (
    <Card tone="inset" style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
        <Icon name="information-circle-outline" size={20} color={colors.inkMuted} />
        <Text variant="caption" muted style={{ flex: 1 }}>
          Para os seus dias contarem, ligue "Mostrar calorias e nutrientes" em Comida e escolha o seu limite de açúcar. Cada um usa o próprio limite, e só você vê este aviso.
        </Text>
      </View>
      <PrimaryButton label="Abrir Comida" variant="secondary" size="sm" onPress={() => router.push('/comida')} />
    </Card>
  )
}
