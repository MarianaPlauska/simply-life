import { View, type ViewStyle } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { BRAND, COLOR_LIGHT } from '@simply-life/ui-tokens'
import { Text } from '../../ui'
import { AxelSun } from '../AxelSun'

const C = COLOR_LIGHT

/** Anel de progresso pequeno, só para a prévia */
function MiniRing({ pct, size = 40 }: { pct: number; size?: number })
{
  const r = (size - 6) / 2
  const len = 2 * Math.PI * r
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={C.hairline} strokeWidth={4} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={BRAND.coralText}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${len * pct} ${len}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  )
}

const card: ViewStyle = {
  backgroundColor: C.elevated,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: C.hairline,
  padding: 10,
}

/**
 * Prévia do produto na landing desktop, desenhada com os tokens do app
 * (nada de imagem com texto): a Home no celular, o Axel sugerindo um passo
 * e um amigo mandando força, o "nunca sozinho" da marca.
 */
export function LoginProductPreview()
{
  return (
    <View
      style={{ height: 360, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* celular */}
      <View
        style={{
          width: 196,
          height: 352,
          borderRadius: 32,
          padding: 7,
          backgroundColor: BRAND.carvao,
          shadowColor: '#000',
          shadowOpacity: 0.35,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 12 },
        }}
      >
        <View style={{ flex: 1, borderRadius: 26, backgroundColor: C.canvas, overflow: 'hidden', padding: 12, gap: 7 }}>
          <View style={{ alignSelf: 'center', width: 54, height: 14, borderRadius: 999, backgroundColor: BRAND.carvao, marginBottom: 2 }} />
          <Text variant="caption" style={{ color: C.inkMuted, fontSize: 9, lineHeight: 12 }}>sexta, 2 de outubro</Text>
          <Text variant="hero" style={{ color: C.ink, fontSize: 19, lineHeight: 22, letterSpacing: -0.4 }}>Bom dia, Ana</Text>

          <View style={[card, { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.featureBg, borderColor: C.featureBg }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="caption" style={{ color: C.inkMuted, fontSize: 9, lineHeight: 12 }}>Progresso de hoje</Text>
              <Text variant="bodyStrong" style={{ color: C.ink, fontSize: 13, lineHeight: 16 }}>2 de 5 feitas</Text>
            </View>
            <MiniRing pct={0.4} />
          </View>

          <View style={[card, { gap: 6 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AxelSun size={30} mood="care" />
              <View style={{ flex: 1 }}>
                <Text variant="caption" style={{ color: BRAND.coralText, fontSize: 9, lineHeight: 12, fontWeight: '700' }}>AXEL</Text>
                <Text variant="bodyStrong" style={{ color: C.ink, fontSize: 11, lineHeight: 14 }}>Dia nublado? Vamos de leve.</Text>
              </View>
            </View>
            <View style={{ backgroundColor: C.surface, borderRadius: 10, padding: 8, gap: 2 }}>
              <Text variant="caption" style={{ color: C.health, fontSize: 9, lineHeight: 12, fontWeight: '700' }}>Um passo</Text>
              <Text variant="body" style={{ color: C.ink, fontSize: 11, lineHeight: 14 }}>Beber um copo d'água</Text>
            </View>
          </View>

          <View style={[card, { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }]}>
            {[0.35, 0.5, 0.65, 1, 0.65].map((o, i) => (
              <View
                key={i}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  backgroundColor: i === 3 ? BRAND.coral : C.surface,
                  borderWidth: i === 3 ? 0 : 1,
                  borderColor: C.hairline,
                  opacity: i === 3 ? 1 : o + 0.2,
                }}
              />
            ))}
          </View>
        </View>
      </View>

      {/* amigo mandando força */}
      <View
        style={{
          marginLeft: -18,
          marginTop: 150,
          width: 190,
          backgroundColor: C.elevated,
          borderRadius: 18,
          padding: 12,
          gap: 6,
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 10 },
          transform: [{ rotate: '3deg' }],
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <AxelSun size={28} mood="happy" />
          <Text variant="bodyStrong" style={{ color: C.ink, fontSize: 12, lineHeight: 16, flex: 1 }}>
            Bia te mandou um girassol
          </Text>
        </View>
        <Text variant="body" style={{ color: C.inkMuted, fontSize: 11, lineHeight: 15 }}>
          "Tô contigo hoje. Um passo de cada vez."
        </Text>
      </View>
    </View>
  )
}
