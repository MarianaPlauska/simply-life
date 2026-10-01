import { useMemo } from 'react'
import { usePrefsStore } from '../store/prefsStore'
import {
  isGroupOn,
  isModuleOn,
  type AppModuleGroup,
  type AppModuleId,
} from '../lib/appModules'

/** O que está ligado no app. Sem escolha salva, tudo aparece. */
export function useModules()
{
  const enabled = usePrefsStore((s) => s.prefs.enabled_modules)
  return useMemo(() => ({
    enabled,
    on: (id: AppModuleId) => isModuleOn(enabled, id),
    group: (g: AppModuleGroup) => isGroupOn(enabled, g),
    any: (...ids: AppModuleId[]) => ids.some((id) => isModuleOn(enabled, id)),
  }), [enabled])
}
