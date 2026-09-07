import Svg, { Line, Path } from 'react-native-svg'

type Props = {
  size?: number
  color?: string
}

/** Semicírculo no horizonte com raios — símbolo de meteorologia da referência. */
export function SunsetGlyph({ size = 56, color = '#2A2622' }: Props)
{
  const s = size
  const cx = s / 2
  const horizonY = s * 0.68
  const r = s * 0.22
  const stroke = Math.max(1.5, s * 0.038)
  const rayInner = r + s * 0.05
  const rayOuter = r + s * 0.16

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {[-72, -48, -24, 0, 24, 48, 72].map((degFromUp) =>
      {
        const theta = ((degFromUp - 90) * Math.PI) / 180
        const cos = Math.cos(theta)
        const sin = Math.sin(theta)
        return (
          <Line
            key={degFromUp}
            x1={cx + cos * rayInner}
            y1={horizonY + sin * rayInner}
            x2={cx + cos * rayOuter}
            y2={horizonY + sin * rayOuter}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        )
      })}
      <Path
        d={`M ${cx - r} ${horizonY} A ${r} ${r} 0 0 0 ${cx + r} ${horizonY} Z`}
        fill={color}
      />
      <Line
        x1={s * 0.08}
        y1={horizonY}
        x2={s * 0.92}
        y2={horizonY}
        stroke={color}
        strokeWidth={stroke * 1.15}
        strokeLinecap="round"
      />
    </Svg>
  )
}
