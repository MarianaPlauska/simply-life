import { View } from 'react-native'
import { useRouter } from 'expo-router'
import type { MobileTask } from '@simply-life/shared'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { WebHoverable } from './WebHoverable'
import { webStyle } from './webStyle'

function timeLabel(mins: number | null): string
{
  if (mins == null) return '—'
  const h = Math.floor(mins / 60).toString().padStart(2, '0')
  const m = (mins % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

const PRIORITY_LABEL: Record<1 | 2 | 3, string> = { 1: 'Alta', 2: 'Média', 3: 'Baixa' }

type Props = {
  tasks: MobileTask[]
  overdueCount: number
}

/** Agenda do dia como lista real (colunas: hora, tarefa, prioridade) — não um card mobile vazio. */
export function WebTodayAgenda({ tasks, overdueCount }: Props)
{
  const { colors } = useTheme()
  const router = useRouter()

  return (
    <View style={{ borderRadius: 14, backgroundColor: colors.elevated, overflow: 'hidden' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 18,
          paddingBottom: 14,
        }}
      >
        <View style={{ gap: 2 }}>
          <Text variant="section" style={{ fontSize: 18 }}>
            Agenda de hoje
          </Text>
          <Text variant="caption" muted>
            {tasks.length === 0
              ? 'Nada agendado para hoje'
              : `${tasks.length} tarefa${tasks.length === 1 ? '' : 's'}${
                  overdueCount > 0 ? ` · ${overdueCount} atrasada${overdueCount === 1 ? '' : 's'}` : ''
                }`}
          </Text>
        </View>
        <WebHoverable onPress={() => router.push('/(tabs)/kanban')}>
          <Text variant="caption" style={{ color: colors.axel, fontWeight: '700' }}>
            Abrir Kanban
          </Text>
        </WebHoverable>
      </View>

      {tasks.length === 0 ? (
        <View style={{ paddingHorizontal: 20, paddingBottom: 22 }}>
          <Text variant="caption" muted>
            Dê um horário a uma tarefa para ela aparecer aqui, na sua agenda do dia.
          </Text>
        </View>
      ) : (
        <View style={{ paddingBottom: 6 }}>
          <View
            style={{
              flexDirection: 'row',
              paddingHorizontal: 20,
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: colors.hairline,
            }}
          >
            <Text variant="micro" muted style={{ width: 64, fontWeight: '700' }}>
              HORA
            </Text>
            <Text variant="micro" muted style={{ flex: 1, fontWeight: '700' }}>
              TAREFA
            </Text>
            <Text variant="micro" muted style={{ width: 90, fontWeight: '700', textAlign: 'right' }}>
              PRIORIDADE
            </Text>
          </View>
          {tasks.map((t) => (
            <WebHoverable
              key={t.id}
              onPress={() => router.push(`/task/${t.id}`)}
              style={(hovered) => webStyle({
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingVertical: 12,
                backgroundColor: hovered ? colors.surface : 'transparent',
                cursor: 'pointer',
              })}
            >
              <Text variant="bodyStrong" style={{ width: 64, color: colors.inkMuted, fontSize: 13 }}>
                {timeLabel(t.horaMinutos)}
              </Text>
              <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1, fontSize: 14 }}>
                {t.titulo}
              </Text>
              <View style={{ width: 90, alignItems: 'flex-end' }}>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 999,
                    backgroundColor: t.prioridade === 1 ? `${colors.danger}22` : colors.hairline,
                  }}
                >
                  <Text
                    variant="micro"
                    style={{
                      color: t.prioridade === 1 ? colors.danger : colors.inkMuted,
                      fontWeight: '700',
                    }}
                  >
                    {PRIORITY_LABEL[t.prioridade]}
                  </Text>
                </View>
              </View>
            </WebHoverable>
          ))}
        </View>
      )}
    </View>
  )
}
