import { View } from 'react-native'
import { Icon } from '../../ui/Icon'
import type { RoutineWeekCell } from '@simply-life/shared'
import { Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useWebDesk } from '../dashboard/web/webBox'

type Props = {
  cells: RoutineWeekCell[]
  selectedIso: string
  onSelect: (iso: string) => void
}

/** Semana da rotina — toque o dia para ver e registrar; verde fechou, vermelho faltou. */
export function RoutineWeekStrip({ cells, selectedIso, onSelect }: Props)
{
  const { colors } = useTheme()
  // computador: caixa fina como o resto da web e texto sem ficar minúsculo
  const desk = useWebDesk()

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {cells.map((cell) =>
      {
        const selected = cell.iso === selectedIso
        const bg =
          selected
            ? colors.axelMuted
            : cell.tone === 'good'
              ? `${colors.health}33`
              : cell.tone === 'bad'
                ? `${colors.danger}33`
                : cell.tone === 'today'
                  ? colors.axelMuted
                  : colors.elevated
        return (
          <PressableScale
            key={cell.iso}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${cell.label} ${cell.dayNum}`}
            onPress={() => onSelect(cell.iso)}
            style={{
              flex: 1,
              minHeight: desk ? 76 : 84,
              borderRadius: desk ? 10 : 14,
              paddingVertical: 8,
              alignItems: 'center',
              gap: 6,
              backgroundColor: bg,
              borderWidth: selected || cell.tone === 'today' ? 1 : desk ? 1 : 0,
              borderColor: selected || cell.tone === 'today' ? colors.axel : colors.hairline,
            }}
          >
            <Text variant={desk ? 'label' : 'micro'} muted>
              {cell.label}
            </Text>
            <Text variant="bodyStrong">{cell.dayNum}</Text>
            {/* no computador o mês já está na barra da semana */}
            {desk ? null : (
              <Text variant="micro" muted style={{ fontSize: 11, lineHeight: 14 }}>
                {new Date(`${cell.iso}T12:00:00`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
              </Text>
            )}
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              {cell.done > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Icon name="checkmark" size={11} color={colors.health} />
                  <Text variant={desk ? 'label' : 'micro'} style={{ color: colors.health }}>
                    {cell.done}
                  </Text>
                </View>
              ) : null}
              {cell.miss > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Icon name="close" size={11} color={colors.danger} />
                  <Text variant={desk ? 'label' : 'micro'} style={{ color: colors.danger }}>
                    {cell.miss}
                  </Text>
                </View>
              ) : null}
            </View>
          </PressableScale>
        )
      })}
    </View>
  )
}
