import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Text, Icon, GroupedList, GroupedRow, RowGlyph } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useHomeDayCare } from './useHomeDayCare'

/**
 * Acréscimos do dia: energia, burnout, o que já foi feito e o lugar.
 * Nada daqui reordena tarefa nem muda o ritual da noite.
 */
export function CareHomeStrip()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const {
    stock,
    setStock,
    burnout,
    startBurnout,
    stopBurnout,
    suggestion,
    lines,
    here,
    hereTasks,
    budget,
    active,
  } = useHomeDayCare()
  const [burnoutOpen, setBurnoutOpen] = useState(false)
  const [doneOpen, setDoneOpen] = useState(false)

  const pct = Math.min(1, budget.used / budget.stock)
  const energyTitle = budget.used === 0
    ? 'Dia leve até agora'
    : budget.over ? 'Dia mais cheio que sua energia' : `Dia ${budget.used <= budget.stock / 2 ? 'tranquilo' : 'cheio, mas cabe'}`
  const energySubtitle = budget.over
    ? `As tarefas de hoje pedem ${budget.used} de energia e você tem ${budget.stock}. Vale adiar algo.`
    : `As tarefas e compromissos de hoje usam ${budget.used} dos seus ${budget.stock} pontos de energia.`

  return (
    <View style={{ gap: space.sm }}>
      <GroupedList>
        <GroupedRow
          leading={<RowGlyph name="flash-outline" color={budget.over ? colors.danger : colors.attention} />}
          title={energyTitle}
          subtitle={energySubtitle}
          subtitleLines={2}
        >
          <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.fill, marginTop: 6, overflow: 'hidden' }}>
            <View
              style={{
                width: `${Math.round(pct * 100)}%`,
                height: '100%',
                borderRadius: 3,
                backgroundColor: budget.over ? colors.danger : colors.attention,
              }}
            />
          </View>
        </GroupedRow>

        {suggestion != null ? (
          <GroupedRow
            leading={<RowGlyph name="moon" color={colors.axel} />}
            title="Hoje parece um dia de pouca energia"
            subtitle={`Toque para contar com ${suggestion} pontos em vez de ${stock}. Suas tarefas não mudam.`}
            subtitleLines={2}
            onPress={() => setStock(suggestion)}
          />
        ) : null}

        {active && burnout ? (
          <GroupedRow
            leading={<RowGlyph name="leaf-outline" color={colors.health} />}
            title={`Modo descanso até ${burnout.until.split('-').reverse().join('/')}`}
            subtitle="Sua sequência fica protegida nesses dias. Toque para desligar."
            subtitleLines={2}
            onPress={stopBurnout}
          />
        ) : (
          <GroupedRow
            leading={<RowGlyph name="leaf-outline" color={colors.health} />}
            title="Preciso de uns dias leves"
            subtitle="Para semanas difíceis: sua sequência não quebra e o AXEL pega leve."
            subtitleLines={2}
            onPress={() => setBurnoutOpen((open) => !open)}
            chevron={false}
            trailing={<Icon name={burnoutOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.inkFaint} />}
          />
        )}

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
          leading={<RowGlyph name="location" color={colors.tasks} />}
          title={here ? `Você está em: ${here.nome}` : 'Onde você está agora?'}
          subtitle={here
            ? `${hereTasks.length} tarefa${hereTasks.length === 1 ? '' : 's'} para fazer aqui.`
            : 'Marque casa, trabalho ou mercado e veja o que dá para fazer lá.'}
          subtitleLines={2}
          onPress={() => router.push('/lugares' as never)}
        />
      </GroupedList>

      {burnoutOpen && !active ? (
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {([3, 7] as const).map((days) => (
            <Pressable
              key={days}
              accessibilityRole="button"
              onPress={() => { startBurnout(days); setBurnoutOpen(false) }}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.healthMuted,
              }}
            >
              <Text variant="bodyStrong" color={colors.health}>{`${days} dias leves`}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  )
}
