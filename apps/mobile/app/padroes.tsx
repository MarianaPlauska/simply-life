import { ActivityIndicator, View } from 'react-native'
import { Redirect } from 'expo-router'
import { LIFE_PATTERN_MIN_DAYS } from '@simply-life/shared'
import { Screen, Text, Card, EmptyState } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { LifePatternItem } from '../src/components/dashboard/LifePatternCard'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { useLifePatterns } from '../src/hooks/useLifePatterns'

export default function PadroesScreen()
{
  const { space, colors } = useTheme()
  const userId = useAuthStore((s) => s.userId)
  const { patterns, loading, daysLogged } = useLifePatterns()

  if (!userId) return <Redirect href="/login" />

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title="O que mexe com você" subtitle="Padrões dos seus últimos 60 dias" />
      <View style={{ gap: space.md }}>
        {loading ? (
          <ActivityIndicator color={colors.axel} />
        ) : patterns.length === 0 ? (
          <Card>
            <EmptyState
              icon="sparkles-outline"
              title="Ainda conhecendo você"
              body={`O AXEL precisa de pelo menos ${LIFE_PATTERN_MIN_DAYS * 2} dias com sono, água, treino, humor, gastos ou tarefas registrados. Você tem ${daysLogged}. Continue registrando e as descobertas aparecem aqui.`}
            />
          </Card>
        ) : (
          patterns.map((p) => (
            <Card key={p.id}>
              <LifePatternItem pattern={p} />
            </Card>
          ))
        )}
        <Text variant="caption" muted>
          O AXEL compara os dias em que algo aconteceu com os dias em que não aconteceu. Um padrão mostra o que anda junto
          nos seus registros, não prova que uma coisa causa a outra. Padrão forte tem 8 dias ou mais de cada lado.
        </Text>
      </View>
    </Screen>
  )
}
