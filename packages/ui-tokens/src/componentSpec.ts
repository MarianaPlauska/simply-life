/**
 * Spec dos componentes base - contrato visual para Expo e (opcional) web.
 */

export const COMPONENT_SPEC = {
  Screen: {
    paddingHorizontal: 14,
    paddingBottom: 88,
    background: 'canvas',
  },
  Card: {
    radius: 24,
    padding: 16,
    background: 'surface',
    elevation: 'card',
  },
  SectionHeader: {
    titleRole: 'section',
    captionRole: 'caption',
    gap: 2,
    marginBottom: 4,
  },
  PillTabs: {
    height: 34,
    radius: 999,
    activeBg: 'axelMuted',
    activeFg: 'axel',
    idleFg: 'inkMuted',
    gap: 4,
  },
  ListRow: {
    minHeight: 42,
    paddingVertical: 7,
    paddingHorizontal: 8,
    titleRole: 'bodyStrong',
    subtitleRole: 'caption',
  },
  PrimaryButton: {
    minHeight: 44,
    radius: 999,
    background: 'axel',
    foreground: 'axelOnFill',
    labelRole: 'bodyStrong',
    /** primary=salvar · secondary=editar · ghost=fechar · danger=excluir */
    roles: ['primary', 'secondary', 'ghost', 'link', 'danger', 'success'],
  },
  FAB: {
    size: 50,
    radius: 14,
    background: 'axel',
    iconSize: 20,
  },
  ChartCard: {
    radius: 24,
    padding: 14,
    chartMinHeight: 110,
  },
  EmptyState: {
    iconSize: 22,
    titleRole: 'section',
    bodyRole: 'body',
    padding: 12,
  },
} as const

/** Critérios de aceite visual - “parece app de loja” */
export const ACCEPTANCE = {
  minBodyPx: 13,
  cardRadiusMin: 24,
  touchMin: 44,
  noMonoUppercaseAsDefault: true,
  axelNotGenericChrome: true,
  stableShellAcrossTabs: true,
} as const
