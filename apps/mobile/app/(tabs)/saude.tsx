import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Screen, SubNavTabs } from '../../src/ui'
import { useDataStore } from '../../src/store/dataStore'
import { useAuthStore } from '../../src/store/authStore'
import { ScreenIntro } from '../../src/components/dashboard/ScreenIntro'
import { TabShell } from '../../src/components/dashboard/TabShell'
import { HealthTodayTab } from '../../src/components/health/HealthTodayTab'
import { HealthCuidadosTab } from '../../src/components/health/HealthCuidadosTab'
import { HealthDiaryTab } from '../../src/components/health/HealthDiaryTab'
import { HealthApoioTab } from '../../src/components/health/HealthApoioTab'
import {
  HEALTH_SECTION_INTRO,
  type HealthSection,
  type CuidadosTab,
} from '../../src/components/health/healthNav'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useModules } from '../../src/hooks/useModules'
import { visibleHealthTabs, visibleCuidadosTabs } from '../../src/components/health/healthNav'
import { useSectionState, usePublishSectionTabs } from '../../src/store/sectionNavStore'
import { useWebDesk } from '../../src/components/dashboard/web/webBox'

export default function SaudeScreen()
{
  const params = useLocalSearchParams<{ section?: string; care?: string }>()
  const [section, setSection] = useSectionState<HealthSection>('saude', 'diario')
  const [cuidadosTab, setCuidadosTab] = useState<CuidadosTab>('hidratacao')
  const loading = useDataStore((s) => s.loading)
  const refreshAll = useDataStore((s) => s.refreshAll)
  const isGuest = useAuthStore((s) => s.isGuest)
  const { space } = useTheme()
  const intro = HEALTH_SECTION_INTRO[section]
  const modules = useModules()
  const mainTabs = visibleHealthTabs(modules.on)
  const careTabs = visibleCuidadosTabs(modules.on)
  // computador: as abas principais ficam na barra lateral, como subitens de Saúde
  const desk = useWebDesk()
  usePublishSectionTabs('saude', mainTabs)

  // aba escolhida que ficou escondida: vai para a primeira que aparece
  useEffect(() =>
  {
    if (mainTabs.length && !mainTabs.some((t) => t.id === section)) setSection(mainTabs[0].id)
    if (careTabs.length && !careTabs.some((t) => t.id === cuidadosTab)) setCuidadosTab(careTabs[0].id)
  }, [mainTabs, careTabs, section, cuidadosTab])

  useEffect(() =>
  {
    if (
      params.section === 'cuidados'
      || params.section === 'hoje'
      || params.section === 'diario'
      || params.section === 'apoio'
    )
    {
      setSection(params.section)
    }
    const care = params.care as CuidadosTab | undefined
    if (care === 'hidratacao' || care === 'alimentacao' || care === 'academia' || care === 'medicamentos' || care === 'sono')
    {
      setCuidadosTab(care)
      setSection('cuidados')
    }
  }, [params.section, params.care])

  const goCuidados = (tab: CuidadosTab) =>
  {
    setCuidadosTab(tab)
    setSection('cuidados')
  }

  const goApoio = () => setSection('apoio')
  const goDiario = () => setSection('diario')

  return (
    <Screen
      wide
      scroll
      refreshing={loading}
      onRefresh={() => void refreshAll({ isGuest })}
    >
      <TabShell>
        {/* Título fixo "Saúde": a aba interna já diz Diário/Hoje/Cuidados/Apoio. */}
        <ScreenIntro title="Saúde" subtitle={intro.subtitle} />

        {desk ? null : (
          <SubNavTabs
            accent="health"
            tabs={mainTabs}
            value={section}
            onChange={setSection}
          />
        )}

        <View style={{ marginTop: space.xs }}>
          {section === 'hoje' && (
            <HealthTodayTab
              onGoCuidados={goCuidados}
              onGoApoio={goApoio}
              onGoDiario={goDiario}
            />
          )}
          {section === 'cuidados' && (
            <HealthCuidadosTab tab={cuidadosTab} onChange={setCuidadosTab} tabs={careTabs} />
          )}
          {section === 'diario' && <HealthDiaryTab />}
          {section === 'apoio' && <HealthApoioTab />}
        </View>
      </TabShell>
    </Screen>
  )
}
