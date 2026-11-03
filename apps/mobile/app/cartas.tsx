import { View } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { Screen, Text, PrimaryButton } from '../src/ui'
import { useTheme } from '../src/theme/ThemeProvider'
import { usePlayStore } from '../src/store/playStore'
import { useHomePlay } from '../src/hooks/useHomePlay'

/** Álbum das cartas já reveladas. Nada daqui é apagado quando o dia passa. */
export default function CartasScreen()
{
  const { space, colors } = useTheme()
  const router = useRouter()
  const cards = usePlayStore((s) => s.cards)
  const play = useHomePlay()

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'Cartas', headerShown: true }} />
      <View style={{ padding: space.lg, gap: space.md, paddingBottom: 48 }}>
        <Text variant="hero">Suas cartas</Text>
        <Text variant="caption" muted>Cada carta revelada fica aqui. O dia em branco não apaga nenhuma.</Text>
        {!play.revealed ? (
          <PrimaryButton
            label="Revelar a de hoje"
            onPress={() =>
            {
              play.reveal()
              router.back()
            }}
          />
        ) : (
          <View style={{ gap: 4, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.hairline }}>
            <Text variant="caption" muted>Hoje</Text>
            <Text variant="body">{play.card.text}</Text>
          </View>
        )}
        {cards.filter((card) => card.id !== play.card.id).map((card) => (
          <View key={card.id} style={{ gap: 4, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.hairline }}>
            <Text variant="caption" muted>{card.day}</Text>
            <Text variant="body">{card.text}</Text>
          </View>
        ))}
      </View>
    </Screen>
  )
}
