// Rotas da página Saúde — seção principal + subaba de cuidados (hash retrocompatível)

export type HealthSection = 'hoje' | 'cuidados' | 'diario' | 'bem_estar'

export type CuidadosTab = 'hidratacao' | 'alimentacao' | 'academia' | 'medicamentos'

export interface HealthRoute
{
  section: HealthSection
  cuidados: CuidadosTab
}

const CUIDADOS_TABS = new Set<string>(['hidratacao', 'alimentacao', 'academia', 'medicamentos'])

export function isCuidadosTab(raw: string): raw is CuidadosTab
{
  return CUIDADOS_TABS.has(raw)
}

export function parseHealthRoute(hash: string): HealthRoute
{
  const raw = hash.replace('#', '')

  if (!raw || raw === 'hoje')
  {
    return { section: 'hoje', cuidados: 'hidratacao' }
  }
  if (raw === 'diario')
  {
    return { section: 'diario', cuidados: 'hidratacao' }
  }
  if (raw === 'bem_estar')
  {
    return { section: 'bem_estar', cuidados: 'hidratacao' }
  }
  if (raw.startsWith('medicamentos'))
  {
    return { section: 'cuidados', cuidados: 'medicamentos' }
  }
  if (raw.startsWith('academia'))
  {
    return { section: 'cuidados', cuidados: 'academia' }
  }
  if (isCuidadosTab(raw))
  {
    return { section: 'cuidados', cuidados: raw }
  }

  return { section: 'hoje', cuidados: 'hidratacao' }
}

export function healthSectionHash(section: HealthSection, cuidados: CuidadosTab): string
{
  if (section === 'hoje')
  {
    return 'hoje'
  }
  if (section === 'diario')
  {
    return 'diario'
  }
  if (section === 'bem_estar')
  {
    return 'bem_estar'
  }
  return cuidados
}

export function cuidadosTabHash(tab: CuidadosTab): string
{
  return tab
}
