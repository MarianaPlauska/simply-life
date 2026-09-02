import { AXEL_MOOD } from '../../design/identityTokens'

type MoodValue = 1 | 2 | 3 | 4 | 5

interface AxelMoodFaceProps
{
  level: number
  /** Presença da Home — sobrepõe o humor 1–5 quando informada */
  presence?: 'calmo' | 'atento' | 'positivo'
  size?: number
  className?: string
  title?: string
  /** Sem a brasa — seletor de humor, não a voz do AXEL */
  quiet?: boolean
}

const MOUTH: Record<MoodValue, string> = {
  1: 'M8 16.8 C10.2 14.2 13.8 14.2 16 16.8',
  2: 'M8 16.2 C10.4 15 13.6 15 16 16.2',
  3: 'M8.2 16 H15.8',
  4: 'M8 15.4 C10.4 17.6 13.6 17.6 16 15.4',
  5: 'M7.4 15.1 C10.2 18.4 13.8 18.4 16.6 15.1',
}

function clampMood(level: number): MoodValue
{
  if (level <= 1) return 1
  if (level >= 5) return 5
  return level as MoodValue
}

const PRESENCE_MOUTH: Record<'calmo' | 'atento' | 'positivo', MoodValue> = {
  calmo: 4,
  atento: 3,
  positivo: 5,
}

/** Rosto-assinatura do AXEL — brasa laranja em todos os estados, sem emoji */
export function AxelMoodFace({
  level,
  presence,
  size = AXEL_MOOD.sizeInVoice,
  className = '',
  title,
  quiet = false,
}: AxelMoodFaceProps)
{
  const mood = presence
    ? PRESENCE_MOUTH[presence]
    : clampMood(Math.round(level))
  const label = presence
    ? (presence === 'calmo' ? 'Calmo' : presence === 'atento' ? 'Atento' : 'Positivo')
    : (Object.values(AXEL_MOOD.states).find((s) => s.value === mood)?.label ?? 'Sereno')
  const eyeY = mood <= 2 ? 10.4 : 10
  const eyeR = mood === 1 ? 0.95 : 1.15

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 ${quiet ? 'text-ink-muted' : 'text-axel'} ${className}`}
      role="img"
      aria-label={title ?? `AXEL: ${label}`}
    >
      <rect
        x="3.25"
        y="3.25"
        width="17.5"
        height="17.5"
        rx={AXEL_MOOD.faceRadius}
        stroke="currentColor"
        strokeWidth={AXEL_MOOD.stroke}
      />
      <circle cx="9.2" cy={eyeY} r={eyeR} fill="currentColor" />
      <circle cx="14.8" cy={eyeY} r={eyeR} fill="currentColor" />
      <path
        d={MOUTH[mood]}
        stroke="currentColor"
        strokeWidth={AXEL_MOOD.stroke}
        strokeLinecap="round"
      />
      {!quiet && (
        <circle cx="18.2" cy="18.2" r="2.1" fill="var(--sl-axel)" />
      )}
    </svg>
  )
}
