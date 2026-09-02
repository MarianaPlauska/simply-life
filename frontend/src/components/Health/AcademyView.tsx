import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AcademyTodayTab } from './academy/AcademyTodayTab'
import { AcademyConfigTab } from './academy/AcademyConfigTab'
import { AcademyHistoryTab } from './academy/AcademyHistoryTab'
import { DashboardCollapsible } from '../dashboard/DashboardCollapsible'

export type AcademySubTab = 'hoje' | 'configurar' | 'historico'

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
  const subFromHash = useMemo(() => parseAcademySubTab(location.hash), [location.hash])
  const [sub, setSub] = useState<AcademySubTab>(() => subFromHash)

  const selectSub = useCallback((id: AcademySubTab) =>
  {
    setSub(id)
    navigate(`/saude#${academyHash(id)}`, { replace: true })
  }, [navigate])

  useEffect(() =>
  {
    if (subFromHash !== sub)
    {
      setSub(subFromHash)
    }
  }, [subFromHash, sub])

  return (
    <div className="space-y-4">
      <AcademyTodayTab onGoConfig={() => selectSub('configurar')} />

      <DashboardCollapsible
        title="Configurar plano"
        subtitle="Semana, mês e exercícios do dia"
        defaultOpen={sub === 'configurar'}
      >
        <AcademyConfigTab />
      </DashboardCollapsible>

      <DashboardCollapsible
        title="Histórico"
        subtitle="Sessões anteriores"
        defaultOpen={sub === 'historico'}
      >
        <AcademyHistoryTab />
      </DashboardCollapsible>
    </div>
  )
}
