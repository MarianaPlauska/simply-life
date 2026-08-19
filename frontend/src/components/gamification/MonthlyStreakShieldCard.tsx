import { toast } from 'sonner'
import { Shield, Gift } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_BTN_PRIMARY,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

// Escudo grátis 1×/mês — estilo Duolingo Streak Freeze

export function MonthlyStreakShieldCard()
{
  const streakFreezes = useTaskStore((s) => s.streakFreezes)
  const canClaim = useTaskStore((s) => s.canClaimMonthlyStreakFreeze)
  const claimMonthly = useTaskStore((s) => s.claimMonthlyStreakFreeze)
  const purchaseStreakFreeze = useTaskStore((s) => s.purchaseStreakFreeze)
  const getTotalXp = useTaskStore((s) => s.getTotalXp)

  const available = canClaim()

  const handleClaim = () =>
  {
    const res = claimMonthly()
    if (res.ok)
    {
      toast.success(res.message)
    }
    else
    {
      toast.info(res.message)
    }
  }

  const handleBuy = async () =>
  {
    const res = await purchaseStreakFreeze()
    if (res.ok)
    {
      toast.success(res.message)
    }
    else
    {
      toast.error(res.message)
    }
  }

  return (
    <section className={AXEL_BORDERLESS_PANEL} aria-labelledby="shield-title">
      <header className="flex items-center gap-2 mb-3">
        <Shield size={14} className="text-sky-400" />
        <h2 id="shield-title" className={AXEL_SECTION_TITLE}>
          Escudos de ofensiva
        </h2>
        <span className={`ml-auto font-mono text-[11px] tabular-nums ${AXEL_TEXT_SECONDARY}`}>
          {streakFreezes} na mochila
        </span>
      </header>

      <p className={`text-[13px] mb-4 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
        Um escudo absorve 1 dia perdido sem zerar sua sequência. Você ganha{' '}
        <strong className="text-ink">1 grátis por mês</strong> — extras custam 500 XP.
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          disabled={!available}
          onClick={handleClaim}
          className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-sl font-mono text-[11px] uppercase tracking-wide border transition-colors ${
            available
              ? `${AXEL_BTN_PRIMARY} border-transparent`
              : 'border-line bg-chrome/40 text-ink-muted cursor-not-allowed'
          }`}
        >
          <Gift size={14} />
          {available ? 'Resgatar grátis do mês' : 'Grátis já resgatado'}
        </button>
        <button
          type="button"
          onClick={() => void handleBuy()}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-sl font-mono text-[11px] uppercase tracking-wide border border-line bg-chrome/30 hover:bg-chrome/50 text-ink transition-colors"
        >
          <Shield size={14} className="text-sky-400" />
          Comprar · 500 XP ({getTotalXp()} disp.)
        </button>
      </div>
    </section>
  )
}
