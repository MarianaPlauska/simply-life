import { useWindowDimensions } from 'react-native'
import { BREAKPOINT } from '@simply-life/ui-tokens'

export function useWorkspace()
{
  const { width } = useWindowDimensions()
  const isMobile = width < BREAKPOINT.tablet
  const isTablet = width >= BREAKPOINT.tablet && width < BREAKPOINT.desktop
  const isDesktop = width >= BREAKPOINT.desktop
  const showRail = !isMobile

  return {
    width,
    isMobile,
    isTablet,
    isDesktop,
    showRail,
    contentMaxWidth: isDesktop ? undefined : isTablet ? 720 : undefined as number | undefined,
  }
}
