/**
 * Spec dos componentes base — contrato visual para Expo e (opcional) web.
 */

export const COMPONENT_SPEC = {
  Screen: {
    paddingHorizontal: 16,
    paddingBottom: 96,
    background: 'canvas',
  },
  Card: {
    radius: 20,
    padding: 16,
    background: 'surface',
    elevation: 'card',
  },
  SectionHeader: {
    titleRole: 'section',
    captionRole: 'caption',
    gap: 4,
    marginBottom: 12,
  },
  PillTabs: {
    height: 44,
    radius: 999,
    activeBg: 'axelMuted',
    activeFg: 'axel',
    idleFg: 'inkMuted',
    gap: 8,
  },
  ListRow: {
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: 16,
    titleRole: 'bodyStrong',
    subtitleRole: 'caption',
  },
  PrimaryButton: {
    minHeight: 48,
    radius: 12,
    background: 'axel',
    foreground: 'axelOnFill',
    labelRole: 'bodyStrong',
  },
  FAB: {
    size: 56,
    radius: 16,
    background: 'axel',
    iconSize: 24,
  },
  ChartCard: {
    radius: 20,
    padding: 16,
    chartMinHeight: 168,
  },
  EmptyState: {
    iconSize: 36,
    titleRole: 'section',
    bodyRole: 'body',
    padding: 32,
  },
} as const

/** Critérios de aceite visual — “parece app de loja” */
export const ACCEPTANCE = {
  minBodyPx: 13,
  cardRadiusMin: 16,
  touchMin: 44,
  noMonoUppercaseAsDefault: true,
  axelNotGenericChrome: true,
  stableShellAcrossTabs: true,
} as const
