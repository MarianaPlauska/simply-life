import { Linking, Platform, View } from 'react-native'
import { Card, Text, PrimaryButton, SectionHeader } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

const CVV_NUMBER = '188'

/** Apoio em crise — sempre visível em Saúde. Não substitui emergência (192 SAMU). */
export function CrisisSupportCard({ compact = false }: { compact?: boolean })
{
  const { colors, space } = useTheme()

  const callCvv = () =>
  {
    const tel = `tel:${CVV_NUMBER}`
    void Linking.openURL(tel).catch(() =>
    {
      /* web pode bloquear tel: */
    })
  }

  return (
    <Card
      tone="elevated"
      style={{
        gap: space.sm,
        borderLeftWidth: 3,
        borderLeftColor: colors.danger,
      }}
    >
      <SectionHeader
        title="Apoio emocional 24h"
        subtitle="CVV — Centro de Valorização da Vida"
      />
      <Text variant="body" muted>
        Se o momento está difícil, você pode ligar gratuitamente para o CVV ({CVV_NUMBER}).
        O Simply Life organiza a rotina; não substitui atendimento profissional nem emergência
        médica (SAMU 192).
      </Text>
      {!compact ? (
        <Text variant="caption" muted>
          Também há chat em cvv.org.br. Em risco imediato à vida, procure o SAMU ou um serviço de
          urgência.
        </Text>
      ) : null}
      <View style={{ flexDirection: compact ? 'row' : 'column', gap: space.sm }}>
        <PrimaryButton
          label={`Ligar ${CVV_NUMBER}`}
          icon="call-outline"
          onPress={callCvv}
          style={compact ? { flex: 1 } : undefined}
        />
        {Platform.OS === 'web' ? (
          <PrimaryButton
            label="Site do CVV"
            variant="secondary"
            icon="globe-outline"
            onPress={() => void Linking.openURL('https://www.cvv.org.br')}
            style={compact ? { flex: 1 } : undefined}
          />
        ) : null}
      </View>
    </Card>
  )
}
