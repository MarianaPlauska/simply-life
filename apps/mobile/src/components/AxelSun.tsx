import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg'
import { BRAND } from '@simply-life/ui-tokens'

export type AxelMood = 'calm' | 'happy' | 'care'

const PETALS = Array.from({ length: 12 }, (_, i) => i * 30)

/**
 * Axel: um girassol com rosto de amigo. Pétalas coral (a cor de ação do app,
 * que no código se chama `axel`), rosto creme, contorno coral escuro. `care` é o rosto dos dias nublados (sobrancelha caída,
 * sorriso pequeno); `happy` fecha os olhos de alegria.
 */
export function AxelSun({
  size = 40,
  mood = 'calm',
  label = 'Axel',
}: {
  size?: number
  mood?: AxelMood
  label?: string
})
{
  const ink = BRAND.carvao

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      <G>
        {PETALS.map((deg) => (
          <Ellipse
            key={deg}
            cx={32}
            cy={9.5}
            rx={5.6}
            ry={9}
            fill={BRAND.coral}
            stroke={BRAND.coralText}
            strokeWidth={1}
            transform={`rotate(${deg} 32 32)`}
          />
        ))}
      </G>
      <Circle cx={32} cy={32} r={18.5} fill={BRAND.creme} stroke={BRAND.coralText} strokeWidth={1.4} />

      <Circle cx={22.5} cy={37} r={3.2} fill={BRAND.coral} opacity={0.45} />
      <Circle cx={41.5} cy={37} r={3.2} fill={BRAND.coral} opacity={0.45} />

      {mood === 'happy' ? (
        <>
          <Path d="M23.5 31.5 q3 -3.6 6 0" fill="none" stroke={ink} strokeWidth={2.2} strokeLinecap="round" />
          <Path d="M34.5 31.5 q3 -3.6 6 0" fill="none" stroke={ink} strokeWidth={2.2} strokeLinecap="round" />
          <Path d="M25 37.5 q7 7.5 14 0" fill="none" stroke={ink} strokeWidth={2.4} strokeLinecap="round" />
        </>
      ) : (
        <>
          <Circle cx={26.5} cy={30.5} r={2.3} fill={ink} />
          <Circle cx={37.5} cy={30.5} r={2.3} fill={ink} />
          <Circle cx={27.3} cy={29.7} r={0.7} fill="#FFFFFF" />
          <Circle cx={38.3} cy={29.7} r={0.7} fill="#FFFFFF" />
          {mood === 'care' ? (
            <>
              <Path d="M23.5 25.8 l5 -1.6" fill="none" stroke={ink} strokeWidth={1.6} strokeLinecap="round" />
              <Path d="M40.5 25.8 l-5 -1.6" fill="none" stroke={ink} strokeWidth={1.6} strokeLinecap="round" />
              <Path d="M28 39 q4 2.6 8 0" fill="none" stroke={ink} strokeWidth={2.2} strokeLinecap="round" />
            </>
          ) : (
            <Path d="M26 37 q6 5.5 12 0" fill="none" stroke={ink} strokeWidth={2.4} strokeLinecap="round" />
          )}
        </>
      )}
    </Svg>
  )
}
