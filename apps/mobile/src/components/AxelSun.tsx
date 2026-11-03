import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg'
import { BRAND } from '@simply-life/ui-tokens'
import type { AxelForm } from '@simply-life/shared'

export type AxelMood = 'calm' | 'happy' | 'care' | 'sleepy' | 'party'

const LEAF = '#3E8F6E'

/**
 * Axel: um girassol com rosto de amigo. Pétalas coral (a cor de ação do app,
 * que no código se chama `axel`), rosto creme, contorno coral escuro. `care` é o rosto dos dias nublados (sobrancelha caída,
 * sorriso pequeno); `happy` fecha os olhos de alegria.
 */
export function AxelSun({
  size = 40,
  mood = 'calm',
  label = 'Axel',
  accessory = null,
  form = 'flor',
}: {
  size?: number
  mood?: AxelMood
  label?: string
  accessory?: string | null
  form?: AxelForm
})
{
  const ink = BRAND.carvao
  const petals = 12
  const face = 18.5

  if (form === 'broto')
  {
    return (
      <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityRole="image" accessibilityLabel={label}>
        <Path d="M32 58 V30" stroke={LEAF} strokeWidth={3.2} strokeLinecap="round" />
        <Ellipse cx={22} cy={40} rx={10} ry={4.5} fill={LEAF} transform="rotate(-42 22 40)" />
        <Ellipse cx={43} cy={38} rx={8} ry={3.8} fill={LEAF} transform="rotate(36 43 38)" />
        <Circle cx={32} cy={22} r={11} fill={BRAND.creme} stroke={BRAND.coralText} strokeWidth={1.4} />
        <Circle cx={28} cy={21} r={1.5} fill={ink} />
        <Circle cx={36} cy={21} r={1.5} fill={ink} />
        <Path d="M28 25 q4 3.2 8 0" fill="none" stroke={ink} strokeWidth={1.6} strokeLinecap="round" />
        <Path d="M22 54 h20 l-3 8 H25 z" fill="#C4A574" />
      </Svg>
    )
  }

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      <Path d="M32 50 v12" stroke={LEAF} strokeWidth={3} strokeLinecap="round" />
      <G>
        {Array.from({ length: petals }, (_, i) => i * (360 / petals)).map((deg) => (
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
      <Circle cx={32} cy={32} r={face} fill={BRAND.creme} stroke={BRAND.coralText} strokeWidth={1.4} />
      {form === 'girassol' ? (
        <>
          <Ellipse cx={7} cy={48} rx={14} ry={6.5} fill={LEAF} transform="rotate(-40 7 48)" />
          <Ellipse cx={57} cy={48} rx={14} ry={6.5} fill={LEAF} transform="rotate(40 57 48)" />
        </>
      ) : null}

      <Circle cx={22.5} cy={37} r={3.2} fill={BRAND.coral} opacity={0.45} />
      <Circle cx={41.5} cy={37} r={3.2} fill={BRAND.coral} opacity={0.45} />

      {mood === 'happy' || mood === 'party' ? (
        <>
          <Path d="M23.5 31.5 q3 -3.6 6 0" fill="none" stroke={ink} strokeWidth={2.2} strokeLinecap="round" />
          <Path d="M34.5 31.5 q3 -3.6 6 0" fill="none" stroke={ink} strokeWidth={2.2} strokeLinecap="round" />
          <Path d="M24 36.5 q8 9 16 0" fill="none" stroke={ink} strokeWidth={2.4} strokeLinecap="round" />
        </>
      ) : mood === 'sleepy' ? (
        <>
          <Path d="M23 31 q4 2.2 7 0" fill="none" stroke={ink} strokeWidth={2.2} strokeLinecap="round" />
          <Path d="M34 31 q4 2.2 7 0" fill="none" stroke={ink} strokeWidth={2.2} strokeLinecap="round" />
          <Path d="M28 38 q4 2 8 0" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
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
      {accessory === 'laco' ? (
        <Path d="M32 12 C27 4 18 6 22 13 C16 18 24 20 32 13 C40 20 48 18 42 13 C46 6 37 4 32 12 Z" fill={BRAND.coralText} />
      ) : null}
      {accessory === 'oculos' ? (
        <>
          <Circle cx={26} cy={31} r={5.2} fill="none" stroke={ink} strokeWidth={1.7} />
          <Circle cx={39} cy={31} r={5.2} fill="none" stroke={ink} strokeWidth={1.7} />
          <Path d="M31.2 31 h2.6 M16 31 H20.8 M44.2 31 H49" fill="none" stroke={ink} strokeWidth={1.6} strokeLinecap="round" />
        </>
      ) : null}
      {accessory === 'cachecol' ? (
        <Path d="M16 44 h32 v7 H24 v7 h-8 z" fill={BRAND.coral} />
      ) : null}
      {accessory === 'chapeu' ? (
        <>
          <Ellipse cx={32} cy={16} rx={16} ry={4.2} fill={BRAND.coralText} />
          <Path d="M23 16 v-7 q9 -7 18 0 v7" fill={BRAND.coral} />
        </>
      ) : null}
      {accessory === 'capa' ? (
        <Path d="M10 44 h44 l8 16 H2 z" fill={BRAND.coralText} />
      ) : null}
    </Svg>
  )
}
