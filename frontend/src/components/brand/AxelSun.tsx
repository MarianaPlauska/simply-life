// Axel: girassol com rosto de amigo. Mesmo desenho do app mobile (apps/mobile/src/components/AxelSun.tsx)

export type AxelSunMood = 'calm' | 'happy' | 'care'

// só cores do app: pétalas coral, rosto creme, contorno coral escuro
const CORAL = '#E8734A'
const CORAL_TEXTO = '#A84B27'
const CREME = '#EEF2F0'
const INK = '#1E1C1A'

const PETALS = Array.from({ length: 12 }, (_, i) => i * 30)

interface AxelSunProps
{
  size?: number
  mood?: AxelSunMood
  className?: string
  /** Texto para leitor de tela; sem ele o desenho é decorativo */
  title?: string
}

/** Desenho em viewBox 64; use dentro de outro SVG via <AxelSunShapes /> */
export function AxelSunShapes({ mood = 'calm' }: { mood?: AxelSunMood })
{
  return (
    <>
      {PETALS.map((deg) => (
        <ellipse
          key={deg}
          cx="32"
          cy="9.5"
          rx="5.6"
          ry="9"
          fill={CORAL}
          stroke={CORAL_TEXTO}
          strokeWidth="1"
          transform={`rotate(${deg} 32 32)`}
        />
      ))}
      <circle cx="32" cy="32" r="18.5" fill={CREME} stroke={CORAL_TEXTO} strokeWidth="1.4" />
      <circle cx="22.5" cy="37" r="3.2" fill={CORAL} opacity="0.45" />
      <circle cx="41.5" cy="37" r="3.2" fill={CORAL} opacity="0.45" />
      {mood === 'happy' ? (
        <>
          <path d="M23.5 31.5 q3 -3.6 6 0" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M34.5 31.5 q3 -3.6 6 0" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M25 37.5 q7 7.5 14 0" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="26.5" cy="30.5" r="2.3" fill={INK} />
          <circle cx="37.5" cy="30.5" r="2.3" fill={INK} />
          <circle cx="27.3" cy="29.7" r="0.7" fill="#FFFFFF" />
          <circle cx="38.3" cy="29.7" r="0.7" fill="#FFFFFF" />
          {mood === 'care' ? (
            <>
              <path d="M23.5 25.8 l5 -1.6" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
              <path d="M40.5 25.8 l-5 -1.6" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
              <path d="M28 39 q4 2.6 8 0" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
            </>
          ) : (
            <path d="M26 37 q6 5.5 12 0" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
          )}
        </>
      )}
    </>
  )
}

export function AxelSun({ size = 40, mood = 'calm', className = '', title }: AxelSunProps)
{
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={`shrink-0 ${className}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <AxelSunShapes mood={mood} />
    </svg>
  )
}
