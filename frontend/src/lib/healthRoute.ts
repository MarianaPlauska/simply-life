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
  if (raw === 'bem_estar' || raw === 'bem-estar')
  {
    return { section: 'diario', cuidados: 'hidratacao' }
  }
  if (raw.startsWith('medicamentos'))
  {
    return { section: 'hoje', cuidados: 'medicamentos' }
  }
  if (raw.startsWith('academia'))
  {
    return { section: 'hoje', cuidados: 'academia' }
  }
  if (isCuidadosTab(raw))
  {
    return { section: 'hoje', cuidados: raw }
  }

  return { section: 'hoje', cuidados: 'hidratacao' }
}

export function healthSectionHash(section: HealthSection, cuidados: CuidadosTab): string
{
  if (section === 'diario' || section === 'bem_estar')
  {
    return 'diario'
  }
  if (section === 'cuidados')
  {
    return cuidados
  }
  if (cuidados !== 'hidratacao')
  {
    return cuidados
  }
  return 'hoje'
}

export function cuidadosTabHash(tab: CuidadosTab): string
{
  return tab
}
