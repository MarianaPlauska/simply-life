import { View, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
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
  const { colors, mode } = useTheme()
  const router = useRouter()
  const openContas = useFinanceFocusStore((s) => s.openContas)
  const muted = bill.locked ? colors.axel : colors.inkMuted
  const bg = bill.locked
    ? mode === 'dark'
      ? 'rgba(232, 115, 74, 0.18)'
      : 'rgba(232, 115, 74, 0.14)'
    : mode === 'dark'
      ? 'rgba(212, 184, 150, 0.14)'
      : 'rgba(212, 184, 150, 0.18)'

  return (
    <Pressable
      onPress={() =>
      {
        openContas(bill.kind === 'fixa' ? 'contas-fixas' : 'faturas')
        router.push('/(tabs)/financeiro')
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingRight: 14,
        paddingLeft: 10,
        borderRadius: 20,
        backgroundColor: bg,
        minHeight: 72,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: 5,
          alignSelf: 'stretch',
          borderRadius: 999,
          backgroundColor: bill.locked ? colors.axel : colors.finance,
        }}
      />
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          backgroundColor: bill.locked ? `${colors.axel}26` : `${colors.finance}26`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons
          name={bill.locked ? 'lock-closed' : 'card-outline'}
          size={18}
          color={bill.locked ? colors.axel : colors.finance}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
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
