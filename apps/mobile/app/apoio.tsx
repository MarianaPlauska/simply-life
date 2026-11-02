import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen, Text, Card, GroupedList, GroupedRow, RowGlyph } from '../src/ui'
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
        subtitle="Nada daqui muda o plano, a carteira ou o foco até você ligar."
      />
      <View style={{ gap: space.lg }}>
        <Card tone="elevated" style={{ gap: space.sm, padding: space.md }}>
          <Text variant="section">Energia, burnout e o que já fez</Text>
          <CareHomeStrip />
        </Card>

        <View style={{ gap: space.sm }}>
          <Text variant="section">Corpo</Text>
          <BodyCheckRow />
        </View>

        <GroupedList>
          <GroupedRow
            leading={<RowGlyph name="volume-mute" color={colors.health} />}
            title="Está demais"
            subtitle="Roteiro curto de sobrecarga. O CVV continua no fim."
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
            subtitle="Os quatro toques também aparecem no timer."
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
