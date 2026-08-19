import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { addOneWaterCup } from '../../lib/waterHydrationActions'
import { CaptureActionSheet } from './CaptureActionSheet'
import { CaptureTaskSheet } from './CaptureTaskSheet'

interface CaptureContextValue
{
  sheetOpen: boolean
  toggleSheet: () => void
  closeSheet: () => void
  openTask: () => void
  openFinance: () => void
  addWater: () => Promise<void>
  savingWater: boolean
}

const CaptureContext = createContext<CaptureContextValue | null>(null)

const CAPTURE_HMR_FALLBACK: CaptureContextValue = {
  sheetOpen: false,
  toggleSheet: () => undefined,
  closeSheet: () => undefined,
  openTask: () => undefined,
  openFinance: () => undefined,
  addWater: async () => undefined,
  savingWater: false,
}

export function useCapture()
{
  const ctx = useContext(CaptureContext)
  if (!ctx)
  {
    // Fast Refresh pode remontar o botão antes do provider após um HMR quebrado
    return CAPTURE_HMR_FALLBACK
  }
  return ctx
}

export function CaptureProvider({ children }: { children: ReactNode })
{
  const setFinanceOpen = useTaskStore((s) => s.setFinanceQuickCaptureOpen)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [savingWater, setSavingWater] = useState(false)

  const closeSheet = useCallback(() => setSheetOpen(false), [])
  const toggleSheet = useCallback(() => setSheetOpen((v) => !v), [])

  const openTask = useCallback(() =>
  {
    setSheetOpen(false)
    setTaskOpen(true)
  }, [])

  const openFinance = useCallback(() =>
  {
    setSheetOpen(false)
    setFinanceOpen(true)
  }, [setFinanceOpen])

  const addWater = useCallback(async () =>
  {
    setSavingWater(true)
    try
    {
      const copos = await addOneWaterCup()
      if (copos == null)
      {
        toast.error('Não foi possível registrar a água')
        return
      }
      toast.success(`+1 copo · ${copos} hoje`)
      setSheetOpen(false)
    }
    catch
    {
      toast.error('Não foi possível registrar a água')
    }
    finally
    {
      setSavingWater(false)
    }
  }, [])

  const value = useMemo(
    () => ({
      sheetOpen,
      toggleSheet,
      closeSheet,
      openTask,
      openFinance,
      addWater,
      savingWater,
    }),
    [sheetOpen, toggleSheet, closeSheet, openTask, openFinance, addWater, savingWater],
  )

  return (
    <CaptureContext.Provider value={value}>
      {children}
      <CaptureActionSheet
        open={sheetOpen}
        savingWater={savingWater}
        onClose={closeSheet}
        onTask={openTask}
        onFinance={openFinance}
        onWater={() => void addWater()}
      />
      <CaptureTaskSheet open={taskOpen} onClose={() => setTaskOpen(false)} />
    </CaptureContext.Provider>
  )
}
