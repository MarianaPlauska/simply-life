import { Pressable, StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ContactlessPaymentIcon } from 'phosphor-react-native/src/icons/ContactlessPayment'
import { formatBRL, type FinanceCard, type FinanceCardGradient } from '@simply-life/shared'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

/** Proporção do cartão bancário (ISO/IEC 7810 ID-1: 85,60 × 53,98 mm) */
export const CARD_ASPECT = 85.6 / 53.98

/**
 * Cores do cartão (as chaves ficam salvas no banco; só o desenho mudou).
 * Todas passam de 4,5:1 com texto branco no ponto mais claro.
 */
export const CARD_SKINS: Record<FinanceCardGradient, { label: string; from: string; to: string }> = {
  copper: { label: 'Coral', from: '#A84B27', to: '#5A2412' },
  ocean: { label: 'Petróleo', from: '#2F5A5E', to: '#152B2D' },
  mint: { label: 'Floresta', from: '#2B7454', to: '#143626' },
  sunset: { label: 'Âmbar', from: '#8A5E0E', to: '#40300A' },
  purple: { label: 'Ameixa', from: '#5B3A5E', to: '#2A1B2C' },
  obsidian: { label: 'Carvão', from: '#3A3F3F', to: '#151A1A' },
}

export const CARD_SKIN_ORDER: FinanceCardGradient[] = ['copper', 'ocean', 'mint', 'sunset', 'purple', 'obsidian']

const INK = '#FFFFFF'
const INK_SOFT = 'rgba(255,255,255,0.86)'

type Props = {
  card: FinanceCard
  width: number
  selected?: boolean
  onPress?: () => void
}

/** Cartão de crédito com cara de cartão: nome, chip, disponível, fatura, vencimento, finais e validade. */
export function CreditCardVisual({ card, width, selected, onPress }: Props)
{
  const { colors } = useTheme()
  const skin = CARD_SKINS[card.tipoGradiente ?? 'copper'] ?? CARD_SKINS.copper
  const fatura = card.faturaAberta ?? 0
  const disponivel = Math.max(0, card.limite - fatura)
  const usage = card.limite > 0 ? Math.min(100, (fatura / card.limite) * 100) : 0
  const blocked = card.status === 'bloqueado'
  const digits = (card.numeroMascarado || '').replace(/\D/g, '').slice(-4) || '0000'
  const titular = (card.titular?.trim() || card.nome).toUpperCase()
  const validade = card.validadeMesAno?.trim() || '--/--'

  const face = (
    <View
      style={[
        styles.shadow,
        {
          width,
          opacity: blocked ? 0.72 : 1,
          borderRadius: 16,
          borderWidth: selected ? 2 : 0,
          borderColor: selected ? colors.axelFill : 'transparent',
        },
      ]}
    >
      <LinearGradient
        colors={[skin.from, skin.to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { aspectRatio: CARD_ASPECT }]}
      >
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.7, y: 0.6 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.row}>
          <Text
            variant="label"
            numberOfLines={1}
            style={{ color: INK, fontFamily: 'Fraunces_500Medium', fontSize: 16, flexShrink: 1 }}
          >
            {card.nome}
          </Text>
          {blocked ? (
            <View style={styles.pill}>
              <Text variant="micro" style={{ color: INK, fontWeight: '700' }}>Bloqueado</Text>
            </View>
          ) : (
            <Text variant="label" style={{ color: INK, fontWeight: '700', fontStyle: 'italic', letterSpacing: 0.4 }}>
              {card.bandeira === 'visa' ? 'VISA' : 'mastercard'}
            </Text>
          )}
        </View>

        <View style={[styles.row, { alignItems: 'center' }]}>
          <View style={styles.chip} accessibilityElementsHidden importantForAccessibility="no">
            <View style={styles.chipLine} />
            <View style={[styles.chipLine, { top: '66%' }]} />
            <View style={styles.chipMid} />
          </View>
          <ContactlessPaymentIcon size={24} color={INK_SOFT} weight="regular" />
        </View>

        <View style={{ gap: 4 }}>
          <Text variant="micro" style={{ color: INK_SOFT }}>
            Disponível · {Math.round(usage)}% usado
          </Text>
          <Text
            variant="hero"
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ color: INK, fontSize: 26, lineHeight: 32, letterSpacing: -0.6, fontVariant: ['tabular-nums'] }}
          >
            {formatBRL(disponivel)}
          </Text>
        </View>

        <View style={[styles.row, { alignItems: 'flex-end' }]}>
          <View style={{ gap: 4, flexShrink: 1 }}>
            <Text variant="bodyStrong" style={{ color: INK, letterSpacing: 2, fontVariant: ['tabular-nums'] }}>
              •••• {digits}
            </Text>
            <Text variant="micro" numberOfLines={1} style={{ color: INK_SOFT, letterSpacing: 0.8 }}>
              {titular} · {validade}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text variant="micro" style={{ color: INK_SOFT }}>
              Fatura {formatBRL(fatura)}
            </Text>
            <Text variant="micro" style={{ color: INK, fontWeight: '700' }}>
              Vence dia {card.diaVencimento}
            </Text>
          </View>
        </View>

        <View style={styles.usageTrack}>
          <View style={[styles.usageFill, { width: `${Math.max(usage > 0 ? 3 : 0, usage)}%` }]} />
        </View>
      </LinearGradient>
    </View>
  )

  if (!onPress) return face

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Abrir cartão ${card.nome}`}>
      {face}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  shadow: {
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
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.3)',
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
  usageTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  usageFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
})
