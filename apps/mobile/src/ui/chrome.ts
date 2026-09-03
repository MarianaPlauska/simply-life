import { TAB_BAR_CONTENT_HEIGHT } from '@simply-life/ui-tokens'

/** Padding inferior das telas com tab bar - content + safe area mínima */
export function tabBarScreenPadding(bottomInset: number): number
{
  return TAB_BAR_CONTENT_HEIGHT + Math.max(bottomInset, 10) + 16
}
