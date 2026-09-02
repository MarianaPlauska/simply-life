import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { addOneWaterCup } from '../../lib/waterHydrationActions'
import { captureIntentFromPath } from '../../lib/captureIntent'
import { DumpSheet } from './DumpSheet'
import { CaptureTaskSheet } from './CaptureTaskSheet'

interface CaptureContextValue
{
  sheetOpen: boolean
  toggleSheet: () => void
  closeSheet: () => void
  openDump: (seed?: string) => void
  openFinance: () => void
  addWater: () => Promise<void>
  savingWater: boolean
}

const CaptureContext = createContext<CaptureContextValue | null>(null)

const CAPTURE_HMR_FALLBACK: CaptureContextValue = {
  sheetOpen: false,
  toggleSheet: () => undefined,
  closeSheet: () => undefined,
  openDump: () => undefined,
  openFinance: () => undefined,
  addWater: async () => undefined,
  savingWater: false,
}

export function useCapture()
{
  const ctx = useContext(CaptureContext)
  if (!ctx)
  {
    return CAPTURE_HMR_FALLBACK
  }
  return ctx
}

export function CaptureProvider({ children }: { children: ReactNode })
{
  const location = useLocation()
  const intent = captureIntentFromPath(location.pathname)
  const setFinanceOpen = useTaskStore((s) => s.setFinanceQuickCaptureOpen)
  const financeOpen = useTaskStore((s) => s.isFinanceQuickCaptureOpen)
  const setNoteOpen = useTaskStore((s) => s.setQuickCaptureOpen)
  const noteOpen = useTaskStore((s) => s.isQuickCaptureOpen)
  const [dumpOpen, setDumpOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [seed, setSeed] = useState('')
  const [savingWater, setSavingWater] = useState(false)

  const closeSheet = useCallback(() =>
  {
    setDumpOpen(false)
    setTaskOpen(false)
    setFinanceOpen(false)
    setNoteOpen(false)
    setSeed('')
  }, [setFinanceOpen, setNoteOpen])

  const toggleSheet = useCallback(() =>
  {
    if (intent === 'finance')
    {
      const next = !financeOpen
      setDumpOpen(false)
      setTaskOpen(false)
      setNoteOpen(false)
      setFinanceOpen(next)
      return
    }
    if (intent === 'task')
    {
      const next = !taskOpen
      setDumpOpen(false)
      setFinanceOpen(false)
      setNoteOpen(false)
      setTaskOpen(next)
      return
    }
    if (intent === 'note')
    {
      const next = !noteOpen
      setDumpOpen(false)
      setTaskOpen(false)
      setFinanceOpen(false)
      setNoteOpen(next)
      return
    }
    setTaskOpen(false)
    setFinanceOpen(false)
    setNoteOpen(false)
    setDumpOpen((v) => !v)
  }, [intent, financeOpen, taskOpen, noteOpen, setFinanceOpen, setNoteOpen])

  const openDump = useCallback((nextSeed?: string) =>
  {
    setSeed(nextSeed ?? '')
    setTaskOpen(false)
    setFinanceOpen(false)
    setNoteOpen(false)
    setDumpOpen(true)
  }, [setFinanceOpen, setNoteOpen])

  const openFinance = useCallback(() =>
  {
    setDumpOpen(false)
    setTaskOpen(false)
    setNoteOpen(false)
    setFinanceOpen(true)
  }, [setFinanceOpen, setNoteOpen])

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

  const sheetOpen = dumpOpen || taskOpen || financeOpen || noteOpen

  const value = useMemo(
    () => ({
      sheetOpen,
      toggleSheet,
      closeSheet,
      openDump,
      openFinance,
      addWater,
      savingWater,
    }),
    [sheetOpen, toggleSheet, closeSheet, openDump, openFinance, addWater, savingWater],
  )

  return (
    <CaptureContext.Provider value={value}>
      {children}
      <DumpSheet
        open={dumpOpen}
        seed={seed}
        onClose={() =>
        {
          setDumpOpen(false)
          setSeed('')
        }}
        onFinance={openFinance}
        onWater={addWater}
        savingWater={savingWater}
      />
      <CaptureTaskSheet
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
      />
    </CaptureContext.Provider>
  )
}
