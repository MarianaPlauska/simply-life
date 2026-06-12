import { Suspense, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileBottomNav } from './MobileBottomNav'
import { AxelGlobalHeader } from './AxelGlobalHeader'
import { AxelSystemFooter } from './AxelSystemFooter'
import { QuickCaptureModal } from '../Anotacoes/QuickCaptureModal'
import { CommandPalette } from '../ui/CommandPalette'
import { OnboardingChecklist } from '../Onboarding/OnboardingChecklist'
import { MedicationLockOverlay } from '../ui/MedicationLockOverlay'
import { BurnoutAura } from '../ui/BurnoutAura'
import { CelebrationOverlay } from '../gamification/CelebrationOverlay'
import { MentalHealthCheckIn } from '../gamification/MentalHealthCheckIn'
import { useTaskStore } from '../../store/useTaskStore'
import { useRealtimeSync } from '../../hooks/useRealtimeSync'
import { useFinanceSystemSync } from '../../hooks/useFinanceSystemSync'
import { PwaInstallBanner } from './PwaInstallBanner'
import { FinanceQuickCaptureModal } from '../Finance/FinanceQuickCaptureModal'
import { AXEL_CANVAS } from '../../constants/axelSurfaces'

// Layout global — sidebar, header, conteúdo (flex-1) e footer sticky

function PageLoader()
{
  return (
    <div className="flex items-center justify-center flex-1 min-h-[40vh]">
      <div className="w-8 h-8 rounded-sl border-2 border-line border-t-accent animate-spin" />
    </div>
  )
}

export function AppLayout()
{
  const mainRef = useRef<HTMLElement>(null)
  const location = useLocation()
  useRealtimeSync()
  useFinanceSystemSync()

  const fetchMedicamentos = useTaskStore((s) => s.fetchMedicamentos)
  const fetchTarefas = useTaskStore((s) => s.fetchTarefas)

  useEffect(() =>
  {
    fetchMedicamentos()
    fetchTarefas()
  }, [fetchMedicamentos, fetchTarefas])

  const isAcademy = location.pathname === '/foco'
  const zenFocusActive = useTaskStore((s) => s.zenFocusActive)
  const hideChrome = zenFocusActive && !isAcademy

  return (
    <>
      <MedicationLockOverlay />
      <BurnoutAura />
      <CelebrationOverlay />
      <MentalHealthCheckIn />
      <QuickCaptureModal />
      <FinanceQuickCaptureModal />
      <CommandPalette />
      <OnboardingChecklist />
      <PwaInstallBanner />
      {!isAcademy && !hideChrome && <MobileBottomNav />}

      <div className={`min-h-screen flex flex-col w-full ${isAcademy ? 'bg-black text-white' : AXEL_CANVAS}`}>
        <div className="flex flex-1 min-h-screen w-full">
          {!isAcademy && !hideChrome && <Sidebar />}
          <div className={`flex-1 flex flex-col min-w-0 min-h-screen ${isAcademy ? '' : AXEL_CANVAS}`}>
            {!isAcademy && !hideChrome && <AxelGlobalHeader />}
            <main
              ref={mainRef}
              className={`flex flex-col flex-1 min-h-0 w-full ${isAcademy ? 'px-0 pt-0 pb-0' : AXEL_CANVAS}`}
              role="main"
            >
              <div className="flex flex-col flex-1 min-h-0 w-full">
                <Suspense fallback={<PageLoader />}>
                  <Outlet />
                </Suspense>
              </div>
              {!isAcademy && !hideChrome && (
                <AxelSystemFooter className="mt-auto shrink-0 pb-[calc(1rem+5.75rem+env(safe-area-inset-bottom,0px))] md:pb-4" />
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  )
}
