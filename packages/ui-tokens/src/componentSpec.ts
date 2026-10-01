/**
 * Spec dos componentes base - contrato visual para Expo e (opcional) web.
 */

export const COMPONENT_SPEC = {
  Screen: {
    /** Gutter de tela; 16 em telefones estreitos (< 360) */
    paddingHorizontal: 20,
    paddingHorizontalNarrow: 16,
    /** Título da tela ao primeiro conteúdo */
    titleGap: 24,
    /** Entre seções */
    sectionGap: 32,
    paddingBottom: 88,
    background: 'canvas',
  },
  Card: {
    radius: 20,
    padding: 20,
    /** Cards compactos (grade de números, chips grandes) */
    paddingCompact: 16,
    /** Entre cards vizinhos */
    gap: 16,
    /** Título do card ao corpo */
    titleGap: 8,
    background: 'surface',
    elevation: 'card',
  },
  SectionHeader: {
    titleRole: 'section',
    captionRole: 'caption',
    gap: 4,
    /** Mais ar acima do que abaixo (proximidade) */
    marginTop: 32,
    marginBottom: 12,
  },
  PillTabs: {
    height: 44,
    radius: 999,
    activeBg: 'axelMuted',
    activeFg: 'axel',
    idleFg: 'inkMuted',
    gap: 4,
  },
  ListRow: {
    /** Uma linha 56, duas linhas 72 */
    minHeight: 56,
    minHeightTwoLine: 72,
    paddingVertical: 12,
    paddingHorizontal: 12,
    titleRole: 'bodyStrong',
    subtitleRole: 'caption',
  },
  PrimaryButton: {
    minHeight: 48,
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
    radius: 20,
    padding: 20,
    chartMinHeight: 110,
  },
  EmptyState: {
    iconSize: 22,
    titleRole: 'section',
    bodyRole: 'body',
    padding: 20,
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
