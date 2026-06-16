import { Link } from 'react-router-dom'
import { FinanceMoodMascot } from './FinanceMoodMascot'
import type { SpreadsheetMoodState } from '../../../lib/financeSpreadsheetMood'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../../constants/axelSurfaces'

interface FinanceSpreadsheetMoodBannerProps
{
  moodState: SpreadsheetMoodState
  periodLabel: string
  /** Faixa compacta — melhor em desktop e abas globais */
  compact?: boolean
  billAlertCount?: number
  billAlertHint?: string
  billAlertHref?: string
}

export function FinanceSpreadsheetMoodBanner({
  moodState,
  periodLabel,
  compact = false,
  billAlertCount = 0,
  billAlertHint,
  billAlertHref,
}: FinanceSpreadsheetMoodBannerProps)
{
  const toneBorder = moodState.mood === 'great'
    ? 'border-concluido/35 bg-concluido/8'
    : moodState.mood === 'ok'
      ? 'border-line bg-card'
      : moodState.mood === 'tight'
        ? 'border-atencao/35 bg-atencao/8'
        : 'border-urgente/35 bg-urgente/8'

  return (
    <div className={`flex items-center gap-2 sm:gap-3 rounded-sl border ${toneBorder} ${
      compact ? 'p-2 sm:p-2.5' : 'p-3 sm:p-4 items-start'
    }`}>
      {billAlertCount > 0 && billAlertHref ? (
        <Link to={billAlertHref} className="shrink-0" aria-label="Ver faturas urgentes">
          <FinanceMoodMascot
            mood={moodState.mood}
            headline={moodState.headline}
            size={compact ? 'sm' : 'lg'}
            showLabel={false}
            billAlertCount={billAlertCount}
          />
        </Link>
      ) : (
        <FinanceMoodMascot
          mood={moodState.mood}
          headline={moodState.headline}
          size={compact ? 'sm' : 'lg'}
          showLabel={false}
          billAlertCount={billAlertCount}
        />
      )}
      <div className={`min-w-0 flex-1 ${compact ? '' : 'pt-1'}`}>
        <p className={`font-mono text-[8px] sm:text-[9px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
          AXEL · {periodLabel}
        </p>
        <p className={`${compact ? 'text-[12px]' : 'text-sm'} font-medium mt-0.5 ${AXEL_TEXT_PRIMARY}`}>
          {moodState.headline}
        </p>
        {!compact && (
          <p className={`text-[12px] mt-1 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
            {moodState.detail}
          </p>
        )}
        {compact && (
          <p className={`text-[10px] mt-0.5 leading-snug line-clamp-2 md:line-clamp-1 ${AXEL_TEXT_SECONDARY}`}>
            {billAlertHint ?? moodState.detail}
          </p>
        )}
      </div>
    </div>
  )
}
