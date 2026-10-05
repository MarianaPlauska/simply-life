// Símbolo da marca SunFy, "tudo se volta pra você". Mesmo desenho do app (apps/mobile/src/components/SunFyMark.tsx)

// só cores do app: pétalas creme e menta, centro coral
const CREME = '#EEF2F0'
const PETROLEO = '#1F3A3D'
const MENTA = '#B9CFCA'
const TEAL = '#389387'
const CORAL = '#E8734A'

const PETAL = 'M32 24 C24.5 18.5 24.5 6 32 6 C39.5 6 39.5 18.5 32 24 Z'
const ANGLES = Array.from({ length: 8 }, (_, i) => i * 45)

/** Oito pétalas viradas para o centro coral (a pessoa), em viewBox 64. `onLight` troca creme e menta por petróleo e verde-azulado. */
export function SunFyMarkShapes({ onLight = false }: { onLight?: boolean })
{
  const odd = onLight ? PETROLEO : CREME
  const even = onLight ? TEAL : MENTA
  return (
    <>
      {ANGLES.map((deg, i) => (
        <path key={deg} d={PETAL} fill={i % 2 ? even : odd} transform={`rotate(${deg} 32 32)`} />
      ))}
      <circle cx="32" cy="32" r="6.5" fill={CORAL} />
    </>
  )
}
