import { useEffect, useMemo, useCallback, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, Sun } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import {
  parseHealthRoute,
  healthSectionHash,
  cuidadosTabHash,
  type HealthSection,
  type CuidadosTab,
} from '../../lib/healthRoute'
import { HealthDiaryTab } from './HealthDiaryTab'
import { HealthCareHub } from './HealthCareHub'
import { healthHeaderSubtitle } from './healthSectionMeta'
import { PageIntro } from '../layout/PageIntro'
import {
  AXEL_CANVAS,
  AXEL_MAIN_PB_MOBILE,
  AXEL_MAIN_PT,
  AXEL_NAV_SUB_ACTIVE,
  AXEL_NAV_SUB_IDLE,
  AXEL_PAGE_GUTTER,
  AXEL_PAGE_SHELL,
  AXEL_HEALTH_TAB_BODY,
} from '../../constants/axelSurfaces'
import { BentoGridSkeleton } from '../ui/Skeleton'
import { useHealthRitualSnapshot } from '../../hooks/useHealthRitualSnapshot'

// HealthView - Hoje (cuidados fundidos) + Diário

const SECTIONS: {
  id: HealthSection
  label: string
  short: string
  Icon: typeof Sun
}[] = [
  { id: 'hoje', label: 'Hoje', short: 'Hoje', Icon: Sun },
  { id: 'diario', label: 'Diário', short: 'Diário', Icon: BookOpen },
]

export function HealthView()
{
  const location = useLocation()
  const navigate = useNavigate()
  const route = useMemo(() => parseHealthRoute(location.hash), [location.hash])
  const section = route.section === 'cuidados' ? 'hoje' : route.section
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
  const ritualSnapshot = useHealthRitualSnapshot()

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
    fetchSessaoTreinoAtiva()
    fetchSessoesTreinoHoje()
  }, [section, fetchHumorHoje, fetchHabitosStreaks, fetchSessaoTreinoAtiva, fetchSessoesTreinoHoje])

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

  const headerMeta = section === 'hoje'
    ? ritualSnapshot.allCoreDone
      ? 'Ritual de hoje completo'
      : ritualSnapshot.percent > 0
        ? `${ritualSnapshot.doneCount} cuidado${ritualSnapshot.doneCount !== 1 ? 's' : ''} registrado${ritualSnapshot.doneCount !== 1 ? 's' : ''}`
        : 'Sem pressa - o dia é seu'
    : undefined

  const headerLede = section === 'diario'
    ? 'Humor e notas - cuidados do dia ficam em Hoje'
    : section === 'hoje'
      ? healthHeaderSubtitle('hoje', cuidadosTab)
      : undefined

  const showHealthSkeleton = !sessionBooted && !userSessionReady

  return (
    <div className={`w-full min-h-0 flex flex-col ${AXEL_CANVAS} ${AXEL_MAIN_PT} ${AXEL_MAIN_PB_MOBILE}`}>
      <div className={`${AXEL_PAGE_SHELL} ${AXEL_PAGE_GUTTER} flex flex-col flex-1 min-h-0 min-w-0`}>
        <PageIntro
          title="Saúde"
          meta={headerMeta}
          lede={headerLede}
          actions={section === 'diario' ? (
            <button
              type="button"
              onClick={() => selectSection('hoje')}
              className="shrink-0 text-[12px] font-medium text-health hover:underline min-h-11 px-2"
            >
              Cuidados de hoje
            </button>
          ) : undefined}
          subNav={(
            <nav aria-label="Seções de saúde" className="-mt-0.5">
              <div className="flex gap-0.5 overflow-x-auto scrollbar-none -mx-0.5 border-b border-line">
                {SECTIONS.map(({ id, label, short, Icon }) =>
                {
                  const active = section === id
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => selectSection(id)}
                      className={`${active ? AXEL_NAV_SUB_ACTIVE : AXEL_NAV_SUB_IDLE} min-h-[40px] py-1.5`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-health' : ''}`} />
                      <span className="sm:hidden">{short}</span>
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  )
                })}
              </div>
            </nav>
          )}
        />

        <div className={`${AXEL_HEALTH_TAB_BODY} min-w-0 ${section === 'diario' ? 'space-y-4' : 'space-y-4 sm:space-y-5'}`}>
          {showHealthSkeleton ? (
            <BentoGridSkeleton variant="health" />
          ) : (
          <>
          {section === 'hoje' && (
            <HealthCareHub activeTab={cuidadosTab} onSelectTab={selectCuidadosTab} />
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
