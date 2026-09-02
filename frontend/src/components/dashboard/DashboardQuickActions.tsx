import { Smile, Droplets, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCapture } from '../capture/CaptureProvider'
import { PREMIUM_BTN_MODULE } from '../../constants/axelSurfaces'

/** Humor, água e lançar — botões premium, horizontal no desktop */
export function DashboardQuickActions()
{
  const navigate = useNavigate()
  const { openFinance, addWater, savingWater } = useCapture()

  const openMood = () =>
  {
    const el = document.getElementById('dashboard-wellbeing')
    if (el)
    {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    navigate('/saude')
  }

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-0.5 snap-x -mx-1 px-1 md:overflow-visible md:flex-row md:mx-0 md:px-0 md:gap-3"
      role="group"
      aria-label="Ações rápidas"
    >
      <QuickAction
        icon={Smile}
        label="Humor"
        tone="health"
        onClick={openMood}
      />
      <QuickAction
        icon={Droplets}
        label="Água"
        tone="health"
        busy={savingWater}
        onClick={() => void addWater()}
      />
      <QuickAction
        icon={Wallet}
        label="Lançar"
        tone="finance"
        onClick={openFinance}
      />
    </div>
  )
}

interface QuickActionProps
{
  icon: typeof Smile
  label: string
  tone: 'health' | 'finance'
  busy?: boolean
  onClick: () => void
}

function QuickAction({ icon: Icon, label, tone, busy, onClick }: QuickActionProps)
{
  const ink = tone === 'finance' ? 'text-finance' : 'text-health'
  const btnClass = PREMIUM_BTN_MODULE[tone]

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`${btnClass} shrink-0 snap-start min-w-[6.75rem] md:flex-1 disabled:opacity-50`}
    >
      <Icon className={ink} size={18} strokeWidth={1.75} aria-hidden />
      <span>{busy ? '…' : label}</span>
    </button>
  )
}
