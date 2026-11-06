import { View, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Icon } from '../../ui/Icon'
import { formatBRL, type DayDueBill } from '@simply-life/shared'
import { Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useFinanceFocusStore } from '../../store/financeFocusStore'

type Props = {
  bill: DayDueBill
  onToggle: () => void
}

/** Conta do mês no topo da Lista — mesmo recorte visual da agenda. */
export function DayBillCard({ bill, onToggle }: Props)
{
  const { colors } = useTheme()
  const router = useRouter()
  const openContas = useFinanceFocusStore((s) => s.openContas)
  const muted = bill.locked ? colors.axel : colors.inkMuted

  // linha direto no fundo, igual às tarefas: a cor do ícone e do texto já diz que é conta
  return (
    <Pressable
      onPress={() =>
      {
        openContas(bill.kind === 'fixa' ? 'contas-fixas' : 'faturas')
        router.push('/(tabs)/financeiro')
      }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 10,
        minHeight: 64,
        backgroundColor: pressed ? colors.fill : 'transparent',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.hairline,
      })}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 999,
          backgroundColor: bill.locked ? `${colors.axelFill}26` : `${colors.finance}26`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon
          name={bill.locked ? 'lock-closed' : 'card-outline'}
          size={18}
          color={bill.locked ? colors.axel : colors.finance}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {bill.titulo}
        </Text>
        <Text variant="caption" numberOfLines={1} style={{ color: muted }}>
          {bill.detalhe} · {formatBRL(bill.valor)}
        </Text>
      </View>
      <PressableScale
        accessibilityRole="checkbox"
        accessibilityState={{ checked: false }}
        accessibilityLabel="Marcar como paga"
        onPress={onToggle}
        style={{
          width: 26,
          height: 26,
          borderRadius: 8,
          borderWidth: 1.5,
          borderColor: colors.ink,
          backgroundColor: 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
    </Pressable>
  )
}
