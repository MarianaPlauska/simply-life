import { useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { OVERLOAD_STEPS } from '@simply-life/shared'
import { Screen, Text, PrimaryButton } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { CrisisSupportCard } from '../src/components/health/CrisisSupportCard'
import { BodyCheckRow } from '../src/components/care/BodyCheckRow'
import { useTheme } from '../src/theme/ThemeProvider'

/** Sobrecarga sensorial ou de gente. Separado do CVV e sem pontuação. */
export default function SobrecargaScreen()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const [done, setDone] = useState<Record<string, boolean>>({})

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title="Está demais" subtitle="Um passo de cada vez. Isto não é emergência." />
      <View style={{ gap: space.lg }}>
        <BodyCheckRow />
        {OVERLOAD_STEPS.map((step) =>
        {
          const on = done[step.id] === true
          return (
            <View key={step.id} style={{ gap: 4, borderTopWidth: 1, borderTopColor: colors.hairline, paddingTop: space.sm }}>
              <Text variant="bodyStrong">{step.title}</Text>
              <Text variant="body" muted>{step.hint}</Text>
              <PrimaryButton
                label={on ? 'Feito' : 'Marcar este passo'}
                variant={on ? 'secondary' : 'primary'}
                onPress={() => setDone((prev) => ({ ...prev, [step.id]: !prev[step.id] }))}
              />
            </View>
          )
        })}
        <Text variant="caption" muted>
          Se o momento for de risco, o contato abaixo é o caminho. Esta tela não substitui o CVV.
        </Text>
        <CrisisSupportCard />
        <PrimaryButton label="Voltar" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  )
}
