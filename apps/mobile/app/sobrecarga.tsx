import { useState } from 'react'
import { View } from 'react-native'
import { OVERLOAD_STEPS } from '@simply-life/shared'
import { Screen, Text, GroupedList, GroupedRow, RowGlyph, Icon } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { CrisisSupportCard } from '../src/components/health/CrisisSupportCard'
import { BodyCheckRow } from '../src/components/care/BodyCheckRow'
import { useTheme } from '../src/theme/ThemeProvider'

const STEP_ICONS = {
  sair: 'location',
  agua: 'water',
  som: 'volume-mute',
  conhecido: 'home',
} as const

/** Sobrecarga sensorial ou de gente. Separado do CVV e sem pontuação. */
export default function SobrecargaScreen()
{
  const { colors, space } = useTheme()
  const [done, setDone] = useState<Record<string, boolean>>({})

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title="Vamos por partes" subtitle="Escolha um passo possível agora, sem pressa." />
      <View style={{ gap: space.lg }}>
        <BodyCheckRow />
        <View style={{ gap: space.sm }}>
          <Text variant="section">Um passo pequeno</Text>
          <GroupedList>
            {OVERLOAD_STEPS.map((step) =>
            {
              const on = done[step.id] === true
              return (
                <GroupedRow
                  key={step.id}
                  leading={<RowGlyph name={STEP_ICONS[step.id]} color={colors.health} />}
                  title={step.title}
                  subtitle={step.hint}
                  onPress={() => setDone((prev) => ({ ...prev, [step.id]: !prev[step.id] }))}
                  chevron={false}
                  trailing={<Icon name={on ? 'checkmark-circle' : 'ellipse'} size={20} color={on ? colors.axel : colors.inkFaint} />}
                  accessibilityLabel={`${step.title}, ${on ? 'feito' : 'marcar como feito'}`}
                />
              )
            })}
          </GroupedList>
        </View>
        <Text variant="caption" muted>
          Se você estiver em risco, o contato abaixo pode ajudar. Esta tela não substitui o CVV.
        </Text>
        <CrisisSupportCard />
      </View>
    </Screen>
  )
}
