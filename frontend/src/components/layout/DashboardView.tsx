import { useEffect, useRef } from 'react'
import { useTaskStore } from '../../store/useTaskStore'
import { Skeleton } from '../dashboard/DashboardPrimitives'
import { HolisticAnalyticsSection } from '../dashboard/HolisticAnalyticsSection'
import { DashboardCriticalTasksPreview } from '../dashboard/DashboardCriticalTasksPreview'
import { DashboardCommandBar } from '../dashboard/DashboardCommandBar'
import { DashboardModulesRegistry } from '../dashboard/DashboardModulesRegistry'
import { SystemStatePanel } from '../dashboard/SystemStatePanel'
import { QuickStatsBar } from '../dashboard/QuickStatsBar'
import { FinancasTabelaDensa } from '../dashboard/FinancasTabelaDensa'
import { InboxIACard } from '../dashboard/InboxIACard'
import { AtividadeRecenteCard } from '../dashboard/AtividadeRecenteCard'
import { DashboardAxelFocus } from '../dashboard/DashboardAxelFocus'
import { DashboardPanel } from '../dashboard/DashboardPanel'

// Dashboard enterprise — comando denso, módulos, operação e analytics em sequência

function getGreeting(): string
{
  const h = new Date().getHours()
  if (h < 5) return 'Boa madrugada'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function DashboardView()
{
  const fetchDashboard = useTaskStore((s) => s.fetchDashboard)
  const fetchTarefas = useTaskStore((s) => s.fetchTarefas)
  const fetchNotificacoes = useTaskStore((s) => s.fetchNotificacoes)
  const fetchPreferencias = useTaskStore((s) => s.fetchPreferencias)
  const fetchPalavrasChave = useTaskStore((s) => s.fetchPalavrasChave)
  const checkGoogleStatus = useTaskStore((s) => s.checkGoogleStatus)
  const runFinanceCheck = useTaskStore((s) => s.runFinanceCheck)
  const runHealthCheck = useTaskStore((s) => s.runHealthCheck)
  const fetchGamificacaoStats = useTaskStore((s) => s.fetchGamificacaoStats)
  const fetchInbox = useTaskStore((s) => s.fetchInbox)

  const resumo = useTaskStore((s) => s.dashboardResumo)
  const loading = useTaskStore((s) => s.dashboardLoading)
  const userProfile = useTaskStore((s) => s.userProfile)

  const hasFetched = useRef(false)

  useEffect(() =>
  {
    if (hasFetched.current) return
    hasFetched.current = true
    const init = async () =>
    {
      await Promise.all([fetchDashboard(), fetchTarefas()])
      await Promise.all([fetchNotificacoes(), fetchPreferencias(), fetchGamificacaoStats?.()])
      await Promise.all([fetchPalavrasChave(), checkGoogleStatus(), fetchInbox?.()])
      await runFinanceCheck()
      await runHealthCheck()
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const greeting = getGreeting()
  const firstName = (userProfile?.nome || '').split(' ')[0] || 'Convidado'

  if (loading && !resumo)
  {
    return (
      <div className="w-full flex flex-col">
        <div className="h-40 bg-chrome border-b border-line animate-pulse" />
        <div className="px-4 lg:px-8 py-4 max-w-[1600px] mx-auto w-full flex flex-col gap-3">
          <Skeleton className="h-28 w-full" />
          <div className="grid grid-cols-12 gap-3">
            <Skeleton className="col-span-8 h-64" />
            <Skeleton className="col-span-4 h-64" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col flex-1 min-h-0">
      <DashboardCommandBar greeting={greeting} firstName={firstName} />

      <div className="px-4 lg:px-8 py-4 max-w-[1600px] mx-auto w-full flex flex-col gap-4 flex-1">
        <DashboardModulesRegistry />

        {/* 01 — Comando: execução + carga + próximo passo AXEL */}
        <div className="grid grid-cols-12 gap-3 items-stretch">
          <div className="col-span-12 xl:col-span-5 min-w-0">
            <DashboardCriticalTasksPreview />
          </div>
          <div className="col-span-12 md:col-span-6 xl:col-span-3 min-w-0">
            <SystemStatePanel />
          </div>
          <div className="col-span-12 md:col-span-6 xl:col-span-4 min-w-0">
            <DashboardAxelFocus />
          </div>
        </div>

        {/* 02 — Indicadores vitais */}
        <DashboardPanel section="02" title="Indicadores" subtitle="Saúde · finanças · ritmo diário" noPadding>
          <div className="p-4">
            <QuickStatsBar />
          </div>
        </DashboardPanel>

        {/* 03 — Finanças + inteligência + auditoria */}
        <div className="grid grid-cols-12 gap-3 items-stretch">
          <div className="col-span-12 lg:col-span-6 min-w-0">
            <DashboardPanel section="03" title="Finanças" subtitle="Movimentação recente" className="h-full">
              <FinancasTabelaDensa embedded />
            </DashboardPanel>
          </div>
          <div className="col-span-12 lg:col-span-3 min-w-0">
            <InboxIACard />
          </div>
          <div className="col-span-12 lg:col-span-3 min-w-0">
            <AtividadeRecenteCard />
          </div>
        </div>

        {/* 04 — Analytics holístico */}
        <HolisticAnalyticsSection borderless />
      </div>
    </div>
  )
}

/** @deprecated use DashboardView */
export const DashboardHome = DashboardView
