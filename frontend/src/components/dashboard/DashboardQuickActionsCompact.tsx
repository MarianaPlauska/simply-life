import { Smile, Droplets, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCapture } from '../capture/CaptureProvider'

export function DashboardQuickActionsCompact()
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
    <div className="flex justify-center gap-4 py-1" role="group" aria-label="Atalhos rápidos">
      <IconAction icon={Smile} label="Humor" onClick={openMood} tone="health" />
      <IconAction icon={Droplets} label="Água" busy={savingWater} onClick={() => void addWater()} tone="health" />
      <IconAction icon={Wallet} label="Lançar" onClick={openFinance} tone="finance" />
    </div>
  )
}

function IconAction({
  icon: Icon,
  label,
  tone,
  busy,
  onClick,
}: {
  icon: typeof Smile
  label: string
  tone: 'health' | 'finance'
  busy?: boolean
  onClick: () => void
})
{
  const ring = tone === 'finance' ? 'border-finance/25 text-finance' : 'border-health/25 text-health'

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={`flex flex-col items-center gap-1 min-w-[4.5rem] min-h-[44px] disabled:opacity-50`}
    >
      <span className={`inline-flex items-center justify-center w-11 h-11 rounded-sl border ${ring} bg-chrome/50`}>
        <Icon size={18} strokeWidth={1.75} aria-hidden />
      </span>
      <span className="text-[11px] font-medium text-ink-muted">
        {busy ? '…' : label}
      </span>
    </button>
  )
}
