import { useWindowDimensions } from 'react-native'
import { BREAKPOINT } from '@simply-life/ui-tokens'

/** Tablet/desktop: main + rail (Fase 3) */
export function useWorkspace()
{
  const { width } = useWindowDimensions()
  const isTablet = width >= BREAKPOINT.tablet
  const isDesktop = width >= BREAKPOINT.desktop
  return {
    width,
    isTablet,
    isDesktop,
    showRail: isDesktop,
    // Desktop ocupa a largura do painel (Medline); tablet ainda limita um pouco
    contentMaxWidth: isDesktop ? undefined : isTablet ? 720 : undefined as number | undefined,
  }
}
