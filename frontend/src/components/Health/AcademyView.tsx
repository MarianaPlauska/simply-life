import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CalendarDays, History, Play } from 'lucide-react'
import { AcademyTodayTab } from './academy/AcademyTodayTab'
import { AcademyConfigTab } from './academy/AcademyConfigTab'
import { AcademyHistoryTab } from './academy/AcademyHistoryTab'

export type AcademySubTab = 'hoje' | 'configurar' | 'historico'

const SUB_TABS: { id: AcademySubTab; label: string; short: string; Icon: typeof Play }[] = [
  { id: 'hoje', label: 'Hoje', short: 'Hoje', Icon: Play },
  { id: 'configurar', label: 'Configurar', short: 'Config', Icon: CalendarDays },
  { id: 'historico', label: 'Histórico', short: 'Hist.', Icon: History },
]

export function parseAcademySubTab(hash: string): AcademySubTab
{
  const raw = hash.replace('#', '')
  if (raw === 'academia-config' || raw === 'academia-configurar')
  {
    return 'configurar'
  }
  if (raw === 'academia-historico')
  {
    return 'historico'
  }
  return 'hoje'
}

function academyHash(sub: AcademySubTab): string
{
  if (sub === 'configurar')
  {
    return 'academia-config'
  }
  if (sub === 'historico')
  {
    return 'academia-historico'
  }
  return 'academia'
}

export function AcademyView()
{
  const location = useLocation()
  const navigate = useNavigate()
  const [sub, setSub] = useState<AcademySubTab>(() => parseAcademySubTab(location.hash))

  const selectSub = useCallback((id: AcademySubTab) =>
  {
    setSub(id)
    navigate(`/saude#${academyHash(id)}`, { replace: true })
  }, [navigate])

  useEffect(() =>
  {
    const fromHash = parseAcademySubTab(location.hash)
    if (fromHash !== sub)
    {
      setSub(fromHash)
    }
  }, [location.hash, sub])

  return (
    <div className="space-y-4">
      <nav aria-label="Seções da academia">
        <div className="flex gap-1 p-1 rounded-sl bg-chrome border border-line">
          {SUB_TABS.map(({ id, label, short, Icon }) =>
          {
            const ativo = sub === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => selectSub(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-sl text-[11px] font-mono whitespace-nowrap transition-colors ${
                  ativo
                    ? 'bg-card text-ink border border-line shadow-sm'
                    : 'text-ink-muted border border-transparent hover:text-ink'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${ativo ? 'text-accent' : ''}`} />
                <span className="sm:hidden">{short}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {sub === 'hoje' && <AcademyTodayTab onGoConfig={() => selectSub('configurar')} />}
      {sub === 'configurar' && <AcademyConfigTab />}
      {sub === 'historico' && <AcademyHistoryTab />}
    </div>
  )
}
