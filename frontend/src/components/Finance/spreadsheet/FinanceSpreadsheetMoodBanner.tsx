import { Link } from 'react-router-dom'
import type { SpreadsheetMoodState } from '../../../lib/financeSpreadsheetMood'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../../constants/axelSurfaces'

interface FinanceSpreadsheetMoodBannerProps
{
  moodState: SpreadsheetMoodState
  periodLabel: string
  compact?: boolean
  billAlertCount?: number
  billAlertHint?: string
  billAlertHref?: string
}

/** Status do caixa. Texto, sem mascote. */
export function FinanceSpreadsheetMoodBanner({
  moodState,
  periodLabel,
  compact = false,
  billAlertCount = 0,
  billAlertHint,
  billAlertHref,
}: FinanceSpreadsheetMoodBannerProps)
{
  const copy = billAlertHint ?? moodState.detail

  return (
    <section className="sl-voice p-3" aria-label="Situação do caixa">
      <p className="sl-eyebrow text-finance">
        AXEL · {periodLabel}
      </p>
      <p className={`font-display text-[15px] leading-snug mt-1 ${AXEL_TEXT_PRIMARY}`}>
        {moodState.headline}
      </p>
      <p className={`${compact ? 'text-[12px] line-clamp-2' : 'text-[13px]'} mt-1 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
        {copy}
      </p>
      {billAlertCount > 0 && billAlertHref && (
        <Link
          to={billAlertHref}
          className="inline-block mt-2 text-[12px] font-semibold text-finance hover:underline"
        >
          {billAlertCount} conta{billAlertCount !== 1 ? 's' : ''} em 48h
        </Link>
      )}
    </section>
  )
}
