import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { FinanceMonthNavBounds } from '../../lib/financeMonthOutlook'
import type { PlannerLeafTab } from '../../lib/financePlannerNav'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const VIEW_FORMATS: { id: PlannerLeafTab; label: string }[] = [
  { id: 'diario', label: 'Diário' },
  { id: 'tabela', label: 'Lista' },
  { id: 'planilha', label: 'Planilha' },
]

interface FinanceViewMenuProps
{
  monthOffset: number
  monthBounds: FinanceMonthNavBounds
  monthLabel: string
  dayKey: string
  activeLeaf: PlannerLeafTab
  showFormats: boolean
  onSelectToday: () => void
  onSelectThisMonth: () => void
  onSelectMonth: (offset: number) => void
  onSelectDay: (dayKey: string) => void
  onSelectFormat: (leaf: PlannerLeafTab) => void
}

function todayKey(): string
{
  return new Date().toISOString().slice(0, 10)
}

function triggerLabel(input: {
  monthOffset: number
  monthLabel: string
  dayKey: string
  activeLeaf: PlannerLeafTab
  showFormats: boolean
}): string
{
  if (input.showFormats && input.activeLeaf === 'diario')
  {
    return input.dayKey === todayKey() ? 'Hoje' : input.dayKey.split('-').reverse().join('/')
  }
  if (input.monthOffset === 0)
  {
    return 'Este mês'
  }
  return input.monthLabel.split(' ')[0] ?? input.monthLabel
}

export function FinanceViewMenu({
  monthOffset,
  monthBounds,
  monthLabel,
  dayKey,
  activeLeaf,
  showFormats,
  onSelectToday,
  onSelectThisMonth,
  onSelectMonth,
  onSelectDay,
  onSelectFormat,
}: FinanceViewMenuProps)
{
  const [open, setOpen] = useState(false)
  const label = triggerLabel({ monthOffset, monthLabel, dayKey, activeLeaf, showFormats })

  const months = useMemo(() =>
  {
    const now = new Date()
    const list: { offset: number; label: string }[] = []
    for (let o = monthBounds.minOffset; o <= monthBounds.maxOffset; o++)
    {
      const d = new Date(now.getFullYear(), now.getMonth() + o, 1)
      list.push({ offset: o, label: MONTHS_SHORT[d.getMonth()] })
    }
    return list
  }, [monthBounds.minOffset, monthBounds.maxOffset])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 min-h-[44px] px-2.5 rounded-sl text-[13px] font-sans text-ink border border-line hover:bg-chrome"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        Ver: {label}
        <ChevronDown className={`w-3.5 h-3.5 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-20 cursor-default"
            aria-label="Fechar menu de visualização"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 z-30 mt-1 w-[min(18rem,calc(100vw-1.5rem))] rounded-sl border border-line bg-card shadow-sl p-3 space-y-3"
            role="dialog"
            aria-label="Período e visualização"
          >
          <div>
            <p className={`font-mono text-[9px] uppercase mb-1.5 ${AXEL_TEXT_SECONDARY}`}>Período</p>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() =>
                {
                  onSelectToday()
                  setOpen(false)
                }}
                className={`min-h-[44px] px-2.5 rounded-sl text-[12px] ${dayKey === todayKey() && monthOffset === 0 && (!showFormats || activeLeaf === 'diario') ? `font-semibold ${AXEL_TEXT_PRIMARY} bg-chrome` : AXEL_TEXT_SECONDARY}`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() =>
                {
                  onSelectThisMonth()
                  setOpen(false)
                }}
                className={`min-h-[44px] px-2.5 rounded-sl text-[12px] ${monthOffset === 0 && (!showFormats || activeLeaf !== 'diario') ? `font-semibold ${AXEL_TEXT_PRIMARY} bg-chrome` : AXEL_TEXT_SECONDARY}`}
              >
                Este mês
              </button>
            </div>
            {months.length > 1 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {months.map((m) => (
                  <button
                    key={m.offset}
                    type="button"
                    onClick={() =>
                    {
                      onSelectMonth(m.offset)
                      setOpen(false)
                    }}
                    className={`min-h-[44px] px-2 rounded-sl font-mono text-[10px] uppercase ${m.offset === monthOffset ? `font-semibold ${AXEL_TEXT_PRIMARY} bg-chrome` : AXEL_TEXT_SECONDARY}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}
            <label className={`block mt-2 font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
              Outra data
              <input
                type="date"
                value={dayKey}
                onChange={(e) =>
                {
                  if (!e.target.value) return
                  onSelectDay(e.target.value)
                  setOpen(false)
                }}
                className="mt-1 w-full min-h-[44px] rounded-sl border border-line bg-card px-2 text-[13px] text-ink"
              />
            </label>
          </div>
          {showFormats && (
            <div className="border-t border-line pt-2">
              <p className={`font-mono text-[9px] uppercase mb-1.5 ${AXEL_TEXT_SECONDARY}`}>Visualização</p>
              <div className="flex flex-wrap gap-1">
                {VIEW_FORMATS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() =>
                    {
                      onSelectFormat(f.id)
                      setOpen(false)
                    }}
                    className={`min-h-[44px] px-2.5 rounded-sl text-[12px] ${activeLeaf === f.id ? `font-semibold ${AXEL_TEXT_PRIMARY} bg-chrome` : AXEL_TEXT_SECONDARY}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        </>
      )}
    </div>
  )
}
