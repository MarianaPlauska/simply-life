import { Linking, Platform, Pressable, View } from 'react-native'
import { Text, PrimaryButton } from '../ui'
import { BrandMark } from './BrandMark'
import { useTheme } from '../theme/ThemeProvider'
import { getWebAppUrl } from '../lib/webAppUrl'

/**
 * Gate desktop no Expo web — tab bar mobile não escala para telas largas.
 * A experiência desktop completa fica no app Vite (frontend/).
 */
export function DesktopWebRedirect()
{
  const { colors, space, radius, elevation } = useTheme()
  const webUrl = getWebAppUrl()

  const openWebApp = () =>
  {
    if (Platform.OS === 'web' && typeof window !== 'undefined')
    {
      window.location.href = webUrl
      return
    }
    void Linking.openURL(webUrl)
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.canvas,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: space.xl,
        paddingVertical: space.xxl,
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 440,
          alignItems: 'center',
          gap: space.lg,
          paddingVertical: space.xl,
          paddingHorizontal: space.lg,
          borderRadius: radius.sheet,
          backgroundColor: colors.elevated,
          borderWidth: 1,
          borderColor: colors.hairlineStrong,
          ...elevation.card,
        }}
      >
        <BrandMark size={72} />
        <Text variant="hero" style={{ textAlign: 'center', letterSpacing: -0.4 }}>
          Simply Life
        </Text>
        <Text
          variant="body"
          muted
          style={{ textAlign: 'center', maxWidth: 360, lineHeight: 24 }}
        >
          O Simply-Life funciona melhor no celular ou no navegador desktop completo.
        </Text>
        <PrimaryButton
          label="Abrir versão web"
          onPress={openWebApp}
          style={{ width: '100%', borderRadius: 999, marginTop: space.sm }}
        />
        <Pressable
          onPress={openWebApp}
          accessibilityRole="link"
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Text variant="caption" color={colors.axel} style={{ textAlign: 'center' }}>
            {webUrl}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
