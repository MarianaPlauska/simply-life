import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Icon } from '../../ui/Icon'
import { PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useCircleOverview } from '../../hooks/useCircleOverview'

/** Marquinha Juntos ao lado do perfil: abre o pique, metas juntos e esperas por amigo. */
export function CircleCornerButton({ size = 44 }: { size?: number })
{
  const { colors, elevation } = useTheme()
  const router = useRouter()
  const { attention } = useCircleOverview()

  return (
    <PressableScale
      onPress={() => router.push('/juntos' as never)}
      accessibilityLabel={attention > 0 ? `Juntos, ${attention} pedindo atenção` : 'Juntos: pique e metas com amigos'}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.elevated,
        ...elevation.card,
      }}
    >
      <Icon name="people-outline" size={size >= 44 ? 18 : 16} color={colors.ink} />
      {attention > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 10,
            height: 10,
            borderRadius: 999,
            backgroundColor: colors.axel,
            borderWidth: 2,
            borderColor: colors.elevated,
          }}
        />
      ) : null}
    </PressableScale>
  )
}
