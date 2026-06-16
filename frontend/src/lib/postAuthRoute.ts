import { isSetupComplete, loadWorkspacePrefs } from './userWorkspacePrefs'

/** Rota pós-login: wizard se setup incompleto */
export async function resolvePostAuthPath(): Promise<string>
{
  const prefs = await loadWorkspacePrefs()
  return isSetupComplete(prefs) ? '/' : '/setup'
}
