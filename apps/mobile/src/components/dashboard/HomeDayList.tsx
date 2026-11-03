import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { GroupedList, GroupedRow, Icon, RowGlyph, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAgendaPromptStore, useShowAgendaPrompt } from '../../store/agendaPromptStore'
import { useHomeDayCare } from '../care/useHomeDayCare'

const hhmm = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`

/**
 * "Seu dia" na Home: no máximo três linhas.
 * Energia, o que já fez e a agenda. Dias leves e lugar ficam no Apoio.
 */
export function HomeDayList()
{
  const { colors } = useTheme()
  const router = useRouter()
  const { budget, lines, events, source, today } = useHomeDayCare()
  const showAgendaPrompt = useShowAgendaPrompt()
  const snoozeAgenda = useAgendaPromptStore((s) => s.snooze)
  const [doneOpen, setDoneOpen] = useState(false)

  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
  const nextEvent = events
    .filter((event) => event.date === today && !event.allDay && event.inicio != null && (event.fim ?? event.inicio) >= nowMin)
    .sort((a, b) => (a.inicio ?? 0) - (b.inicio ?? 0))[0]
  const askAgenda = !source && showAgendaPrompt && !nextEvent
  const agendaTitle = nextEvent ? nextEvent.titulo : askAgenda ? 'Conectar agenda' : 'Agenda livre hoje'
  const agendaSubtitle = nextEvent && nextEvent.inicio != null
    ? `Às ${hhmm(nextEvent.inicio)}`
    : askAgenda
      ? 'O Axel encaixa as tarefas entre seus compromissos'
      : 'Nada marcado para o resto do dia'

  return (
    <View style={{ gap: 8 }}>
      <Text variant="section">Seu dia</Text>
      <GroupedList>
        <GroupedRow
          leading={<RowGlyph name="flash-outline" color={budget.over ? colors.danger : colors.attention} />}
          title={budget.over ? 'Dia mais cheio que sua energia' : budget.used === 0 ? 'Dia leve até agora' : 'Energia de hoje'}
          subtitle={`${budget.used} de ${budget.stock}`}
          onPress={() => router.push('/apoio')}
        >
          <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.fill, marginTop: 6, overflow: 'hidden' }}>
            <View
              style={{
                width: `${Math.round(Math.min(1, budget.used / budget.stock) * 100)}%`,
                height: '100%',
                borderRadius: 3,
                backgroundColor: budget.over ? colors.danger : colors.attention,
              }}
            />
          </View>
        </GroupedRow>

        {lines.length > 0 ? (
          <GroupedRow
            leading={<RowGlyph name="checkmark-circle" color={colors.axel} />}
            title="O que você já fez hoje"
            subtitle={doneOpen ? undefined : 'Toque para ver a lista'}
            value={String(lines.length)}
            onPress={() => setDoneOpen((open) => !open)}
            chevron={false}
            trailing={<Icon name={doneOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.inkFaint} />}
          >
            {doneOpen ? (
              <View style={{ gap: 4, marginTop: 6 }}>
                {lines.slice(0, 8).map((line) => (
                  <Text key={line.id} variant="caption" muted>{`- ${line.text}`}</Text>
                ))}
              </View>
            ) : null}
          </GroupedRow>
        ) : null}

        <GroupedRow
          leading={<RowGlyph name="calendar" color={colors.tasks} />}
          title={agendaTitle}
          subtitle={agendaSubtitle}
          subtitleLines={2}
          onPress={() => router.push(askAgenda ? '/agenda' : '/calendario')}
          chevron={!askAgenda}
          trailing={askAgenda ? (
            <Pressable
              onPress={snoozeAgenda}
              accessibilityLabel="Conectar depois"
              hitSlop={8}
              style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="close" size={18} color={colors.inkFaint} />
            </Pressable>
          ) : undefined}
        />
      </GroupedList>
    </View>
  )
}
