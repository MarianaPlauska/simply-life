import { View, StyleSheet } from 'react-native'
import Svg, { Defs, LinearGradient as SvgGradient, Rect, Stop } from 'react-native-svg'
import { formatBRL, type FinanceCard, type FinanceCardGradient } from '@simply-life/shared'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

/** Proporção ISO/IEC 7810 ID-1 (~85.6×53.98mm) */
export const CARD_ASPECT = 1.586

const SKINS: Record<FinanceCardGradient, [string, string, string]> = {
  purple: ['#4C1D95', '#312E81', '#1E1B4B'],
  obsidian: ['#3F3F46', '#27272A', '#18181B'],
  sunset: ['#CA2851', '#FF6766', '#FF8173'],
  ocean: ['#0C4A6E', '#164E63', '#042F2E'],
  mint: ['#065F46', '#134E4A', '#064E3B'],
  copper: ['#CA2851', '#A81F42', '#2A1218'],
}

type Props = {
  card: FinanceCard
  width: number
  selected?: boolean
}

/** Representação visual de cartão — referência Mercury/Copilot + web CreditCardVisual */
export function CreditCardVisual({ card, width, selected }: Props)
{
  const { colors, radius } = useTheme()
  const skin = SKINS[card.tipoGradiente ?? 'copper']
  const height = Math.round(width / CARD_ASPECT)
  const fatura = card.faturaAberta ?? 0
  const disponivel = Math.max(0, card.limite - fatura)
  const usage = card.limite > 0 ? Math.min(100, (fatura / card.limite) * 100) : 0
  const blocked = card.status === 'bloqueado'

  return (
    <View
      style={{
        width,
        borderRadius: radius.control + 4,
        overflow: 'hidden',
        opacity: blocked ? 0.72 : 1,
        borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
        borderColor: selected ? colors.finance : 'rgba(255,255,255,0.12)',
      }}
    >
      <View style={{ minHeight: height, padding: 18, justifyContent: 'space-between' }}>
        <Svg
          width="100%"
          height="100%"
          style={StyleSheet.absoluteFill}
          preserveAspectRatio="none"
        >
          <Defs>
            <SvgGradient id={`card-${card.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={skin[0]} />
              <Stop offset="55%" stopColor={skin[1]} />
              <Stop offset="100%" stopColor={skin[2]} />
            </SvgGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#card-${card.id})`} />
        </Svg>

        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }]}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="bodyStrong" style={{ color: '#FFFFFF' }}>
              {card.nome}
            </Text>
            <Text variant="micro" style={{ color: 'rgba(255,255,255,0.62)', textTransform: 'uppercase' }}>
              {card.bandeira === 'visa' ? 'Visa' : 'Mastercard'}
              {card.titular ? ` · ${card.titular}` : ''}
            </Text>
          </View>
          {blocked ? (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: 'rgba(255,180,180,0.45)',
                backgroundColor: 'rgba(0,0,0,0.25)',
              }}
            >
              <Text variant="micro" style={{ color: '#FFB4B4' }}>
                Bloqueado
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={{
            width: 42,
            height: 30,
            borderRadius: 6,
            backgroundColor: 'rgba(255,255,220,0.85)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.35)',
          }}
        />

        <Text
          variant="body"
          style={{
            color: 'rgba(255,255,255,0.92)',
            letterSpacing: 2.4,
            fontVariant: ['tabular-nums'],
          }}
        >
          {card.numeroMascarado ?? '•••• •••• •••• 0000'}
        </Text>

        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View style={{ gap: 2 }}>
              <Text variant="micro" style={{ color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>
                Limite
              </Text>
              <Text variant="section" style={{ color: '#FFFFFF' }}>
                {formatBRL(card.limite)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              <Text variant="micro" style={{ color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>
                Vence dia
              </Text>
              <Text variant="section" style={{ color: '#FFFFFF' }}>
                {String(card.diaVencimento).padStart(2, '0')}
              </Text>
            </View>
          </View>

          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="micro" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Fatura {formatBRL(fatura)}
              </Text>
              <Text variant="micro" style={{ color: 'rgba(255,255,255,0.72)' }}>
                Disp. {formatBRL(disponivel)}
              </Text>
            </View>
            <View
              style={{
                height: 6,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.14)',
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${Math.max(usage > 0 ? 4 : 0, usage)}%`,
                  height: '100%',
                  backgroundColor: usage >= 90 ? '#FFB4B4' : 'rgba(255,255,255,0.88)',
                }}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
