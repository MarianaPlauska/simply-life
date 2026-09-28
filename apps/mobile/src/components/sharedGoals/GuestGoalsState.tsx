import { useRouter } from 'expo-router'
import { Card, EmptyState, PrimaryButton } from '../../ui'

/** Convidado: metas juntos precisam de conta (tudo do convidado fica no aparelho). */
export function GuestGoalsState()
{
  const router = useRouter()
  return (
    <Card>
      <EmptyState
        icon="flag-outline"
        title="Metas juntos precisam de uma conta"
        body="No modo convidado tudo fica só neste aparelho. Com uma conta, você chama até 4 pessoas e cada um segue anotando no próprio app."
      />
      <PrimaryButton label="Criar conta ou entrar" onPress={() => router.push('/login')} />
    </Card>
  )
}
