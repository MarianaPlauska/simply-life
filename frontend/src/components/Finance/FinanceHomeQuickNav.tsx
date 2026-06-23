import { BookOpen, Table2, Wallet } from 'lucide-react'
import type { PlannerLeafTab } from '../../lib/financePlannerNav'

interface FinanceHomeQuickNavProps
{
  onNavigate: (tab: PlannerLeafTab) => void
}

const ITEMS: { id: PlannerLeafTab; label: string; icon: typeof BookOpen }[] = [
  { id: 'diario', label: 'Diário', icon: BookOpen },
  { id: 'tabela', label: 'Lista', icon: Wallet },
  { id: 'planilha', label: 'Planilha', icon: Table2 },
]

/** Atalhos para movimentos e análise — sempre no topo do Início */
export function FinanceHomeQuickNav({ onNavigate }: FinanceHomeQuickNavProps)
{
  return (
    <nav
      className="flex gap-0.5 overflow-x-auto scrollbar-none -mx-0.5"
      aria-label="Atalhos de movimentos"
    >
      {ITEMS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onNavigate(id)}
          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sl font-mono text-[10px] uppercase tracking-wide transition-colors text-ink-muted border border-transparent hover:bg-chrome hover:text-ink"
        >
          <Icon className="w-3 h-3" strokeWidth={1.75} />
          {label}
        </button>
      ))}
    </nav>
  )
}
