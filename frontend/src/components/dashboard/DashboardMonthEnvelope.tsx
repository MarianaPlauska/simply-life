import { DashboardFinanceGlance } from './DashboardFinanceGlance'

/** Envelope do mês na Home (mobile) — no desktop já está na rail */
export function DashboardMonthEnvelope()
{
  return (
    <div className="xl:hidden">
      <DashboardFinanceGlance />
    </div>
  )
}
