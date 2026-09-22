import type { ReactNode } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen, Text, PrimaryButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  title: string
  progress: number
  children: ReactNode
  footer?: ReactNode
}

/** Header, barra de progresso e disclaimer dos exercícios de acalmar. */
export function CalmExerciseChrome({ title, progress, children, footer }: Props)
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const pct = Math.max(0, Math.min(1, progress))

  return (
    <Screen scroll tabBarInset={false}>
      <View style={{ gap: space.lg, maxWidth: 480, alignSelf: 'center', width: '100%' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="section" style={{ flex: 1 }}>{title}</Text>
          <PrimaryButton
            label="Fechar"
            variant="ghost"
            size="sm"
            onPress={() => router.back()}
          />
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ now: Math.round(pct * 100), min: 0, max: 100 }}
          style={{
            height: 6,
            borderRadius: 999,
            backgroundColor: colors.hairline,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${Math.round(pct * 100)}%`,
              height: '100%',
              backgroundColor: colors.health,
            }}
          />
        </View>
        {children}
        <Text variant="caption" muted>
          Não substitui atendimento profissional nem emergência. CVV: 188.
        </Text>
        {footer}
      </View>
    </Screen>
  )
}
