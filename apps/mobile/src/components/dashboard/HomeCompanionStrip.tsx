import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Card, Text, PrimaryButton, SectionHeader } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import {
  fetchPartnerWorkspace,
  type PartnerWorkspaceState,
} from '../../lib/partnerWorkspace'

type Props = {
  /** Mostrar convite quando humor baixo (1–2). */
  lowMood?: boolean
}

/** Companhia / parceiro — reduz sensação de solidão sem forçar socialização. */
export function HomeCompanionStrip({ lowMood }: Props)
{
  const { space } = useTheme()
  const router = useRouter()
  const isGuest = useAuthStore((s) => s.isGuest)
  const [state, setState] = useState<PartnerWorkspaceState | null>(null)

  const reload = useCallback(async () =>
  {
    if (isGuest)
    {
      setState(null)
      return
    }
    setState(await fetchPartnerWorkspace())
  }, [isGuest])

  useEffect(() =>
  {
    void reload()
  }, [reload])

  if (isGuest) return null

  if (state?.partnerUserId)
  {
    return (
      <Card tone="elevated" style={{ gap: space.sm }}>
        <SectionHeader
          title="Você não está sozinho"
          subtitle={`Conectado com ${state.partnerDisplayName}`}
        />
        <Text variant="body" muted>
          Gastos do casal e metas compartilhadas ficam em Finanças. Em dias difíceis, um
          registro de humor já é um passo — não é obrigatório conversar com ninguém.
        </Text>
        <PrimaryButton
          label="Abrir finanças do casal"
          variant="secondary"
          icon="people-outline"
          onPress={() => router.push('/(tabs)/financeiro')}
        />
      </Card>
    )
  }

  if (!lowMood) return null

  return (
    <Card tone="elevated" style={{ gap: space.sm }}>
      <SectionHeader
        title="Companhia"
        subtitle="Opcional — sem pressão para responder"
      />
      <Text variant="body" muted>
        Dias com humor baixo pesam mais sozinhos. Você pode convidar alguém de confiança para
        o workspace do casal (finanças e metas) ou ligar para o CVV (188), 24 horas.
      </Text>
      <View style={{ gap: space.sm }}>
        <PrimaryButton
          label="Convidar parceiro"
          variant="secondary"
          icon="person-add-outline"
          onPress={() => router.push('/(tabs)/financeiro')}
        />
      </View>
    </Card>
  )
}
