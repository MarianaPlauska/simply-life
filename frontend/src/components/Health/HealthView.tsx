import { useEffect, useMemo, useCallback, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, Sun, LayoutGrid } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { useHealthRitualSnapshot } from '../../hooks/useHealthRitualSnapshot'
import {
  parseHealthRoute,
  healthSectionHash,
  cuidadosTabHash,
  type HealthSection,
  type CuidadosTab,
} from '../../lib/healthRoute'
import { HealthDiaryTab } from './HealthDiaryTab'
import { HealthTodayPanel } from './HealthTodayPanel'
import { HealthCuidadosPanel } from './HealthCuidadosPanel'
import { healthHeaderSubtitle } from './healthSectionMeta'
import { snapshotNutricaoHoje } from '../../lib/healthNutrition'
import {
  AXEL_CANVAS,
  AXEL_MAIN_PB_MOBILE,
  AXEL_MAIN_PT,
  AXEL_NAV_SUB_ACTIVE,
  AXEL_NAV_SUB_IDLE,
  AXEL_PAGE_SHELL_READING,
} from '../../constants/axelSurfaces'
import { BentoGridSkeleton } from '../ui/Skeleton'

// HealthView — hub: Hoje, Cuidados e Diário

const SECTIONS: {
  id: HealthSection
  label: string
  short: string
  Icon: typeof Sun
}[] = [
  { id: 'hoje', label: 'Hoje', short: 'Hoje', Icon: Sun },
  { id: 'cuidados', label: 'Cuidados', short: 'Cuidados', Icon: LayoutGrid },
  { id: 'diario', label: 'Diário', short: 'Diário', Icon: BookOpen },
]

export function HealthView()
{
  const location = useLocation()
  const navigate = useNavigate()
  const route = useMemo(() => parseHealthRoute(location.hash), [location.hash])
  const section = route.section
  const cuidadosTab = route.cuidados

  const selectSection = useCallback((id: HealthSection) =>
  {
    const hash = healthSectionHash(id, cuidadosTab)
    navigate(`/saude#${hash}`, { replace: true })
  }, [navigate, cuidadosTab])

  const selectCuidadosTab = useCallback((tab: CuidadosTab) =>
  {
    navigate(`/saude#${cuidadosTabHash(tab)}`, { replace: true })
  }, [navigate])

  const goFromToday = useCallback((target: string) =>
  {
    if (target === 'bem_estar' || target === 'diario')
    {
      navigate('/saude#diario', { replace: true })
      return
    }
    if (target === 'hidratacao' || target === 'alimentacao' || target === 'academia' || target === 'medicamentos')
    {
      navigate(`/saude#${cuidadosTabHash(target as CuidadosTab)}`, { replace: true })
    }
  }, [navigate])

  const fetchMedicamentos = useTaskStore((s) => s.fetchMedicamentos)
  const fetchMedicamentoTomadas = useTaskStore((s) => s.fetchMedicamentoTomadas)
  const fetchHabitos = useTaskStore((s) => s.fetchHabitos)
  const fetchHabitosStreaks = useTaskStore((s) => s.fetchHabitosStreaks)
  const fetchSessaoTreinoAtiva = useTaskStore((s) => s.fetchSessaoTreinoAtiva)
  const fetchSessoesTreinoHoje = useTaskStore((s) => s.fetchSessoesTreinoHoje)
  const fetchHumorHoje = useTaskStore((s) => s.fetchHumorHoje)
  const fetchHumorSemana = useTaskStore((s) => s.fetchHumorSemana)
  const fetchHumorMes = useTaskStore((s) => s.fetchHumorMes)
  const fetchDiarioHoje = useTaskStore((s) => s.fetchDiarioHoje)
  const fetchPromptDoDia = useTaskStore((s) => s.fetchPromptDoDia)
  const fetchEntradasRecentes = useTaskStore((s) => s.fetchEntradasRecentes)
  const userSessionReady = useTaskStore((s) => s.userSessionReady)

  const [sessionBooted, setSessionBooted] = useState(() => userSessionReady)

  useEffect(() =>
  {
    if (userSessionReady)
    {
      setSessionBooted(true)
    }
  }, [userSessionReady])

  useEffect(() =>
  {
    fetchMedicamentos()
    fetchMedicamentoTomadas()
    fetchHabitos()
  }, [fetchMedicamentos, fetchMedicamentoTomadas, fetchHabitos])

  useEffect(() =>
  {
    if (section !== 'hoje')
    {
      return
    }
    fetchHumorHoje()
    fetchHabitosStreaks()
  }, [section, fetchHumorHoje, fetchHabitosStreaks])

  useEffect(() =>
  {
    if (section !== 'cuidados')
    {
      return
    }
    fetchHabitosStreaks()
    fetchSessaoTreinoAtiva()
    fetchSessoesTreinoHoje()
  }, [section, fetchHabitosStreaks, fetchSessaoTreinoAtiva, fetchSessoesTreinoHoje])

  useEffect(() =>
  {
    if (section !== 'diario')
    {
      return
    }
    fetchHumorHoje()
    fetchHumorSemana()
    fetchHumorMes()
    fetchDiarioHoje()
    fetchPromptDoDia()
    fetchEntradasRecentes(120)
  }, [
    section,
    fetchHumorHoje,
    fetchHumorSemana,
    fetchHumorMes,
    fetchDiarioHoje,
    fetchPromptDoDia,
    fetchEntradasRecentes,
  ])

  const ritualSnapshot = useHealthRitualSnapshot()
  const habitos = useTaskStore((s) => s.habitos)
  const nut = useMemo(() => snapshotNutricaoHoje(habitos), [habitos])

  const headerLine = healthHeaderSubtitle(section, cuidadosTab, {
    ritualPct: ritualSnapshot.percent,
    ritualDone: ritualSnapshot.doneCount,
    ritualTotal: ritualSnapshot.totalApplicable,
  }, { gramas: nut.gramas, kcal: nut.kcal })

  const showHealthSkeleton = !sessionBooted && !userSessionReady

  return (
    <div className={`w-full min-h-0 flex flex-col ${AXEL_CANVAS} ${AXEL_MAIN_PT} ${AXEL_MAIN_PB_MOBILE}`}>
      <div className={`${AXEL_PAGE_SHELL_READING} px-3 sm:px-4 flex flex-col flex-1 min-h-0`}>
        <header className="space-y-2 shrink-0">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl sm:text-2xl font-display font-semibold text-ink tracking-tight">
              Saúde
            </h1>
            <p className="text-[13px] text-ink-muted leading-relaxed">
              {headerLine}
            </p>
          </div>
        </header>

        <nav
          className="mt-3"
          aria-label="Seções de saúde"
        >
          <div className="flex gap-0.5 overflow-x-auto scrollbar-none -mx-0.5">
            {SECTIONS.map(({ id, label, short, Icon }) =>
            {
              const active = section === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectSection(id)}
                  className={`${active ? AXEL_NAV_SUB_ACTIVE : AXEL_NAV_SUB_IDLE}`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-accent' : ''}`} />
                  <span className="sm:hidden">{short}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        <div className="flex-1 py-4 sm:py-5 space-y-4 sm:space-y-5 min-h-0">
          {showHealthSkeleton ? (
            <BentoGridSkeleton variant="health" />
          ) : (
          <>
          {section === 'hoje' && (
            <HealthTodayPanel onSelectTab={goFromToday} />
          )}

          {section === 'cuidados' && (
            <HealthCuidadosPanel active={cuidadosTab} onSelect={selectCuidadosTab} />
          )}

          {section === 'diario' && (
            <HealthDiaryTab />
          )}
          </>
          )}
        </div>
      </div>
    </div>
  )
}
