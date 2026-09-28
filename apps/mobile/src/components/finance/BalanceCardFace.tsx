import { StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ContactlessPaymentIcon } from 'phosphor-react-native/src/icons/ContactlessPayment'
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus'
import { formatBRL } from '@simply-life/shared'
import { PressableScale, Text } from '../../ui'
import type { SaldoTone } from './saldoTone'
import { CARD_ASPECT } from './CreditCardVisual'


type Props = {
  tone: SaldoTone
  disponivel: number
  deltaPct: number
  /** Entradas e saídas do mês na conta */
  entradas: number
  saidas: number
  /** Nome da conta (padrão: Conta) */
  titulo?: string
  onAddExpense: () => void
}

/** Saldo da conta com cara de cartão: primeira página da carteira, na cor da situação do mês. */
export function BalanceCardFace({ tone, disponivel, deltaPct, entradas, saidas, titulo = 'Conta', onAddExpense }: Props)
{
  const delta = `${deltaPct > 0 ? '+' : ''}${String(deltaPct).replace('.', ',')}% no mês`

  return (
    <View style={styles.shadow}>
      <LinearGradient
        colors={[tone.from, tone.to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { aspectRatio: CARD_ASPECT }]}
      >
        {/* Brilho diagonal sutil, como a laminação de um cartão */}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.7, y: 0.6 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.row}>
          <Text variant="label" style={{ color: tone.fg, fontFamily: 'Fraunces_500Medium', fontSize: 16 }}>
            {titulo}
          </Text>
          <View style={styles.status}>
            <Text variant="micro" style={{ color: tone.fg, fontWeight: '700' }}>
              {tone.label}
            </Text>
          </View>
        </View>

        <View style={[styles.row, { alignItems: 'center' }]}>
          <View style={styles.chip} accessibilityElementsHidden importantForAccessibility="no">
            <View style={styles.chipLine} />
            <View style={[styles.chipLine, { top: '66%' }]} />
            <View style={styles.chipMid} />
          </View>
          <ContactlessPaymentIcon size={24} color={tone.muted} weight="regular" />
        </View>

        <View style={{ gap: 2 }}>
          <Text variant="micro" style={{ color: tone.muted }}>
            Saldo da conta · {delta}
          </Text>
          <Text
            variant="hero"
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ color: tone.fg, fontSize: 28, lineHeight: 34, letterSpacing: -0.6, fontVariant: ['tabular-nums'] }}
          >
            {formatBRL(disponivel)}
          </Text>
        </View>

        <View style={[styles.row, { alignItems: 'flex-end' }]}>
          <View style={{ gap: 2, flexShrink: 1 }}>
            <Text variant="micro" numberOfLines={1} style={{ color: tone.muted, fontVariant: ['tabular-nums'] }}>
              Entrou {formatBRL(entradas)}
            </Text>
            <Text variant="micro" numberOfLines={1} style={{ color: tone.fg, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
              Saiu {formatBRL(saidas)}
            </Text>
          </View>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Registrar gasto"
            onPress={onAddExpense}
            style={styles.addBtn}
          >
            <PlusIcon size={14} color={tone.to} weight="bold" />
            <Text variant="label" style={{ color: tone.to, fontWeight: '700', fontSize: 13 }}>
              Gasto
            </Text>
          </PressableScale>
        </View>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 18,
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  status: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  chip: {
    width: 40,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#D9BC7A',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    overflow: 'hidden',
  },
  chipLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '33%',
    height: 1,
    backgroundColor: 'rgba(90,62,10,0.35)',
  },
  chipMid: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '40%',
    width: 1,
    backgroundColor: 'rgba(90,62,10,0.35)',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
})
