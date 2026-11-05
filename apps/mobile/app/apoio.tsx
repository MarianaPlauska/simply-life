import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen, Text, GroupedList, GroupedRow, RowGlyph } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { CareHomeStrip } from '../src/components/care/CareHomeStrip'
import { BodyCheckRow } from '../src/components/care/BodyCheckRow'
import { FinanceCareMoney } from '../src/components/finance/FinanceCareMoney'
import { useTheme } from '../src/theme/ThemeProvider'
import { useCareExtrasStore } from '../src/store/careExtrasStore'

/** Tudo o que foi acrescentado, num lugar só do menu. */
export default function ApoioScreen()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const buffer = useCareExtrasStore((s) => s.transitionBufferMin)
  const setBuffer = useCareExtrasStore((s) => s.setTransitionBuffer)

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader
        title="Apoio do dia"
        subtitle="Cuidados simples para acompanhar seu dia, no seu ritmo."
      />
      <View style={{ gap: space.lg }}>
        <View style={{ gap: space.sm }}>
          <Text variant="section">Como está o seu dia</Text>
          <CareHomeStrip />
        </View>

        <View style={{ gap: space.sm }}>
          <BodyCheckRow />
        </View>

        <GroupedList>
          <GroupedRow
            leading={<RowGlyph name="volume-mute" color={colors.health} />}
            title="Precisa de uma pausa?"
            subtitle="Se o dia pesou, vamos encontrar um próximo passo juntos."
            onPress={() => router.push('/sobrecarga' as never)}
          />
          <GroupedRow
            leading={<RowGlyph name="location" color={colors.axel} />}
            title="Lugares"
            subtitle="Diga que chegou. O celular não fica rastreando."
            onPress={() => router.push('/lugares' as never)}
          />
          <GroupedRow
            leading={<RowGlyph name="time-outline" color={colors.ink} />}
            title={buffer > 0 ? `Tempo de troca ligado, ${buffer} min` : 'Tempo de troca'}
            subtitle="Reserva minutos antes de cada horário marcado. Desligado, o dia fica igual."
            onPress={() => setBuffer(buffer > 0 ? 0 : 10)}
          />
          <GroupedRow
            leading={<RowGlyph name="timer-outline" color={colors.axel} />}
            title="Checar o corpo no foco"
            subtitle="Faça esse registro enquanto se concentra."
            onPress={() => router.push('/foco' as never)}
          />
          <GroupedRow
            leading={<RowGlyph name="people-outline" color={colors.brand} />}
            title="Foco em silêncio"
            subtitle="Convite de 25 minutos, sem câmera e sem ver a tarefa do outro."
            onPress={() => router.push('/juntos' as never)}
          />
        </GroupedList>

        <FinanceCareMoney />
      </View>
    </Screen>
  )
}
