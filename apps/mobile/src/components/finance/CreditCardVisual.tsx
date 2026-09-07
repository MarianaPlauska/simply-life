import { View, StyleSheet, Pressable } from 'react-native'
import Svg, { Defs, LinearGradient as SvgGradient, Rect, Stop } from 'react-native-svg'
import { Ionicons } from '@expo/vector-icons'
import { formatBRL, type FinanceCard, type FinanceCardGradient } from '@simply-life/shared'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

/** Proporção próxima ao card balance das referências (um pouco mais alto) */
export const CARD_ASPECT = 1.55

/** Skins no preto/cobre das referências Cryptora + Card Balance */
const SKINS: Record<FinanceCardGradient, [string, string, string]> = {
  purple: ['#2A2438', '#1A1624', '#0B0B0B'],
  obsidian: ['#2A2A2C', '#161618', '#0B0B0B'],
  sunset: ['#E8734A', '#C45A32', '#3D1E14'],
  ocean: ['#1E3A4A', '#122430', '#0B0B0B'],
  mint: ['#1E3A32', '#142822', '#0B0B0B'],
  copper: ['#E8734A', '#C45A32', '#2A160E'],
}

type Props = {
  card: FinanceCard
  width: number
  selected?: boolean
  onPress?: () => void
}

/**
 * Cartão estilo “Card Balance”: valor grande, chip, titular e finais.
 */
export function CreditCardVisual({ card, width, selected, onPress }: Props)
{
  const { radius } = useTheme()
  const skin = SKINS[card.tipoGradiente ?? 'copper']
  const height = Math.round(width / CARD_ASPECT)
  const fatura = card.faturaAberta ?? 0
  const disponivel = Math.max(0, card.limite - fatura)
  const usage = card.limite > 0 ? Math.min(100, (fatura / card.limite) * 100) : 0
  const blocked = card.status === 'bloqueado'
  const digits = (card.numeroMascarado || '•••• 0000').replace(/\s/g, '').slice(-4)
  const titular = card.titular?.trim() || card.nome

  const shell = (
    <View
      style={{
        width,
        borderRadius: radius.control + 6,
        overflow: 'hidden',
        opacity: blocked ? 0.72 : 1,
        borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
        borderColor: selected ? 'rgba(232,115,74,0.85)' : 'rgba(255,255,255,0.08)',
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 6,
      }}
    >
      <View style={{ minHeight: height, padding: 16, justifyContent: 'space-between' }}>
        <Svg
          width="100%"
          height="100%"
          style={StyleSheet.absoluteFill}
          preserveAspectRatio="none"
        >
          <Defs>
            <SvgGradient id={`card-${card.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={skin[0]} />
              <Stop offset="48%" stopColor={skin[1]} />
              <Stop offset="100%" stopColor={skin[2]} />
            </SvgGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#card-${card.id})`} />
        </Svg>

        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
          ]}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text
            variant="caption"
            style={{ color: 'rgba(255,255,255,0.78)', fontWeight: '600', letterSpacing: 0.2 }}
          >
            Saldo do cartão
          </Text>
          {blocked ? (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: 'rgba(0,0,0,0.35)',
                borderWidth: 1,
                borderColor: 'rgba(255,180,180,0.45)',
              }}
            >
              <Text variant="micro" style={{ color: '#FFB4B4' }}>
                Bloqueado
              </Text>
            </View>
          ) : (
            <Text variant="micro" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {Math.round(usage)}% usado
            </Text>
          )}
        </View>

        <View style={{ gap: 4, marginTop: 8 }}>
          <Text
            variant="hero"
            style={{
              color: '#FFFFFF',
              fontSize: 26,
              letterSpacing: -0.6,
              lineHeight: 30,
            }}
          >
            {formatBRL(disponivel)}
          </Text>
          <Text variant="caption" style={{ color: 'rgba(255,255,255,0.72)' }}>
            Fatura {formatBRL(fatura)} · limite {formatBRL(card.limite)}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: 18,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View
              style={{
                width: 40,
                height: 30,
                borderRadius: 6,
                backgroundColor: 'rgba(255,255,220,0.88)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.35)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="hardware-chip-outline" size={18} color="#5C4034" />
            </View>
            <View style={{ gap: 2, flex: 1, minWidth: 0 }}>
              <Text variant="micro" style={{ color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>
                Titular
              </Text>
              <Text variant="bodyStrong" style={{ color: '#FFFFFF' }} numberOfLines={1}>
                {titular}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 2 }}>
            <Text variant="micro" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {card.bandeira === 'visa' ? 'Visa' : 'Mastercard'}
            </Text>
            <Text
              variant="bodyStrong"
              style={{ color: '#FFFFFF', letterSpacing: 1.6, fontVariant: ['tabular-nums'] }}
            >
              ···· {digits}
            </Text>
          </View>
        </View>

        <View
          style={{
            marginTop: 14,
            height: 5,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.18)',
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${Math.max(usage > 0 ? 4 : 0, usage)}%`,
              height: '100%',
              backgroundColor: usage >= 90 ? '#FFB4B4' : 'rgba(255,255,255,0.92)',
            }}
          />
        </View>
      </View>
    </View>
  )

  if (!onPress) return shell

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Abrir cartão ${card.nome}`}
    >
      {shell}
    </Pressable>
  )
}
