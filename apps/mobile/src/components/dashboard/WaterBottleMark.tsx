import Svg, { Path, Rect, ClipPath, Defs, G } from 'react-native-svg'

type Props = {
  size?: number
  fillPct: number
  fill: string
  stroke: string
}

/** Garrafa com nível de água — preenchimento de baixo para cima. */
export function WaterBottleMark({ size = 44, fillPct, fill, stroke }: Props)
{
  const pct = Math.max(0, Math.min(100, fillPct))
  const bodyTop = 18
  const bodyH = 42
  const fillH = (bodyH * pct) / 100
  const fillY = bodyTop + bodyH - fillH

  return (
    <Svg width={size} height={size * 1.45} viewBox="0 0 48 72">
      <Defs>
        <ClipPath id="bottle-body">
          <Path d="M16 18 C16 16 18 14 22 14 L26 14 C30 14 32 16 32 18 L32 58 C32 62 28 64 24 64 C20 64 16 62 16 58 Z" />
        </ClipPath>
      </Defs>
      <Path
        d="M20 6 H28 C29.2 6 30 6.8 30 8 V12 H18 V8 C18 6.8 18.8 6 20 6 Z"
        fill={stroke}
        opacity={0.85}
      />
      <Path
        d="M16 18 C16 16 18 14 22 14 L26 14 C30 14 32 16 32 18 L32 58 C32 62 28 64 24 64 C20 64 16 62 16 58 Z"
        fill="none"
        stroke={stroke}
        strokeWidth={2.2}
      />
      <G clipPath="url(#bottle-body)">
        <Rect x="14" y={fillY} width="20" height={fillH} fill={fill} />
      </G>
    </Svg>
  )
}
