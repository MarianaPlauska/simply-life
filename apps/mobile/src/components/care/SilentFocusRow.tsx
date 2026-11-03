import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Text, PrimaryButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import {
  createSilentSession,
  listSilentSessions,
  setSilentState,
  type SilentSession,
} from '../../lib/sync/focusSessions'

type Friend = { userId: string; displayName: string }

/** Convite para focar no mesmo horário, sem câmera e sem ver a tarefa. */
export function SilentFocusRow({ friends, compact = false }: { friends: Friend[]; compact?: boolean })
{
  const { space } = useTheme()
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)
  const isGuest = useAuthStore((s) => s.isGuest)
  const [rows, setRows] = useState<SilentSession[]>([])
  const [note, setNote] = useState<string | null>(null)

  const reload = async () =>
  {
    const res = await listSilentSessions()
    setRows(res.rows)
    setNote(res.error)
  }

  useEffect(() =>
  {
    void reload()
  }, [userId])

  if (isGuest || !userId) return null
  if (compact && rows.length === 0) return null

  const nameOf = (id: string) => friends.find((friend) => friend.userId === id)?.displayName ?? 'Alguém do Círculo'

  return (
    <View style={{ gap: space.sm }}>
      <Text variant="bodyStrong">Sessão em silêncio</Text>
      <Text variant="caption" muted>
        O convite só marca o horário. A tarefa de cada um fica no próprio app.
      </Text>
      {compact ? null : friends.slice(0, 4).map((friend) => (
        <PrimaryButton
          key={friend.userId}
          label={`Silêncio com ${friend.displayName.split(' ')[0]}`}
          variant="ghost"
          size="sm"
          onPress={() =>
          {
            void createSilentSession(friend.userId).then((res) =>
            {
              setNote(res.error ?? 'Convite enviado. Vale por 25 minutos.')
              void reload()
            })
          }}
        />
      ))}
      {rows.map((row) =>
      {
        const other = row.anfitriao === userId ? row.convidado : row.anfitriao
        const mine = row.anfitriao === userId
        return (
          <View key={row.id} style={{ gap: 4 }}>
            <Text variant="body">
              {row.estado === 'ativa' ? `Em silêncio com ${nameOf(other)}` : mine ? `Convite para ${nameOf(other)}` : `${nameOf(other)} chamou para focar em silêncio`}
            </Text>
            {row.estado === 'convite' && !mine ? (
              <PrimaryButton label="Aceitar" size="sm" onPress={() => void setSilentState(row.id, 'ativa').then(reload)} />
            ) : null}
            <PrimaryButton label="Encerrar" size="sm" variant="ghost" onPress={() => void setSilentState(row.id, 'encerrada').then(reload)} />
            {row.estado === 'ativa' ? (
              <PrimaryButton label="Abrir o timer" size="sm" variant="secondary" onPress={() => router.push('/foco' as never)} />
            ) : null}
          </View>
        )
      })}
      {note ? <Text variant="caption" muted>{note}</Text> : null}
    </View>
  )
}
