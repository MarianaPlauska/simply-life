import Svg, { Circle, G, Path, Rect } from 'react-native-svg'
import { BRAND } from '@simply-life/ui-tokens'

/** Verde-azulado da paleta de gráficos: a pétala par quando o fundo é claro */
const TEAL = '#389387'

const PETAL = 'M32 24 C24.5 18.5 24.5 6 32 6 C39.5 6 39.5 18.5 32 24 Z'
const ANGLES = Array.from({ length: 8 }, (_, i) => i * 45)

/**
 * Símbolo da marca SunFy, "tudo se volta pra você": oito pétalas viradas
 * para o centro, e o centro coral é a pessoa. Como os girassóis que se viram
 * uns para os outros nos dias nublados.
 *
 * Só cores do app: pétalas creme e menta, centro coral (o único ponto de ação).
 * `tile`: quadro petróleo do ícone do app. Sem ele, `onLight` troca creme e menta
 * por petróleo e verde-azulado para manter contraste sobre fundo claro.
 */
export function SunFyMark({
  size = 40,
  tile,
  onLight,
  label = 'SunFy',
}: {
  size?: number
  tile?: boolean
  onLight?: boolean
  label?: string
})
{
  const light = !tile && onLight
  const odd = light ? BRAND.petroleo : BRAND.creme
  const even = light ? TEAL : BRAND.menta
  const scale = tile ? 0.82 : 1
  const off = (1 - scale) * 32

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityRole="image" accessibilityLabel={label}>
      {tile ? <Rect width="64" height="64" rx="14" fill={BRAND.petroleo} /> : null}
      <G transform={`translate(${off} ${off}) scale(${scale})`}>
        {ANGLES.map((deg, i) => (
          <Path key={deg} d={PETAL} fill={i % 2 ? even : odd} transform={`rotate(${deg} 32 32)`} />
        ))}
        <Circle cx={32} cy={32} r={6.5} fill={BRAND.coral} />
      </G>
    </Svg>
  )
}
