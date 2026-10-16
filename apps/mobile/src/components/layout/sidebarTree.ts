import { useMemo } from 'react'
import { useModules } from '../../hooks/useModules'
import { HEALTH_MAIN_TABS, visibleHealthTabs } from '../health/healthNav'
import { visibleFinanceTabs } from '../finance/financeNav'
import { useSectionNavStore, type SectionArea } from '../../store/sectionNavStore'

/** Um subitem da barra lateral: abre a página do pai já na aba certa. */
export type SidebarChild = {
  key: string
  label: string
  /** abas a ligar ao clicar (área → aba) */
  set: Partial<Record<SectionArea, string>>
  /** aba que marca o subitem como aberto */
  isOn: (active: Partial<Record<SectionArea, string>>) => boolean
  /** id da aba publicada pela página, para mostrar o contador */
  countOf?: { area: SectionArea; id: string }
}

const one = (area: SectionArea, value: string, fallback: string): Pick<SidebarChild, 'set' | 'isOn' | 'countOf'> => ({
  set: { [area]: value },
  isOn: (a) => (a[area] ?? fallback) === value,
  countOf: { area, id: value },
})

/**
 * Árvore fixa da barra lateral da web: cada área com seus subitens, sempre
 * visíveis (não depende de a página já ter sido aberta). Some o que o módulo desligou.
 */
export function useSidebarTree(): Partial<Record<SectionArea, SidebarChild[]>>
{
  const modules = useModules()
  const tasksOn = modules.on('tasks')
  return useMemo(() =>
  {
    const kanbanDefault = tasksOn ? 'lista' : 'rotina'
    const kanban: SidebarChild[] = ([
      ['lista', 'Lista'],
      ['feitas', 'Feitas'],
      ['rotina', 'Rotina'],
      ['board', 'Prazos'],
      ['calendario', 'Calendário'],
      ['gantt', 'Gantt'],
      ['pastas', 'Pastas'],
      ['relatorios', 'Relatórios'],
    ] as const)
      .filter(([id]) => (id === 'rotina' ? modules.on('routine') : tasksOn))
      .map(([id, label]) => ({ key: `kanban-${id}`, label, ...one('kanban', id, kanbanDefault) }))

    const healthTabs = visibleHealthTabs(modules.on)
    const saude: SidebarChild[] = healthTabs.map((t) => ({
      key: `saude-${t.id}`,
      label: t.label,
      ...one('saude', t.id, healthTabs[0]?.id ?? HEALTH_MAIN_TABS[0].id),
    }))

    const finTabs = visibleFinanceTabs(modules.on)
    const finDefault = finTabs[0]?.id ?? 'inicio'
    const finOn = (id: string) => finTabs.some((t) => t.id === id)
    const tabOf = (a: Partial<Record<SectionArea, string>>) => a.financeiro ?? finDefault
    const contasOf = (a: Partial<Record<SectionArea, string>>) => a.financeiroContas ?? 'conta'
    const financeiro: SidebarChild[] = []
    if (finOn('inicio')) financeiro.push({ key: 'fin-carteira', label: 'Carteira', ...one('financeiro', 'inicio', finDefault) })
    if (finOn('movimentos')) financeiro.push({ key: 'fin-extrato', label: 'Extrato', ...one('financeiro', 'movimentos', finDefault) })
    if (finOn('contas'))
    {
      financeiro.push({
        key: 'fin-contas',
        label: 'Contas',
        set: { financeiro: 'contas', financeiroContas: modules.on('spend') ? 'conta' : 'faturas' },
        isOn: (a) => tabOf(a) === 'contas' && contasOf(a) !== 'cartoes',
      })
      if (modules.on('cards'))
      {
        financeiro.push({
          key: 'fin-cartoes',
          label: 'Cartões',
          set: { financeiro: 'contas', financeiroContas: 'cartoes' },
          isOn: (a) => tabOf(a) === 'contas' && contasOf(a) === 'cartoes',
        })
      }
    }
    if (finOn('analise')) financeiro.push({ key: 'fin-analise', label: 'Análise', ...one('financeiro', 'analise', finDefault) })

    return { kanban, saude, financeiro }
  }, [modules, tasksOn])
}

/** Liga as abas do subitem (a página lê do mesmo estado ao abrir). */
export function applySidebarChild(child: SidebarChild): void
{
  const { setActive } = useSectionNavStore.getState()
  for (const [area, value] of Object.entries(child.set)) setActive(area as SectionArea, value as string)
}
