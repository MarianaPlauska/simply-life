import { Suspense, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileBottomNav } from './MobileBottomNav'
import { AxelGlobalHeader } from './AxelGlobalHeader'
import { AxelSystemFooter } from './AxelSystemFooter'
import { QuickCaptureModal } from '../Anotacoes/QuickCaptureModal'
import { CommandPalette } from '../ui/CommandPalette'
import { OnboardingChecklist } from '../Onboarding/OnboardingChecklist'
import { AxelSystemGuideIntro } from '../axel/AxelSystemGuideIntro'
import { MedicationLockOverlay } from '../ui/MedicationLockOverlay'
import { BurnoutAura } from '../ui/BurnoutAura'
import { CelebrationOverlay } from '../gamification/CelebrationOverlay'
import { useTaskStore } from '../../store/useTaskStore'
import { useRealtimeSync } from '../../hooks/useRealtimeSync'
import { useFinanceSystemSync } from '../../hooks/useFinanceSystemSync'
import { useFinanceBillKanbanSync } from '../../hooks/useFinanceBillKanbanSync'
import { useMedicationScheduledNotifications } from '../../hooks/useMedicationScheduledNotifications'
import { usePwaBillNotifications } from '../../hooks/usePwaBillNotifications'
import { usePushSubscription } from '../../hooks/usePushSubscription'
import { useHealthPushNotifications } from '../../hooks/useHealthPushNotifications'
import { useHealthDayRollover } from '../../hooks/useHealthDayRollover'
import { PwaInstallBanner } from './PwaInstallBanner'
import { NotificationPermissionPrompt } from './NotificationPermissionPrompt'
import { FinanceQuickCaptureModal } from '../Finance/FinanceQuickCaptureModal'
import { NewTransactionModal } from '../Finance/NewTransactionModal'
import { AxelLoader } from '../ui/AxelLoader'
import { AXEL_CANVAS } from '../../constants/axelSurfaces'

// Layout global — sidebar, header, conteúdo (flex-1) e footer sticky

function PageLoader()
{
  return (
    <div className="flex items-center justify-center flex-1 min-h-[40vh]">
      <AxelLoader />
    </div>
  )
}

function GlobalNewTransactionModal()
{
  const isOpen = useTaskStore((s) => s.isNewTransactionModalOpen)
  const setOpen = useTaskStore((s) => s.setNewTransactionModalOpen)

  return (
    <NewTransactionModal
      isOpen={isOpen}
      onClose={() => setOpen(false)}
    />
  )
}

export function AppLayout()
{
  const mainRef = useRef<HTMLElement>(null)
  const location = useLocation()
  useRealtimeSync()
  useFinanceSystemSync()
  useFinanceBillKanbanSync()
  useMedicationScheduledNotifications()
  usePushSubscription()
  useHealthPushNotifications()
  usePwaBillNotifications()
  useHealthDayRollover()

  const reconcileCosmeticUnlocks = useTaskStore((s) => s.reconcileCosmeticUnlocks)
  const userStats = useTaskStore((s) => s.userStats)
  const streakCount = useTaskStore((s) => s.streakCount)

  useEffect(() =>
  {
    void reconcileCosmeticUnlocks()
  }, [reconcileCosmeticUnlocks, userStats?.level, streakCount])

  useEffect(() =>
  {
    const level = userStats?.level ?? 1
    void import('../../lib/axelTrail').then(({ buildLevelUnlockPatch }) =>
    {
      const prefs = useTaskStore.getState().workspacePrefs
      const patch = buildLevelUnlockPatch(level, prefs)
      if (patch)
      {
        void useTaskStore.getState().patchWorkspacePrefs(patch)
      }
    })
  }, [userStats?.level])

  const fetchMedicamentos = useTaskStore((s) => s.fetchMedicamentos)
  const fetchHabitos = useTaskStore((s) => s.fetchHabitos)
  const fetchTarefas = useTaskStore((s) => s.fetchTarefas)
  const userSessionReady = useTaskStore((s) => s.userSessionReady)

  useEffect(() =>
  {
    if (!userSessionReady) return

    void (async () =>
    {
      await fetchMedicamentos()
      await fetchHabitos()
      await fetchTarefas()
      const fetchNotificacoes = useTaskStore.getState().fetchNotificacoes
      await fetchNotificacoes()
    })()
  }, [fetchMedicamentos, fetchHabitos, fetchTarefas, userSessionReady])

  const zenFocusActive = useTaskStore((s) => s.zenFocusActive)
  const hideChrome = zenFocusActive

  return (
    <>
      <MedicationLockOverlay />
      <BurnoutAura />
      <CelebrationOverlay />
      <QuickCaptureModal />
      <FinanceQuickCaptureModal />
      <GlobalNewTransactionModal />
      <CommandPalette />
      <OnboardingChecklist />
      <AxelSystemGuideIntro />
      <PwaInstallBanner />
      <NotificationPermissionPrompt />
      {!hideChrome && <MobileBottomNav />}

      <div className={`min-h-screen flex flex-col w-full ${AXEL_CANVAS}`}>
        <div className="flex flex-1 min-h-screen w-full">
          {!hideChrome && <Sidebar />}
          <div className={`flex-1 flex flex-col min-w-0 min-h-screen ${AXEL_CANVAS}`}>
            {!hideChrome && <AxelGlobalHeader />}
            <main
              ref={mainRef}
              className={`flex flex-col flex-1 min-h-0 w-full ${AXEL_CANVAS}`}
              role="main"
            >
              <div className="flex flex-col flex-1 min-h-0 w-full">
                <Suspense fallback={<PageLoader />}>
                  <Outlet />
                </Suspense>
              </div>
              {!hideChrome && (
                <AxelSystemFooter
                  className={`mt-auto shrink-0 ${location.pathname.startsWith('/kanban') ? 'hidden md:block' : ''} pb-[calc(1rem+5.75rem+env(safe-area-inset-bottom,0px))] md:pb-4`}
                />
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  )
}
